// POST /api/v1/teams — Create team
// GET /api/v1/teams — List teams by activity

import { NextRequest } from 'next/server';
import { teamService } from '@/lib/modules/team/team.service';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'student', 'coordinator', 'super_admin');
    const body = await request.json();

    if (!body.activityId || !body.name) {
      return Response.json(
        { error: 'activityId and name are required' },
        { status: 400 }
      );
    }

    const team = await teamService.createTeam(body, user);
    return Response.json({ data: team }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to create team' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');

    if (!activityId) {
      return Response.json(
        { error: 'activityId query parameter is required' },
        { status: 400 }
      );
    }

    const teams = await teamService.listByActivity(activityId, user);
    return Response.json({ data: teams });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to list teams' }, { status: 500 });
  }
}
