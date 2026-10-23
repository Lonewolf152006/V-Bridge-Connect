// POST /api/v1/teams — Create team (FR-020, FR-022)
// GET /api/v1/teams — List teams by activity with pagination & sort whitelisting

import { z } from 'zod';
import { apiRoute, createSuccessResponse } from '@/lib/api/envelope';
import { teamService } from '@/lib/modules/team/team.service';
import prisma from '@/lib/db/prisma';

const createTeamSchema = z
  .object({
    activityId: z.string().min(1, 'activityId is required'),
    name: z.string().min(1, 'Team name is required').max(100),
    reason: z.string().max(500).optional(),
  })
  .strict();

const listTeamsQuerySchema = z
  .object({
    activityId: z.string().min(1).optional(),
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 20, 50)),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  })
  .strict();

export const POST = apiRoute(
  {
    requireAuth: true,
    roles: ['student', 'coordinator', 'super_admin'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: createTeamSchema,
  },
  async ({ body, user, requestId }) => {
    const team = await teamService.createTeam(body, user);
    return createSuccessResponse(team, { status: 201, requestId });
  }
);

export const GET = apiRoute(
  {
    requireAuth: true,
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: listTeamsQuerySchema,
  },
  async ({ query, user, requestId }) => {
    const limit = query.limit || 20;
    const cursor = query.cursor;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    if (query.activityId) {
      const teams = await teamService.listByActivity(query.activityId, user);
      // Apply pagination slice if more than limit
      const paginated = teams.slice(0, limit);
      return createSuccessResponse(paginated, {
        requestId,
        pagination: {
          limit,
          hasMore: teams.length > limit,
          nextCursor: teams.length > limit ? paginated[paginated.length - 1]?.id : null,
          total: teams.length,
        },
      });
    }

    // List teams for user or all teams if coordinator/admin
    const whereClause: any = {};
    if (user.role === 'student') {
      whereClause.members = { some: { userId: user.userId, removedAt: null } };
    } else if (user.role === 'coordinator' && user.departmentId) {
      whereClause.activity = { departmentId: user.departmentId };
    }

    const items = await prisma.team.findMany({
      where: whereClause,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { [sortBy]: sortOrder },
      include: {
        activity: { select: { id: true, title: true, status: true } },
        members: {
          where: { removedAt: null },
          select: {
            id: true,
            role: true,
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    const hasMore = items.length > limit;
    const paginatedItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? paginatedItems[paginatedItems.length - 1]?.id : null;

    return createSuccessResponse(paginatedItems, {
      requestId,
      pagination: {
        limit,
        hasMore,
        nextCursor,
      },
    });
  }
);
