// GET /api/v1/certificates/verify/[hash]
// Public QR verification endpoint for platform-issued credentials (FR-111, QA-06).
// No authentication required. Unified Phase B error & success envelope.

import { apiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api/envelope';
import { certificateService } from '@/lib/modules/certificate/certificate.service';

export const GET = apiRoute<any, any, { hash: string }>(
  {
    requireAuth: false,
    rateLimit: { limit: 60, windowMs: 60000 },
  },
  async ({ params, requestId }) => {
    const result = await certificateService.verifyByHash(params.hash);

    if (!result.valid) {
      return createErrorResponse(
        'NOT_FOUND',
        'Certificate not found or hash verification failed',
        404,
        requestId,
        [{ field: 'hash', message: 'Invalid certificate hash' }]
      );
    }

    return createSuccessResponse(result, { requestId });
  }
);
