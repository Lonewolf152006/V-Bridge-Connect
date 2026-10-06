// POST /api/v1/uploads/certificate
// Generates a short-lived presigned AWS S3 upload URL for certificates (FR-112).
// Browser uploads directly to AWS S3. File bytes never enter Next.js server.

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';
import { getCertificateUploadUrl } from '@/lib/integrations/s3';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'student', 'coordinator', 'super_admin');
    const body = await request.json();

    if (!body.fileName || !body.contentType) {
      return Response.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }

    const result = await getCertificateUploadUrl({
      fileName: body.fileName,
      contentType: body.contentType,
      userId: user.userId,
      fileSizeBytes: body.fileSizeBytes,
    });

    return Response.json({ data: result });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to generate upload URL' }, { status: 400 });
  }
}
