// POST /api/v1/applications/[id]/[verb]
// Action-based state transition endpoints for applications.
// rules.md §2: Transitions are actions (POST /{resource}/{id}/{verb}), never a raw status PATCH.

import { NextRequest } from 'next/server';
import { applicationService } from '@/lib/modules/application/application.service';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';
import {
  ApplicationTransitionError,
  APPLICATION_TRANSITIONS,
} from '@/lib/modules/application/application.state-machine';

import { withIdempotency } from '@/lib/api/idempotency';
import { NextResponse } from 'next/server';

const ALLOWED_APPLICATION_VERBS = new Set(APPLICATION_TRANSITIONS.map((t) => t.verb));

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; verb: string }> }
) {
  try {
    const user = await requireAuth(request, 'student', 'coordinator', 'super_admin');
    const { id, verb } = await params;

    if (!ALLOWED_APPLICATION_VERBS.has(verb)) {
      return NextResponse.json(
        { error: `Unknown transition verb: ${verb}` },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is allowed for transitions without payloads
    }

    const idempotencyKey =
      request.headers.get('idempotency-key') ||
      request.headers.get('x-idempotency-key');

    return await withIdempotency(idempotencyKey, async () => {
      const updated = await applicationService.transition(id, verb, user, body);
      return NextResponse.json({ data: updated });
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof ApplicationTransitionError) {
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
    return NextResponse.json({ error: error.message || 'Transition failed' }, { status: 400 });
  }
}
