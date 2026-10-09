// POST /api/v1/teams/[id]/members — Add member
// DELETE /api/v1/teams/[id]/members — Remove member (requires reason — FR-023)

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

    if (!body.userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    const membership = await teamService.addMember(id, body, user);
    return Response.json({ data: membership }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to add member' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request, 'student', 'coordinator', 'super_admin');
    const { id } = await params;
    const body = await request.json();

    if (!body.userId || !body.reason) {
      return Response.json(
        { error: 'userId and reason are required for membership removal (FR-023)' },
        { status: 400 }
      );
    }

    const updated = await teamService.removeMember(id, body.userId, body.reason, user);
    return Response.json({ data: updated });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to remove member' }, { status: 400 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request, 'student', 'coordinator', 'super_admin', 'industry_partner');
    const { id } = await params;
    const body = await request.json();

    if (body.newLeadUserId) {
      const result = await teamService.changeLead(id, body.newLeadUserId, user);
      return Response.json({ success: true, data: result });
    }

    if (body.memberRoles && typeof body.memberRoles === 'object') {
      const leadEntry = Object.entries(body.memberRoles).find(
        ([_, role]) => String(role).toUpperCase() === 'LEAD'
      );
      if (leadEntry) {
        const result = await teamService.changeLead(id, leadEntry[0], user);
        return Response.json({ success: true, data: result });
      }
    }

    return Response.json({ success: true });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to update member roles' }, { status: 400 });
  }
}
