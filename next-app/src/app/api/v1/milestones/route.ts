// GET & POST /api/v1/milestones
// Allows faculty guides & coordinators to schedule and list academic milestones.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');
    const teamId = searchParams.get('teamId');

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

    // If neither is provided, find the active Semester 5 Mini Project activity
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
      orderBy: { stageNumber: 'asc' },
      include: {
        team: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: milestones });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getOptionalSession();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Must be coordinator, super_admin, or industry_partner (industry mentor)
    if (
      sessionUser.role !== 'coordinator' &&
      sessionUser.role !== 'super_admin' &&
      sessionUser.role !== 'industry_partner'
    ) {
      return NextResponse.json(
        { error: 'Only faculty mentors and industry experts can schedule milestones' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      stageNumber,
      dueDate,
      deliverableType,
      weightage,
      teamId,
    } = body;

    if (!title || !dueDate || stageNumber === undefined) {
      return NextResponse.json(
        { error: 'Title, stageNumber, and dueDate are required' },
        { status: 400 }
      );
    }

    // Resolve activityId: either from body or find default active activity
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
      return NextResponse.json(
        { success: false, error: 'No active academic activity found to attach milestone.' },
        { status: 400 }
      );
    }

    let effectiveTeamId: string | null = null;
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
        title: title.trim(),
        description: description?.trim() || '',
        stageNumber: parseInt(stageNumber, 10),
        dueDate: new Date(dueDate),
        deliverableType: deliverableType || 'PDF',
        weightage: weightage ? parseInt(weightage, 10) : 0,
        status: 'not_started',
        requiresMentorReview: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Milestone scheduled successfully',
      data: milestone,
    });
  } catch (error: any) {
    console.error('[MilestoneAPI] Creation failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to schedule milestone' },
      { status: 500 }
    );
  }
}
