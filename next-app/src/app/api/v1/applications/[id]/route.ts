// GET /api/v1/applications/[id] — Fetch single application
// FR-064: Reviewer notes are private and stripped for student applicants.

import { NextRequest } from 'next/server';
import { applicationService } from '@/lib/modules/application/application.service';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const application = await applicationService.getById(id, user);
    return Response.json({ data: application });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Internal server error' }, { status: 404 });
  }
}
