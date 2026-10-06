// POST /api/v1/teams/[id]/lead — Reassign single team lead (FR-022)

import { NextRequest } from 'next/server';
import { teamService } from '@/lib/modules/team/team.service';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request, 'student', 'coordinator', 'super_admin');
    const { id } = await params;
    const body = await request.json();

    if (!body.newLeadUserId) {
      return Response.json({ error: 'newLeadUserId is required' }, { status: 400 });
    }

    const result = await teamService.changeLead(id, body.newLeadUserId, user);
    return Response.json({ data: result });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to change team lead' }, { status: 400 });
  }
}
