// POST /api/v1/certificates — Upload self-reported or issue platform certificate
// GET /api/v1/certificates — List certificates

import { NextRequest } from 'next/server';
import { certificateService } from '@/lib/modules/certificate/certificate.service';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'student', 'coordinator', 'super_admin');
    const body = await request.json();

    if (body.type === 'platform_issued') {
      // Platform issuance requires coordinator or super_admin
      if (!['coordinator', 'super_admin'].includes(user.role)) {
        throw new AuthError('Only coordinators can issue platform certificates', 403);
      }
      if (!body.activityId || !body.studentId) {
        return Response.json(
          { error: 'activityId and studentId are required for platform certificates' },
          { status: 400 }
        );
      }
      const cert = await certificateService.issuePlatformCertificate(
        body.activityId,
        body.studentId,
        user.userId
      );
      return Response.json({ data: cert }, { status: 201 });
    }

    // Default: Self-reported certificate (FR-112, FR-113)
    if (!body.activityTitle || !body.externalProvider || !body.externalFileUrl) {
      return Response.json(
        { error: 'activityTitle, externalProvider, and externalFileUrl are required' },
        { status: 400 }
      );
    }

    const cert = await certificateService.uploadSelfReported(body, user);
    return Response.json({ data: cert }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to process certificate' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');

    if (activityId) {
      // Coordinator view: official platform-issued certificates only (FR-115)
      const officialCerts = await certificateService.listOfficialByActivity(activityId, user);
      return Response.json({ data: officialCerts });
    }

    // Student view: all their certificates (FR-117)
    const myCerts = await certificateService.listMyCertificates(user);
    return Response.json({ data: myCerts });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to list certificates' }, { status: 500 });
  }
}
