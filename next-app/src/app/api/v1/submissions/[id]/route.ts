// GET /api/v1/submissions/[id]
// FR-054: All prior submission versions remain visible.

import { NextRequest } from 'next/server';
import { submissionService } from '@/lib/modules/submission/submission.service';
import { requireAuth } from '@/lib/auth/rbac';
import { successResponse, handleApiError, errorResponse } from '@/lib/api/responses';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const submission = await submissionService.findById(id, user);

    if (!submission) return errorResponse('Submission not found', 404);
    return successResponse(submission);
  } catch (error) {
    return handleApiError(error);
  }
}
