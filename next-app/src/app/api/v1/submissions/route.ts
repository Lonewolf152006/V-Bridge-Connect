// FR-050: Submissions accept files, links, text responses.
// FR-054: All prior submission versions remain visible.

import { NextRequest } from 'next/server';
import { submissionService } from '@/lib/modules/submission/submission.service';
import { requireAuth } from '@/lib/auth/rbac';
import { successResponse, listResponse, handleApiError } from '@/lib/api/responses';

// GET /api/v1/submissions?milestoneId=xxx&teamId=xxx
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('milestoneId');
    const teamId = searchParams.get('teamId');

    if (milestoneId) {
      const submissions = await submissionService.findByMilestoneId(milestoneId, user);
      return listResponse(submissions, submissions.length, 1, submissions.length);
    }

    if (teamId) {
      const submissions = await submissionService.findByTeamId(teamId, user);
      return listResponse(submissions, submissions.length, 1, submissions.length);
    }

    return listResponse([], 0, 1, 0);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/v1/submissions — Create a new submission
// FR-051: Stores timestamp, submitter identity, version number
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'student', 'coordinator', 'super_admin');
    const body = await request.json();

    const submission = await submissionService.createSubmission(
      {
        milestoneId: body.milestoneId,
        teamId: body.teamId,
        fileUrl: body.fileUrl,
        fileName: body.fileName,
        fileSizeBytes: body.fileSizeBytes,
        checksumSha256: body.checksumSha256,
        externalUrl: body.externalUrl,
        studentNote: body.studentNote,
        lateSubmissionReason: body.lateSubmissionReason,
      },
      user
    );

    return successResponse(submission, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
