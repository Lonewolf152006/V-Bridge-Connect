// POST /api/v1/applications — Submit or draft an application (FR-010)
// GET /api/v1/applications — List applications (scoped)

import { NextRequest } from 'next/server';
import { applicationService } from '@/lib/modules/application/application.service';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'student', 'coordinator', 'super_admin');
    const body = await request.json();

    if (!body.activityId) {
      return Response.json({ error: 'activityId is required' }, { status: 400 });
    }

    const application = await applicationService.createApplication(body, user);
    return Response.json({ data: application }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Internal server error' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');
    const status = searchParams.get('status');

    if (activityId) {
      const applications = await applicationService.listByActivity(
        activityId,
        user,
        status ? { status: status as any } : undefined
      );
      return Response.json({ data: applications });
    }

    if (user.role === 'student') {
      const myApps = await applicationService.listMyApplications(user);
      return Response.json({ data: myApps });
    }

    if (user.role === 'coordinator' || user.role === 'super_admin') {
      const allApps = await prisma.application.findMany({
        where: {
          ...(status ? { status: status as any } : {}),
          ...(user.role === 'coordinator' && user.departmentId
            ? { activity: { departmentId: user.departmentId } }
            : {}),
        },
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
      return Response.json({ data: allApps });
    }

    return Response.json({ data: [] });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
