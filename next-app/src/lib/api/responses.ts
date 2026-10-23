// VBridgeConnect — API Response Helpers
// Consistent response shape for all API routes.

import { NextResponse } from 'next/server';
import { AuthError } from '@/lib/auth/jwt';
import { registerAllSubscribers } from '@/lib/events/register';

// Ensure event subscribers are registered on first API call
registerAllSubscribers();

export function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json(
    { success: true, data, generatedAt: new Date().toISOString() },
    { status }
  );
}

export function listResponse(
  data: unknown[],
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    limit,
    generatedAt: new Date().toISOString(),
  });
}

export function errorResponse(
  message: string,
  status: number = 400,
  details: any[] = []
) {
  const code =
    status === 401
      ? 'UNAUTHORIZED'
      : status === 403
      ? 'FORBIDDEN'
      : status === 404
      ? 'NOT_FOUND'
      : status === 409
      ? 'CONFLICT'
      : status === 422
      ? 'VALIDATION_ERROR'
      : status === 429
      ? 'RATE_LIMITED'
      : status >= 500
      ? 'INTERNAL_SERVER_ERROR'
      : 'BAD_REQUEST';

  const requestId = crypto.randomUUID();
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        requestId,
      },
    },
    {
      status,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Request-Id': requestId,
      },
    }
  );
}

/**
 * Standard error handler for API routes.
 * Maps known error types to appropriate HTTP status codes and unified envelope.
 */
export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return errorResponse(error.message, error.statusCode);
  }

  // State machine transition errors → 409 Conflict
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
    return errorResponse(error.message, 409);
  }

  console.error('[API Error]', error);
  return errorResponse(
    error instanceof Error ? error.message : 'Internal server error',
    500
  );
}
