// VBridgeConnect — Submission Repository
// FR-052: Submitted versions are immutable. Resubmission always INSERTs a new row.

import prisma from '@/lib/db/prisma';
import { type SubmissionStatus, type Prisma } from '@prisma/client';

export const submissionRepository = {
  async findById(id: string) {
    return prisma.submission.findUnique({
      where: { id },
      include: {
        submittedBy: { select: { id: true, name: true, email: true, role: true } },
        milestone: { select: { id: true, title: true, activityId: true } },
        team: { select: { id: true, name: true } },
      },
    });
  },

  async findByMilestoneId(milestoneId: string) {
    return prisma.submission.findMany({
      where: { milestoneId },
      orderBy: { version: 'desc' },
      include: {
        submittedBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  },

  async findLatestByMilestone(milestoneId: string) {
    return prisma.submission.findFirst({
      where: { milestoneId },
      orderBy: { version: 'desc' },
    });
  },

  async findByTeamId(teamId: string) {
    return prisma.submission.findMany({
      where: { teamId },
      orderBy: [{ milestoneId: 'asc' }, { version: 'desc' }],
      include: {
        milestone: { select: { id: true, title: true, stageNumber: true } },
        submittedBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Get the next version number for a milestone's submissions.
   * FR-052: version = previous + 1
   */
  async getNextVersion(milestoneId: string): Promise<number> {
    const latest = await prisma.submission.findFirst({
      where: { milestoneId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return (latest?.version ?? 0) + 1;
  },

  /**
   * FR-052: Create a new submission version. Always INSERT, never UPDATE.
   */
  async createVersion(data: {
    milestoneId: string;
    teamId: string;
    submittedById: string;
    version: number;
    status: SubmissionStatus;
    fileUrl?: string;
    fileName?: string;
    fileSizeBytes?: number;
    checksumSha256?: string;
    externalUrl?: string;
    studentNote?: string;
    lateSubmissionReason?: string;
  }) {
    return prisma.submission.create({
      data: {
        milestone: { connect: { id: data.milestoneId } },
        team: { connect: { id: data.teamId } },
        submittedBy: { connect: { id: data.submittedById } },
        version: data.version,
        status: data.status,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSizeBytes: data.fileSizeBytes,
        checksumSha256: data.checksumSha256,
        externalUrl: data.externalUrl,
        studentNote: data.studentNote,
        lateSubmissionReason: data.lateSubmissionReason,
      },
    });
  },

  /**
   * Update status of a specific submission (for review transitions).
   * Note: This updates the status, NOT the content — content is immutable (FR-052).
   */
  async updateStatus(id: string, status: SubmissionStatus, extra?: Partial<{
    reviewerId: string;
    reviewerPublicFeedback: string;
    reviewerPrivateNote: string;
    reviewedAt: Date;
    rubricScores: Prisma.InputJsonValue;
    totalScore: number;
    maxScore: number;
  }>) {
    return prisma.submission.update({
      where: { id },
      data: { status, ...extra },
    });
  },
};
