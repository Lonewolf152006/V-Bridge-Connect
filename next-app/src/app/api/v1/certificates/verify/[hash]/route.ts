// GET /api/v1/certificates/verify/[hash]
// Public QR verification endpoint for platform-issued credentials (FR-111, QA-06).
// No authentication required.

import { NextRequest } from 'next/server';
import { certificateService } from '@/lib/modules/certificate/certificate.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;
    const result = await certificateService.verifyByHash(hash);

    if (!result.valid) {
      return Response.json({ data: result }, { status: 404 });
    }

    return Response.json({ data: result });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
