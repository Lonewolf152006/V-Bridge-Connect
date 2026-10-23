import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';
import { requireAuth, type Role } from '@/lib/auth/rbac';
export type UserRole = Role;
import { AuthError } from '@/lib/auth/jwt';
import { checkRateLimit, RateLimitOptions } from '@/lib/api/rate-limiter';
import { withIdempotency } from '@/lib/api/idempotency';
import crypto from 'node:crypto';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCode;
    message: string;
    details: ApiErrorDetail[];
    requestId: string;
  };
}

export interface PaginationMeta {
  nextCursor?: string | null;
  hasMore: boolean;
  limit: number;
  total?: number;
}

export interface ApiResponseOptions {
  status?: number;
  headers?: Record<string, string>;
  requestId?: string;
  pagination?: PaginationMeta;
}

const DEFAULT_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  requestId: string = crypto.randomUUID(),
  details: ApiErrorDetail[] = [],
  customHeaders: Record<string, string> = {}
): NextResponse {
  const payload: ApiErrorEnvelope = {
    error: {
      code,
      message,
      details,
      requestId,
    },
  };

  return NextResponse.json(payload, {
    status,
    headers: {
      ...DEFAULT_SECURITY_HEADERS,
      'X-Request-Id': requestId,
      ...customHeaders,
    },
  });
}

export function createSuccessResponse(
  data: unknown,
  options: ApiResponseOptions = {}
): NextResponse {
  const {
    status = 200,
    headers = {},
    requestId = crypto.randomUUID(),
    pagination,
  } = options;

  const payload: Record<string, any> = {
    success: true,
    data,
    requestId,
  };

  if (pagination) {
    payload.pagination = pagination;
  }

  return NextResponse.json(payload, {
    status,
    headers: {
      ...DEFAULT_SECURITY_HEADERS,
      'X-Request-Id': requestId,
      ...headers,
    },
  });
}

/**
 * Maps any caught exception into the unified Phase B API Error Envelope.
 */
export function formatApiError(error: unknown, requestId: string = crypto.randomUUID()): NextResponse {
  // 1. Zod Validation Error
  if (error instanceof ZodError) {
    const details: ApiErrorDetail[] = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    return createErrorResponse(
      'VALIDATION_ERROR',
      'Request input validation failed',
      422,
      requestId,
      details
    );
  }

  // 2. Auth / RBAC Errors
  if (error instanceof AuthError) {
    const code = error.statusCode === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED';
    return createErrorResponse(code, error.message, error.statusCode, requestId);
  }

  // 3. State Machine Transition Conflict Errors
  if (
    error instanceof Error &&
    (error.name === 'ActivityTransitionError' ||
      error.name === 'MilestoneTransitionError' ||
      error.name === 'SubmissionTransitionError' ||
      error.name === 'ApplicationTransitionError' ||
      error.name === 'CertificateTransitionError' ||
      error.message.includes('Invalid transition') ||
      error.message.includes('Cannot transition'))
  ) {
    return createErrorResponse('CONFLICT', error.message, 409, requestId);
  }

  // 4. Resource Not Found (Prisma P2025 or "not found" in message)
  if (
    error instanceof Error &&
    (error.message.includes('Record to update not found') ||
      error.message.includes('Record not found') ||
      error.message.toLowerCase().includes('not found') ||
      (error as any).code === 'P2025')
  ) {
    return createErrorResponse('NOT_FOUND', error.message || 'Requested resource was not found', 404, requestId);
  }

  // 4b. Invalid UUID or Column Format (Prisma P2023)
  if (
    error instanceof Error &&
    ((error as any).code === 'P2023' ||
      error.message.includes('Error creating UUID') ||
      error.message.includes('Inconsistent column data'))
  ) {
    return createErrorResponse('VALIDATION_ERROR', 'Invalid identifier or UUID parameter format', 422, requestId);
  }

  // 4c. Unique Constraint Violation (Prisma P2002)
  if (
    error instanceof Error &&
    ((error as any).code === 'P2002' || error.message.toLowerCase().includes('already exists'))
  ) {
    return createErrorResponse('CONFLICT', error.message || 'Resource conflict occurred', 409, requestId);
  }

  // 5. Explicit Custom Error with Status
  const customStatus = (error as any)?.statusCode || (error as any)?.status;
  if (typeof customStatus === 'number' && customStatus >= 400 && customStatus < 500) {
    const code: ApiErrorCode =
      customStatus === 404
        ? 'NOT_FOUND'
        : customStatus === 409
        ? 'CONFLICT'
        : customStatus === 403
        ? 'FORBIDDEN'
        : customStatus === 401
        ? 'UNAUTHORIZED'
        : 'BAD_REQUEST';

    return createErrorResponse(
      code,
      error instanceof Error ? error.message : 'Invalid request',
      customStatus,
      requestId
    );
  }

  // 6. Generic Internal Server Error (Never leak stack traces)
  console.error(`[API Internal Error] [req:${requestId}]`, error);
  return createErrorResponse(
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred. Please contact institutional support with the requestId.',
    500,
    requestId
  );
}

