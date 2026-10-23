// POST /api/v1/certificates — Upload self-reported or issue platform certificate
// GET /api/v1/certificates — List certificates with clamped pagination
// Strictly idempotent with Phase B unified error envelope & RBAC

import { z } from 'zod';
import { apiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api/envelope';
import { certificateService } from '@/lib/modules/certificate/certificate.service';

const postCertificateSchema = z
  .object({
    type: z.enum(['platform_issued', 'self_reported']).optional().default('self_reported'),
    activityId: z.string().optional(),
    studentId: z.string().optional(),
    activityTitle: z.string().optional(),
    externalProvider: z.string().optional(),
    externalFileUrl: z.string().url().optional(),
    issueDate: z.string().optional(),
    expiryDate: z.string().optional(),
    credentialId: z.string().optional(),
    verificationUrl: z.string().url().optional(),
  })
  .strict();

const getCertificatesQuerySchema = z
  .object({
    activityId: z.string().optional(),
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 20, 50)),
  })
  .strict();

export const POST = apiRoute(
  {
    requireAuth: true,
    roles: ['student', 'coordinator', 'super_admin'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: postCertificateSchema,
  },
  async ({ body, user, requestId }) => {
    if (body.type === 'platform_issued') {
      if (!['coordinator', 'super_admin'].includes(user.role)) {
        return createErrorResponse(
          'FORBIDDEN',
          'Only coordinators and administrators can issue platform certificates',
          403,
          requestId
        );
      }
      if (!body.activityId || !body.studentId) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'activityId and studentId are required for platform certificates',
          422,
          requestId
        );
      }
      const cert = await certificateService.issuePlatformCertificate(
        body.activityId,
        body.studentId,
        user.userId
      );
      return createSuccessResponse(cert, { status: 201, requestId });
    }

    // Default: Self-reported certificate (FR-112, FR-113)
    if (!body.activityTitle || !body.externalProvider || !body.externalFileUrl) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'activityTitle, externalProvider, and externalFileUrl are required for self-reported certificates',
        422,
        requestId
      );
    }

    const cert = await certificateService.uploadSelfReported(body as any, user);
    return createSuccessResponse(cert, { status: 201, requestId });
  }
);

export const GET = apiRoute(
  {
    requireAuth: true,
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: getCertificatesQuerySchema,
  },
  async ({ query, user, requestId }) => {
    const limit = query.limit || 20;

    if (query.activityId) {
      const officialCerts = await certificateService.listOfficialByActivity(query.activityId, user);
      const paginated = officialCerts.slice(0, limit);
      return createSuccessResponse(paginated, {
        requestId,
        pagination: {
          limit,
          hasMore: officialCerts.length > limit,
          nextCursor: officialCerts.length > limit ? paginated[paginated.length - 1]?.id : null,
          total: officialCerts.length,
        },
      });
    }

    const myCerts = await certificateService.listMyCertificates(user);
    const paginated = myCerts.slice(0, limit);
    return createSuccessResponse(paginated, {
      requestId,
      pagination: {
        limit,
        hasMore: myCerts.length > limit,
        nextCursor: myCerts.length > limit ? paginated[paginated.length - 1]?.id : null,
        total: myCerts.length,
      },
    });
  }
);
