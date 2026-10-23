// FR-050: Submissions accept files, links, text responses.
// FR-054: All prior submission versions remain visible.
// Strictly idempotent with Phase B unified error envelope & RBAC

import { z } from 'zod';
import { apiRoute, createSuccessResponse } from '@/lib/api/envelope';
import { submissionService } from '@/lib/modules/submission/submission.service';

const createSubmissionSchema = z
  .object({
    milestoneId: z.string().min(1, 'milestoneId is required'),
    teamId: z.string().min(1, 'teamId is required'),
    fileUrl: z.string().url().optional(),
    fileName: z.string().max(255).optional(),
    fileSizeBytes: z.number().int().nonnegative().optional(),
    checksumSha256: z.string().length(64).optional(),
    externalUrl: z.string().url().optional(),
    studentNote: z.string().max(2000).optional(),
    lateSubmissionReason: z.string().max(500).optional(),
  })
  .strict();

const listSubmissionsQuerySchema = z
  .object({
    milestoneId: z.string().optional(),
    teamId: z.string().optional(),
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 20, 50)),
  })
  .strict();

export const GET = apiRoute(
  {
    requireAuth: true,
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: listSubmissionsQuerySchema,
  },
  async ({ query, user, requestId }) => {
    const limit = query.limit || 20;

    if (query.milestoneId) {
      const submissions = await submissionService.findByMilestoneId(query.milestoneId, user);
      const paginated = submissions.slice(0, limit);
      return createSuccessResponse(paginated, {
        requestId,
        pagination: {
          limit,
          hasMore: submissions.length > limit,
          nextCursor: submissions.length > limit ? paginated[paginated.length - 1]?.id : null,
          total: submissions.length,
        },
      });
    }

    if (query.teamId) {
      const submissions = await submissionService.findByTeamId(query.teamId, user);
      const paginated = submissions.slice(0, limit);
      return createSuccessResponse(paginated, {
        requestId,
        pagination: {
          limit,
          hasMore: submissions.length > limit,
          nextCursor: submissions.length > limit ? paginated[paginated.length - 1]?.id : null,
          total: submissions.length,
        },
      });
    }

    return createSuccessResponse([], {
      requestId,
      pagination: { limit, hasMore: false, total: 0 },
    });
  }
);

export const POST = apiRoute(
  {
    requireAuth: true,
    roles: ['student', 'coordinator', 'super_admin'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: createSubmissionSchema,
  },
  async ({ body, user, requestId }) => {
    const submission = await submissionService.createSubmission(body, user);
    return createSuccessResponse(submission, { status: 201, requestId });
  }
);
