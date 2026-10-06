// GET /api/v1/teams/[id] — Team detail endpoint (scoped)

import { NextRequest } from 'next/server';
import { teamService } from '@/lib/modules/team/team.service';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const team = await teamService.getById(id, user);
    return Response.json({ data: team });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Team not found' }, { status: 404 });
  }
}