/**
 * Standard cursor pagination parser with clamping (limit <= 50).
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const cursor = searchParams.get('cursor') || undefined;
  const rawLimit = searchParams.get('limit');
  let limit = 20;

  if (rawLimit) {
    const parsed = parseInt(rawLimit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 50); // Clamp to max 50
    }
  }

  return { cursor, limit };
}

/**
 * Standard cursor pagination schema with clamped limit (default 20, max 50).
 */
export const basePaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (!val) return 20;
      const parsed = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(parsed) || parsed < 1) return 20;
      return Math.min(parsed, 50); // Clamped to max 50
    }),
});

export interface RouteContext<TParams = any> {
  params: Promise<TParams>;
}

export interface RouteConfig<TBody = any, TQuery = any> {
  requireAuth?: boolean;
  roles?: UserRole[];
  bodySchema?: ZodSchema<TBody>;
  querySchema?: ZodSchema<TQuery>;
  idempotent?: boolean;
  rateLimit?: RateLimitOptions;
}

export type RouteHandler<TBody = any, TQuery = any, TParams = any> = (context: {
  request: NextRequest;
  user: any;
  body: TBody;
  query: TQuery;
  params: TParams;
  requestId: string;
}) => Promise<NextResponse>;

/**
 * Declarative route wrapper enforcing:
 * - Request ID generation
 * - Rate limiting (B6)
 * - Deny-by-default Auth & RBAC (B4)
 * - Strict Zod Body & Query validation (B1, B3)
 * - Idempotency-Key support on mutations (B5)
 * - Unified JSON error envelope (B1)
 */
export function apiRoute<TBody = any, TQuery = any, TParams = any>(
  config: RouteConfig<TBody, TQuery>,
  handler: RouteHandler<TBody, TQuery, TParams>
) {
  return async (request: NextRequest, routeContext: RouteContext<TParams>): Promise<NextResponse> => {
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

    // 1. Rate Limiting Check
    if (config.rateLimit) {
      const limited = await checkRateLimit(request, undefined, config.rateLimit);
      if (limited) {
        return createErrorResponse(
          'RATE_LIMITED',
          'Rate limit exceeded. Please back off before retrying.',
          429,
          requestId,
          [],
          {
            'Retry-After': limited.headers.get('Retry-After') || '60',
          }
        );
      }
    }

    // 2. Authentication & RBAC Check
    let user: any = null;
    if (config.requireAuth !== false) {
      try {
        if (config.roles && config.roles.length > 0) {
          user = await requireAuth(request, ...config.roles);
        } else {
          user = await requireAuth(request);
        }
      } catch (authErr) {
        return formatApiError(authErr, requestId);
      }
    }

    // Execution Core
    const execute = async (): Promise<NextResponse> => {
      try {
        // 3. Query Param Validation
        let queryData: any = {};
        if (config.querySchema) {
          const searchParams = new URL(request.url).searchParams;
          const rawQuery: Record<string, any> = {};
          searchParams.forEach((val, key) => {
            rawQuery[key] = val;
          });
          queryData = config.querySchema.parse(rawQuery);
        }

        // 4. Request Body Validation
        let bodyData: any = {};
        if (config.bodySchema) {
          let rawJson: any;
          try {
            rawJson = await request.json();
          } catch {
            return createErrorResponse(
              'VALIDATION_ERROR',
              'Invalid JSON body in request',
              422,
              requestId
            );
          }
          bodyData = config.bodySchema.parse(rawJson);
        }

        const resolvedParams = routeContext?.params ? await routeContext.params : ({} as TParams);

        return await handler({
          request,
          user,
          body: bodyData,
          query: queryData,
          params: resolvedParams,
          requestId,
        });
      } catch (err) {
        return formatApiError(err, requestId);
      }
    };

    // 5. Idempotency Support on Mutating Operations
    if (config.idempotent) {
      const idempotencyKey =
        request.headers.get('idempotency-key') ||
        request.headers.get('x-idempotency-key');

      return withIdempotency(idempotencyKey, execute);
    }

    return execute();
  };
}
