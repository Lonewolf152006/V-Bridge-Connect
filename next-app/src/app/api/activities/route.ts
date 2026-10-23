import { z } from 'zod';
import { apiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api/envelope';
import prisma from '@/lib/db/prisma';
import type { Activity, ActivityCategory, ActivityStatus } from '@/types';

function mapDbToFrontendActivity(dbAct: any): Activity {
  const categoryMap: Record<string, ActivityCategory> = {
    capstone: 'CAPSTONE',
    research: 'RESEARCH',
    hackathon: 'HACKATHON',
    internship: 'INTERNSHIP',
    project: 'INDUSTRY_PROJECT',
  };

  const statusMap: Record<string, ActivityStatus> = {
    draft: 'DRAFT',
    published: 'OPEN_FOR_APPLICATIONS',
    applications_closed: 'IN_PROGRESS',
    active: 'IN_PROGRESS',
    under_final_review: 'UNDER_REVIEW',
    completed: 'COMPLETED',
    archived: 'ARCHIVED',
  };

  return {
    id: dbAct.id,
    title: dbAct.title,
    description: dbAct.description,
    category: categoryMap[dbAct.type?.toLowerCase()] || 'CAPSTONE',
    status: statusMap[dbAct.status] || 'OPEN_FOR_APPLICATIONS',
    department: dbAct.department?.name || 'Electronics and Computer Science',
    capacity: dbAct.capacity,
    filledSeats: dbAct.filledSeats,
    teamSizeMin: dbAct.teamSizeMin,
    teamSizeMax: dbAct.teamSizeMax,
    applicationDeadline:
      dbAct.applicationDeadline instanceof Date
        ? dbAct.applicationDeadline.toISOString()
        : new Date(Date.now() + 30 * 86400000).toISOString(),
    prerequisites: (dbAct.eligibility as any)?.prerequisites || ['Python', 'Git'],
    supervisorId: dbAct.ownerId,
    milestones: (dbAct.milestones || []).map((m: any) => ({
      id: m.id,
      activityId: m.activityId,
      stageNumber: m.stageNumber,
      title: m.title,
      description: m.description,
      dueDate: m.dueDate instanceof Date ? m.dueDate.toISOString() : new Date().toISOString(),
      weightage: m.weightage,
      status: (m.status || 'not_started').toUpperCase(),
      deliverableType: m.deliverableType || 'any',
      requiresMentorReview: m.requiresMentorReview ?? true,
    })),
    createdAt: dbAct.createdAt instanceof Date ? dbAct.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: dbAct.updatedAt instanceof Date ? dbAct.updatedAt.toISOString() : new Date().toISOString(),
  };
}

const getActivitiesQuerySchema = z
  .object({
    category: z.string().optional(),
    department: z.string().optional(),
    search: z.string().optional(),
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 50, 50)),
  })
  .strict();

const createActivitySchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional(),
    category: z.enum(['CAPSTONE', 'RESEARCH', 'HACKATHON', 'INTERNSHIP', 'INDUSTRY_PROJECT']).optional().default('CAPSTONE'),
    departmentId: z.string().optional(),
    department: z.string().optional(),
    capacity: z.union([z.number(), z.string()]).optional().transform((v) => (v ? Number(v) : 20)),
    minTeamSize: z.union([z.number(), z.string()]).optional().transform((v) => (v ? Number(v) : 1)),
    maxTeamSize: z.union([z.number(), z.string()]).optional().transform((v) => (v ? Number(v) : 5)),
    applicationDeadline: z.string().optional(),
    prerequisites: z.union([z.array(z.string()), z.string()]).optional(),
  })
  .strict();

export const GET = apiRoute(
  {
    requireAuth: false,
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: getActivitiesQuerySchema,
  },
  async ({ query, requestId }) => {
    const limit = query.limit || 50;

    const dbActivities = await prisma.activity.findMany({
      where: {
        status: { in: ['published', 'active', 'applications_closed', 'under_final_review', 'completed'] },
      },
      take: limit + 1,
      include: {
        department: true,
        owner: true,
        milestones: { orderBy: { stageNumber: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let activities = dbActivities.map(mapDbToFrontendActivity);

    if (query.category && query.category !== 'ALL') {
      activities = activities.filter((a) => a.category === query.category);
    }

    if (query.department && query.department !== 'ALL') {
      activities = activities.filter((a) => a.department === query.department);
    }

    if (query.search) {
      const q = query.search.toLowerCase();
      activities = activities.filter(
        (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
    }

    const hasMore = activities.length > limit;
    const paginated = hasMore ? activities.slice(0, limit) : activities;

    return createSuccessResponse(paginated, {
      requestId,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore ? paginated[paginated.length - 1]?.id : null,
        total: activities.length,
      },
    });
  }
);

export const POST = apiRoute(
  {
    requireAuth: true,
    roles: ['coordinator', 'super_admin'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: createActivitySchema,
  },
  async ({ body, user, requestId }) => {
    let deptId = body.departmentId || user.departmentId;
    if (!deptId) {
      const defaultDept = await prisma.department.findFirst();
      if (!defaultDept) {
        return createErrorResponse('VALIDATION_ERROR', 'No institutional department configured.', 422, requestId);
      }
      deptId = defaultDept.id;
    }

    const typeMapping: Record<string, string> = {
      CAPSTONE: 'capstone',
      RESEARCH: 'research',
      HACKATHON: 'hackathon',
      INTERNSHIP: 'internship',
      INDUSTRY_PROJECT: 'project',
    };

    const parsedPrereqs = body.prerequisites
      ? Array.isArray(body.prerequisites)
        ? body.prerequisites
        : body.prerequisites.split(',').map((s: string) => s.trim())
      : ['Python', 'Git'];

    const created = await prisma.activity.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || '',
        type: typeMapping[body.category] || 'capstone',
        status: 'published',
        departmentId: deptId,
        ownerId: user.userId,
        capacity: body.capacity || 20,
        teamSizeMin: body.minTeamSize || 1,
        teamSizeMax: body.maxTeamSize || 5,
        applicationDeadline: body.applicationDeadline
          ? new Date(body.applicationDeadline)
          : new Date(Date.now() + 30 * 86400000),
        eligibility: {
          prerequisites: parsedPrereqs,
        },
      },
      include: {
        department: true,
        owner: true,
        milestones: true,
      },
    });

    const mapped = mapDbToFrontendActivity(created);
    return createSuccessResponse(mapped, { status: 201, requestId });
  }
);
