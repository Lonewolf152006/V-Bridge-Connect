// POST /api/v1/teams/[id]/project
// Allows faculty guide or industry expert to directly assign/specify a project topic for a group.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Only faculty guides or industry mentors can assign project topics' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, domain, source } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Project Title is required' },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const projectSource =
      source ||
      (sessionUser.role === 'industry_partner' ? 'industry_offered' : 'faculty_assigned');

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        projectTitle: title.trim(),
        projectDescription: description?.trim() || '',
        projectDomain: domain?.trim() || 'Electronics and Computer Science',
        projectSource,
        projectStatus: 'approved',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Project topic assigned to group successfully',
      data: updatedTeam,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign project topic' },
      { status: 500 }
    );
  }
}
