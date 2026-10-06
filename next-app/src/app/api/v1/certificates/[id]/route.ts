// GET /api/v1/certificates/[id] — Fetch certificate with display distinction
// DELETE /api/v1/certificates/[id] — Remove self-reported certificate

import { NextRequest } from 'next/server';
import { certificateService } from '@/lib/modules/certificate/certificate.service';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const cert = await certificateService.getById(id, user);
    return Response.json({ data: cert });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Certificate not found' }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const result = await certificateService.removeSelfReported(id, user);
    return Response.json({ data: result });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to remove certificate' }, { status: 400 });
  }
}
