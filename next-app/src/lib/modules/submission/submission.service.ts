// VBridgeConnect — Submission Service
// FR-050 to FR-055: Submissions, versioning, and review.
// FR-052: Submitted versions are immutable — resubmit always INSERTs a new row.

import { submissionRepository } from './submission.repository';
import {
  validateSubmissionTransition,
  assertSubmissionTransitionRole,
  SubmissionTransitionError,
} from './submission.state-machine';
import eventBus from '@/lib/events/bus';
import { type TokenPayload, AuthError } from '@/lib/auth/jwt';
import { assertTeamScope, assertActivityScope } from '@/lib/auth/rbac';
import prisma from '@/lib/db/prisma';

export const submissionService = {
  /**
   * FR-050: Create a new submission (first version for a milestone).
   * FR-051: Stores timestamp, submitter identity, version number, declaration.
   */
  async createSubmission(
    data: {
      milestoneId: string;
      teamId: string;
      fileUrl?: string;
      fileName?: string;
      fileSizeBytes?: number;
      checksumSha256?: string;
      externalUrl?: string;
      studentNote?: string;
      lateSubmissionReason?: string;
    },
    user: TokenPayload
  ) {
    // Assert user belongs to team or is authorized coordinator/super_admin
    await assertTeamScope(user, data.teamId);

    const version = await submissionRepository.getNextVersion(data.milestoneId);

    const submission = await submissionRepository.createVersion({
      milestoneId: data.milestoneId,
      teamId: data.teamId,
      submittedById: user.userId,
      version,
      status: 'submitted', // Direct submit, skip draft for simplicity
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSizeBytes: data.fileSizeBytes,
      checksumSha256: data.checksumSha256,
      externalUrl: data.externalUrl,
      studentNote: data.studentNote,
      lateSubmissionReason: data.lateSubmissionReason,
    });

    await eventBus.publish({
      type: 'submission.submitted',
      entityType: 'submission',
      entityId: submission.id,
      action: 'submitted',
      actorId: user.userId,
      newValue: { status: 'submitted', version, milestoneId: data.milestoneId },
      timestamp: new Date(),
    });

    return submission;
  },

  /**
   * FR-052: Resubmit — always INSERT a new row (version = previous + 1), never UPDATE.
   * Validates that the current submission is in 'changes_requested' status first.
   */
  async resubmit(
    currentSubmissionId: string,
    data: {
      fileUrl?: string;
      fileName?: string;
      fileSizeBytes?: number;
      checksumSha256?: string;
      externalUrl?: string;
      studentNote?: string;
    },
    user: TokenPayload
  ) {
    const current = await submissionRepository.findById(currentSubmissionId);
    if (!current) throw new AuthError('Submission not found', 404);

    // Assert user belongs to team or is authorized coordinator/super_admin
    await assertTeamScope(user, current.teamId);

    // Validate state transition: changes_requested → submitted
    const transition = validateSubmissionTransition(current.status, 'resubmit');
    assertSubmissionTransitionRole(transition, user.role);

    // FR-052: Create a NEW version, never update the existing one
    const nextVersion = await submissionRepository.getNextVersion(current.milestoneId);

    const newSubmission = await submissionRepository.createVersion({
      milestoneId: current.milestoneId,
      teamId: current.teamId,
      submittedById: user.userId,
      version: nextVersion,
      status: 'submitted',
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSizeBytes: data.fileSizeBytes,
      checksumSha256: data.checksumSha256,
      externalUrl: data.externalUrl,
      studentNote: data.studentNote,
    });

    await eventBus.publish({
      type: 'submission.resubmitted',
      entityType: 'submission',
      entityId: newSubmission.id,
      action: 'resubmitted',
      actorId: user.userId,
      priorValue: { submissionId: currentSubmissionId, version: current.version, status: current.status },
      newValue: { status: 'submitted', version: nextVersion },
      metadata: { previousSubmissionId: currentSubmissionId },
      timestamp: new Date(),
    });

    return newSubmission;
  },

  /**
   * Execute a review transition on a submission (open-review, accept, request-changes, etc.)
   * FR-053: Mentor can set review outcome.
   * FR-055: Milestone-level consolidated feedback is required.
   */
  async transition(
    submissionId: string,
    verb: string,
    user: TokenPayload,
    options?: {
      publicFeedback?: string;
      privateNote?: string;
      rubricScores?: Array<{ criterionId: string; score: number }>;
      totalScore?: number;
      maxScore?: number;
    }
  ) {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) throw new AuthError('Submission not found', 404);

    // Assert user has scope over the submission's team
    await assertTeamScope(user, submission.teamId);

    // 'resubmit' is handled by the resubmit() method above (creates new version)
    if (verb === 'resubmit') {
      throw new SubmissionTransitionError(
        'Use the resubmit endpoint to create a new version',
        submission.status,
        verb,
        []
      );
    }

    const transition = validateSubmissionTransition(submission.status, verb);
    assertSubmissionTransitionRole(transition, user.role);

    const priorStatus = submission.status;

    const extra: Record<string, unknown> = {};
    if (verb === 'accept' || verb === 'request-changes' || verb === 'reject-invalid') {
      extra.reviewerId = user.userId;
      extra.reviewedAt = new Date();
      if (options?.publicFeedback) extra.reviewerPublicFeedback = options.publicFeedback;
      if (options?.privateNote) extra.reviewerPrivateNote = options.privateNote;
    }
    if (verb === 'evaluate') {
      extra.reviewerId = user.userId;
      extra.reviewedAt = new Date();
      if (options?.rubricScores) extra.rubricScores = options.rubricScores;
      if (options?.totalScore !== undefined) extra.totalScore = options.totalScore;
      if (options?.maxScore !== undefined) extra.maxScore = options.maxScore;
      if (options?.publicFeedback) extra.reviewerPublicFeedback = options.publicFeedback;
      if (options?.privateNote) extra.reviewerPrivateNote = options.privateNote;
    }

    const updated = await submissionRepository.updateStatus(
      submissionId,
      transition.to,
      extra as Parameters<typeof submissionRepository.updateStatus>[2]
    );

    const eventType = `submission.${verbToPastTense(verb)}`;
    await eventBus.publish({
      type: eventType,
      entityType: 'submission',
      entityId: submissionId,
      action: verbToPastTense(verb),
      actorId: user.userId,
      priorValue: { status: priorStatus },
      newValue: { status: transition.to },
      timestamp: new Date(),
    });

    return sanitizeSubmission(updated, user);
  },

  async findById(submissionId: string, user?: TokenPayload) {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) return null;
    if (user) {
      await assertTeamScope(user, submission.teamId);
    }
    return sanitizeSubmission(submission, user);
  },

  /**
   * FR-054: All prior submission versions remain visible.
   */
  async findByMilestoneId(milestoneId: string, user?: TokenPayload) {
    if (user) {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        select: { teamId: true, activityId: true },
      });
      if (!milestone) throw new AuthError('Milestone not found', 404);
      if (milestone.teamId) {
        await assertTeamScope(user, milestone.teamId);
      } else {
        await assertActivityScope(user, milestone.activityId);
      }
    }
    const submissions = await submissionRepository.findByMilestoneId(milestoneId);
    return submissions.map((s) => sanitizeSubmission(s, user));
  },

  async findByTeamId(teamId: string, user?: TokenPayload) {
    if (user) {
      await assertTeamScope(user, teamId);
    }
    const submissions = await submissionRepository.findByTeamId(teamId);
    return submissions.map((s) => sanitizeSubmission(s, user));
  },
};

function sanitizeSubmission(sub: any, user?: TokenPayload) {
  if (!sub) return sub;
  if (user && (user.role === 'student' || user.role === 'industry_partner')) {
    const { reviewerPrivateNote, ...sanitized } = sub;
    return sanitized;
  }
  return sub;
}

function verbToPastTense(verb: string): string {
  const mapping: Record<string, string> = {
    'submit': 'submitted',
    'open-review': 'review_opened',
    'request-changes': 'changes_requested',
    'accept': 'accepted',
    'reject-invalid': 'rejected_invalid',
    'evaluate': 'evaluated',
    'resubmit': 'resubmitted',
  };
  return mapping[verb] ?? verb.replace(/-/g, '_');
}
