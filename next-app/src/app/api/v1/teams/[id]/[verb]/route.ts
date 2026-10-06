// POST /api/v1/teams/[id]/[verb]
// Action-based state transition endpoints for team risk (PRD Section 9, FR-034).
// Verbs: flag-watch, flag-risk, flag-blocked, resolve-risk, downgrade-risk.

import { NextRequest } from 'next/server';
import { teamService } from '@/lib/modules/team/team.service';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';
import {
  TeamRiskTransitionError,
  TEAM_RISK_TRANSITIONS,
} from '@/lib/modules/team/team.state-machine';

import { withIdempotency } from '@/lib/api/idempotency';
import { NextResponse } from 'next/server';

const ALLOWED_TEAM_VERBS = new Set(TEAM_RISK_TRANSITIONS.map((t) => t.verb));

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; verb: string }> }
) {
  try {
    const user = await requireAuth(request, 'coordinator', 'super_admin');
    const { id, verb } = await params;

    if (!ALLOWED_TEAM_VERBS.has(verb)) {
      return NextResponse.json(
        { error: `Unknown transition verb: ${verb}` },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty if no reason required
    }

    const idempotencyKey =
      request.headers.get('idempotency-key') ||
      request.headers.get('x-idempotency-key');

    return await withIdempotency(idempotencyKey, async () => {
      const updated = await teamService.transitionRisk(id, verb, body?.reason, user);
      return NextResponse.json({ data: updated });
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof TeamRiskTransitionError) {
      return NextResponse.json(
        {
          error: error.message,
          currentStatus: error.currentStatus,
          attemptedVerb: error.attemptedVerb,
          allowedVerbs: error.allowedVerbs,
        },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: error.message || 'Risk transition failed' }, { status: 400 });
  }
}
