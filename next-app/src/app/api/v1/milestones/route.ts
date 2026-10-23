// GET & POST /api/v1/milestones
// Strictly idempotent with Phase B unified error envelope & RBAC

import { z } from 'zod';
import { apiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api/envelope';
import prisma from '@/lib/db/prisma';

const getMilestonesQuerySchema = z
  .object({
    activityId: z.string().optional(),
    teamId: z.string().optional(),
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 50, 50)),
  })
  .strict();

const createMilestoneSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional(),
    stageNumber: z.union([z.number(), z.string()]).transform((v) => Number(v)),
    dueDate: z.string().min(1, 'dueDate is required'),
    deliverableType: z.string().max(50).optional().default('PDF'),
    weightage: z.union([z.number(), z.string()]).optional().transform((v) => (v ? Number(v) : 0)),
    activityId: z.string().optional(),
    teamId: z.string().optional(),
  })
  .strict();

export const GET = apiRoute(
  {
    requireAuth: true,
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: getMilestonesQuerySchema,
  },
  async ({ query, requestId }) => {
    const { activityId, teamId } = query;
    const limit = query.limit || 50;

    let effectiveTeamId: string | null = null;
    let resolvedActivityId = activityId;

    if (teamId && teamId !== 'all') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId);
      const normalized = teamId.replace(/^team-/i, '').replace(/-/g, ' ').trim();
      const digits = teamId.match(/\d+/)?.[0];
      const foundTeam = await prisma.team.findFirst({
        where: {
          OR: [
            ...(isUuid ? [{ id: teamId }] : []),
            { name: { equals: teamId, mode: 'insensitive' as const } },
            { name: { equals: normalized, mode: 'insensitive' as const } },
            ...(digits ? [{ name: { contains: digits, mode: 'insensitive' as const } }] : []),
          ],
        },
      });
      if (foundTeam) {
        effectiveTeamId = foundTeam.id;
        if (!resolvedActivityId) resolvedActivityId = foundTeam.activityId;
      } else if (isUuid) {
        effectiveTeamId = teamId;
      }
    }

    const where: any = {};
    if (resolvedActivityId) where.activityId = resolvedActivityId;
    if (effectiveTeamId) {
      where.OR = [{ teamId: null }, { teamId: effectiveTeamId }];
    }

    if (!resolvedActivityId && !effectiveTeamId) {
      const activeAct = await prisma.activity.findFirst({
        where: { title: { contains: 'Semester 5 Mini Project' } },
        select: { id: true },
      });
      if (activeAct) {
        where.activityId = activeAct.id;
      }
    }

    const milestones = await prisma.milestone.findMany({
      where,
      take: limit + 1,
      orderBy: { stageNumber: 'asc' },
      include: {
        team: { select: { id: true, name: true } },
      },
    });

    const hasMore = milestones.length > limit;
    const paginated = hasMore ? milestones.slice(0, limit) : milestones;

    return createSuccessResponse(paginated, {
      requestId,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore ? paginated[paginated.length - 1]?.id : null,
        total: milestones.length,
      },
    });
  }
);

export const POST = apiRoute(
  {
    requireAuth: true,
    roles: ['coordinator', 'super_admin', 'industry_partner'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: createMilestoneSchema,
  },
  async ({ body, requestId }) => {
    let activityId = body.activityId;
    if (!activityId) {
      const activeAct = await prisma.activity.findFirst({
        where: { title: { contains: 'Semester 5 Mini Project' } },
        select: { id: true },
      });
      activityId = activeAct?.id;
    }

    if (!activityId) {
      const firstAct = await prisma.activity.findFirst({ select: { id: true } });
      activityId = firstAct?.id;
    }

    if (!activityId) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'No active academic activity found to attach milestone.',
        422,
        requestId
      );
    }

    let effectiveTeamId: string | null = null;
    const teamId = body.teamId;
    if (teamId && teamId !== 'all') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId);
      const normalized = teamId.replace(/^team-/i, '').replace(/-/g, ' ').trim();
      const digits = teamId.match(/\d+/)?.[0];
      const foundTeam = await prisma.team.findFirst({
        where: {
          OR: [
            ...(isUuid ? [{ id: teamId }] : []),
            { name: { equals: teamId, mode: 'insensitive' as const } },
            { name: { equals: normalized, mode: 'insensitive' as const } },
            ...(digits ? [{ name: { contains: digits, mode: 'insensitive' as const } }] : []),
          ],
        },
      });
      if (foundTeam) {
        effectiveTeamId = foundTeam.id;
        if (!activityId) activityId = foundTeam.activityId;
      } else if (isUuid) {
        effectiveTeamId = teamId;
      }
    }

    const milestone = await prisma.milestone.create({
      data: {
        activityId,
        teamId: effectiveTeamId,
        title: body.title.trim(),
        description: body.description?.trim() || '',
        stageNumber: body.stageNumber,
        dueDate: new Date(body.dueDate),
        deliverableType: body.deliverableType || 'PDF',
        weightage: body.weightage || 0,
        status: 'not_started',
        requiresMentorReview: true,
      },
    });

    return createSuccessResponse(milestone, { status: 201, requestId });
  }
);
