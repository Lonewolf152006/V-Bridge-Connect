// POST /api/v1/certificates/[id]/[verb]
// Action-based state transition endpoint for certificates (e.g. revoke — FR-116).

import { NextRequest } from 'next/server';
import { certificateService } from '@/lib/modules/certificate/certificate.service';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';
import { CertificateTransitionError } from '@/lib/modules/certificate/certificate.state-machine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; verb: string }> }
) {
  try {
    const user = await requireAuth(request, 'coordinator', 'super_admin');
    const { id, verb } = await params;
    const body = await request.json();

    if (verb === 'revoke') {
      if (!body.reason) {
        return Response.json(
          { error: 'Revocation reason is required (FR-116)' },
          { status: 400 }
        );
      }
      const updated = await certificateService.revokePlatformCertificate(id, body.reason, user);
      return Response.json({ data: updated });
    }

    return Response.json({ error: `Unknown certificate action: "${verb}"` }, { status: 400 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof CertificateTransitionError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    return Response.json({ error: error.message || 'Action failed' }, { status: 400 });
  }
}
