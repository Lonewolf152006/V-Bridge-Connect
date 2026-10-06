// GET & POST /api/v1/projects/offerings
// Allows faculty guides & industry experts to post available project topics for groups.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get('sourceType');

    const where: any = {};
    if (sourceType) where.sourceType = sourceType;

    const offerings = await prisma.projectOffering.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTeam: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: offerings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch project offerings' },
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

    if (
      sessionUser.role !== 'coordinator' &&
      sessionUser.role !== 'super_admin' &&
      sessionUser.role !== 'industry_partner'
    ) {
      return NextResponse.json(
        { error: 'Only faculty guides and industry partners can post project offerings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, domain, prerequisites, companyName, activityId: requestedActId } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    let activityId = requestedActId;
    if (!activityId) {
      const activeAct = await prisma.activity.findFirst({
        where: { title: { contains: 'Semester 5 Mini Project' } },
        select: { id: true },
      });
      activityId = activeAct?.id;
    }

    if (!activityId) {
      return NextResponse.json(
        { error: 'Active activity not found' },
        { status: 400 }
      );
    }

    const sourceType = sessionUser.role === 'industry_partner' ? 'industry' : 'faculty';

    const offering = await prisma.projectOffering.create({
      data: {
        activityId,
        createdById: sessionUser.id,
        title: title.trim(),
        description: description.trim(),
        domain: domain?.trim() || 'Electronics and Computer Science',
        prerequisites: prerequisites?.trim() || null,
        sourceType,
        companyName: companyName?.trim() || (sourceType === 'industry' ? 'Industry Partner' : null),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Project offering created successfully',
      data: offering,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create project offering' },
      { status: 500 }
    );
  }
}
