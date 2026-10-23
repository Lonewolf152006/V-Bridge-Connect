import { z } from 'zod';
import { apiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api/envelope';
import prisma from '@/lib/db/prisma';

const getPrsQuerySchema = z
  .object({
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 20, 50)),
    status: z.enum(['OPEN', 'MERGED', 'CLOSED']).optional(),
  })
  .strict();

const createPrSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200),
    branch: z.string().min(1, 'Branch is required').max(100),
    targetBranch: z.string().max(100).default('main'),
    labels: z.array(z.string()).optional(),
    reviewers: z
      .array(
        z.object({
          name: z.string(),
          status: z.string(),
        })
      )
      .optional(),
  })
  .strict();

export const GET = apiRoute(
  {
    requireAuth: true,
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: getPrsQuerySchema,
  },
  async ({ params, query, requestId }) => {
    const id = params.id;
    const limit = query.limit || 20;

    let team = await prisma.team.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!team) {
      team = await prisma.team.findFirst({
        where: {
          OR: [
            { name: { equals: id, mode: 'insensitive' } },
            { name: { equals: id.replace(/^team-/i, '').replace(/-/g, ' '), mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
    }

    if (!team) {
      return createSuccessResponse([], {
        requestId,
        pagination: { limit, hasMore: false },
      });
    }

    const prs = await prisma.teamPullRequest.findMany({
      where: {
        teamId: team.id,
        ...(query.status ? { status: query.status } : {}),
      },
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    const hasMore = prs.length > limit;
    const paginatedPrs = hasMore ? prs.slice(0, limit) : prs;

    const mappedPrs = paginatedPrs.map((p) => ({
      id: p.id,
      title: p.title,
      branch: p.branch,
      targetBranch: p.targetBranch,
      author: p.author?.name || p.authorName,
      authorAvatar: p.author?.avatarUrl || p.authorAvatar || '',
      status: p.status as 'OPEN' | 'MERGED' | 'CLOSED',
      createdAt: p.createdAt.toISOString(),
      commentsCount: p.commentsCount,
      reviewers: Array.isArray(p.reviewers) ? p.reviewers : [],
      labels: Array.isArray(p.labels) ? p.labels : [],
    }));

    return createSuccessResponse(mappedPrs, {
      requestId,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore ? String(mappedPrs[mappedPrs.length - 1]?.id) : null,
      },
    });
  }
);

export const POST = apiRoute(
  {
    requireAuth: true,
    roles: ['student', 'coordinator', 'super_admin', 'industry_partner'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: createPrSchema,
  },
  async ({ params, body, user, requestId }) => {
    const id = params.id;

    let team = await prisma.team.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!team) {
      team = await prisma.team.findFirst({
        where: {
          OR: [
            { name: { equals: id, mode: 'insensitive' } },
            { name: { equals: id.replace(/^team-/i, '').replace(/-/g, ' '), mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
    }

    if (!team) {
      return createErrorResponse('NOT_FOUND', 'Team not found', 404, requestId);
    }

    const createdPr = await prisma.teamPullRequest.create({
      data: {
        teamId: team.id,
        title: body.title.trim(),
        branch: body.branch.trim(),
        targetBranch: (body.targetBranch || 'main').trim(),
        authorId: user.userId || null,
        authorName: user.name || user.email || 'Student Author',
        authorAvatar: user.avatarUrl || null,
        status: 'OPEN',
        commentsCount: 0,
        reviewers:
          body.reviewers && body.reviewers.length > 0
            ? body.reviewers
            : [{ name: 'Faculty Lead / Industry Guide', status: 'PENDING' }],
        labels: body.labels && body.labels.length > 0 ? body.labels : ['student-submission', 'in-review'],
      },
    });

    return createSuccessResponse(
      {
        id: createdPr.id,
        title: createdPr.title,
        branch: createdPr.branch,
        targetBranch: createdPr.targetBranch,
        author: createdPr.authorName,
        authorAvatar: createdPr.authorAvatar || '',
        status: createdPr.status,
        createdAt: createdPr.createdAt.toISOString(),
        commentsCount: createdPr.commentsCount,
        reviewers: createdPr.reviewers,
        labels: createdPr.labels,
      },
      { status: 201, requestId }
    );
  }
);
