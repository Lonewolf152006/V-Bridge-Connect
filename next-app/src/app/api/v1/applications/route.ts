// POST /api/v1/applications — Submit or draft an application (FR-010)
// GET /api/v1/applications — List applications with clamped pagination & strict validation

import { z } from 'zod';
import { apiRoute, createSuccessResponse } from '@/lib/api/envelope';
import { applicationService } from '@/lib/modules/application/application.service';
import prisma from '@/lib/db/prisma';

const createApplicationSchema = z
  .object({
    activityId: z.string().min(1, 'activityId is required'),
    teamId: z.string().optional(),
    status: z.enum(['draft', 'submitted']).optional(),
    statementOfPurpose: z.string().max(2000).optional(),
    portfolioUrl: z.string().url().or(z.string().length(0)).optional(),
    answers: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

const listApplicationsQuerySchema = z
  .object({
    activityId: z.string().optional(),
    status: z
      .enum([
        'draft',
        'submitted',
        'under_review',
        'shortlisted',
        'accepted',
        'rejected',
        'waitlisted',
        'withdrawn',
      ])
      .optional(),
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 20, 50)),
  })
  .strict();

export const POST = apiRoute(
  {
    requireAuth: true,
    roles: ['student', 'coordinator', 'super_admin'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: createApplicationSchema,
  },
  async ({ body, user, requestId }) => {
    const application = await applicationService.createApplication(body, user);
    return createSuccessResponse(application, { status: 201, requestId });
  }
);

export const GET = apiRoute(
  {
    requireAuth: true,
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: listApplicationsQuerySchema,
  },
  async ({ query, user, requestId }) => {
    const limit = query.limit || 20;

    if (query.activityId) {
      const applications = await applicationService.listByActivity(
        query.activityId,
        user,
        query.status ? { status: query.status as any } : undefined
      );
      const paginated = applications.slice(0, limit);
      return createSuccessResponse(paginated, {
        requestId,
        pagination: {
          limit,
          hasMore: applications.length > limit,
          nextCursor: applications.length > limit ? paginated[paginated.length - 1]?.id : null,
          total: applications.length,
        },
      });
    }

    if (user.role === 'student') {
      const myApps = await applicationService.listMyApplications(user);
      const paginated = myApps.slice(0, limit);
      return createSuccessResponse(paginated, {
        requestId,
        pagination: {
          limit,
          hasMore: myApps.length > limit,
          nextCursor: myApps.length > limit ? paginated[paginated.length - 1]?.id : null,
          total: myApps.length,
        },
      });
    }

    if (user.role === 'coordinator' || user.role === 'super_admin') {
      const allApps = await prisma.application.findMany({
        where: {
          ...(query.status ? { status: query.status as any } : {}),
          ...(user.role === 'coordinator' && user.departmentId
            ? { activity: { departmentId: user.departmentId } }
            : {}),
        },
        take: limit + 1,
        ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              email: true,
              department: { select: { name: true } },
              institutionalId: true,
              avatarUrl: true,
              role: true,
            },
          },
          activity: {
            select: {
              id: true,
              title: true,
              status: true,
              capacity: true,
              filledSeats: true,
            },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
          team: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const hasMore = allApps.length > limit;
      const paginated = hasMore ? allApps.slice(0, limit) : allApps;
      return createSuccessResponse(paginated, {
        requestId,
        pagination: {
          limit,
          hasMore,
          nextCursor: hasMore ? paginated[paginated.length - 1]?.id : null,
        },
      });
    }

    return createSuccessResponse([], {
      requestId,
      pagination: { limit, hasMore: false },
    });
  }
);
