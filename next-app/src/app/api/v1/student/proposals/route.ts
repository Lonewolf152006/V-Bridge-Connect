// GET & POST /api/v1/student/proposals
// Allows students to request / propose a project idea for their group.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getOptionalSession();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamIdParam = searchParams.get('teamId');

    // Find student's team membership
    const membership = await prisma.teamMembership.findFirst({
      where: {
        userId: sessionUser.id,
        removedAt: null,
        ...(teamIdParam ? { teamId: teamIdParam } : {}),
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            projectTitle: true,
            projectDescription: true,
            projectDomain: true,
            projectSource: true,
            projectStatus: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ success: true, data: [] });
    }

    const proposals = await prisma.projectProposal.findMany({
      where: { teamId: membership.teamId },
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: proposals,
      team: membership.team,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch proposals' },
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

    const body = await request.json();
    const { title, problemStatement, techStack, domain, objectives, teamId } = body;

    if (!title?.trim() || !problemStatement?.trim()) {
      return NextResponse.json(
        { error: 'Project Title and Problem Statement are required' },
        { status: 400 }
      );
    }

    // Resolve team membership
    const membership = await prisma.teamMembership.findFirst({
      where: {
        userId: sessionUser.id,
        removedAt: null,
        ...(teamId ? { teamId } : {}),
      },
      include: {
        team: {
          select: { id: true, activityId: true, mentorId: true, name: true },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must belong to an active team to propose a project' },
        { status: 400 }
      );
    }

    const targetTeam = membership.team;

    // Check if there is already an approved proposal or pending proposal
    const pendingCount = await prisma.projectProposal.count({
      where: {
        teamId: targetTeam.id,
        status: 'pending',
      },
    });

    if (pendingCount > 0) {
      return NextResponse.json(
        { error: 'Your group already has a proposal under review by faculty guide' },
        { status: 400 }
      );
    }

    const proposal = await prisma.projectProposal.create({
      data: {
        teamId: targetTeam.id,
        activityId: targetTeam.activityId,
        submittedById: sessionUser.id,
        title: title.trim(),
        problemStatement: problemStatement.trim(),
        techStack: techStack?.trim() || null,
        domain: domain?.trim() || 'Electronics and Computer Science',
        objectives: objectives?.trim() || null,
        status: 'pending',
      },
    });

    // Update team projectStatus to 'proposed'
    await prisma.team.update({
      where: { id: targetTeam.id },
      data: {
        projectStatus: 'proposed',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Project proposal submitted to faculty guide for review',
      data: proposal,
    });
  } catch (error: any) {
    console.error('[ProjectProposalAPI] Submission failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit proposal' },
      { status: 500 }
    );
  }
}
