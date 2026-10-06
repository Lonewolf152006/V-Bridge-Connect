// POST /api/v1/submissions/[id]/[verb]
// State transition endpoints for submissions.
// rules.md §2: Transitions are actions (POST /{resource}/{id}/{verb}), never a raw status PATCH.

import { NextRequest } from 'next/server';
import { submissionService } from '@/lib/modules/submission/submission.service';
import { requireAuth } from '@/lib/auth/rbac';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/responses';
import { SUBMISSION_TRANSITIONS } from '@/lib/modules/submission/submission.state-machine';
import { withIdempotency } from '@/lib/api/idempotency';

const ALLOWED_SUBMISSION_VERBS = new Set([
  ...SUBMISSION_TRANSITIONS.map((t) => t.verb),
  'resubmit',
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; verb: string }> }
) {
  try {
    const { id, verb } = await params;

    if (!ALLOWED_SUBMISSION_VERBS.has(verb)) {
      return errorResponse(`Unknown transition verb: ${verb}`, 400);
    }
    const body = await request.json().catch(() => ({}));

    // FR-052: Resubmit creates a new version
    if (verb === 'resubmit') {
      const user = await requireAuth(request, 'student', 'coordinator', 'super_admin');
      const newSubmission = await submissionService.resubmit(
        id,
        {
          fileUrl: body.fileUrl,
          fileName: body.fileName,
          fileSizeBytes: body.fileSizeBytes,
          checksumSha256: body.checksumSha256,
          externalUrl: body.externalUrl,
          studentNote: body.studentNote,
        },
        user
      );
      return successResponse(newSubmission, 201);
    }

    const idempotencyKey =
      request.headers.get('idempotency-key') ||
      request.headers.get('x-idempotency-key');

    return await withIdempotency(idempotencyKey, async () => {
      // All other transitions (open-review, accept, request-changes, reject-invalid, evaluate)
      const user = await requireAuth(request, 'coordinator', 'super_admin');
      const updated = await submissionService.transition(id, verb, user, {
        publicFeedback: body.publicFeedback,
        privateNote: body.privateNote,
        rubricScores: body.rubricScores,
        totalScore: body.totalScore,
        maxScore: body.maxScore,
      });

      return successResponse(updated);
    });
  } catch (error) {
    return handleApiError(error);
  }
}
