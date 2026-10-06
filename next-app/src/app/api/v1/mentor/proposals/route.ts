// GET /api/v1/mentor/proposals
// Allows faculty guides to view all project proposals submitted by their groups.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getOptionalSession();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (sessionUser.role !== 'coordinator' && sessionUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only faculty guides can view cohort proposals' },
        { status: 403 }
      );
    }

    // Find all teams guided by this faculty member
    const guidedTeams = await prisma.team.findMany({
      where: sessionUser.role === 'super_admin' ? {} : { mentorId: sessionUser.id },
      select: { id: true, name: true },
    });

    const teamIds = guidedTeams.map((t) => t.id);

    const proposals = await prisma.projectProposal.findMany({
      where: { teamId: { in: teamIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            projectTitle: true,
            projectSource: true,
            projectStatus: true,
            industryMentor: { select: { id: true, name: true, email: true } },
          },
        },
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: proposals,
      teams: guidedTeams,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch cohort proposals' },
      { status: 500 }
    );
  }
}
