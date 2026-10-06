// PATCH /api/v1/mentor/proposals/[id]
// Allows faculty guide to approve, request revisions, or reject a student project proposal.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getOptionalSession();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (sessionUser.role !== 'coordinator' && sessionUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only faculty guides can evaluate project proposals' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, feedback } = body;

    if (!['approved', 'changes_requested', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be one of: approved, changes_requested, rejected' },
        { status: 400 }
      );
    }

    const proposal = await prisma.projectProposal.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Verify faculty owns this team (unless super_admin)
    if (
      sessionUser.role !== 'super_admin' &&
      proposal.team.mentorId !== sessionUser.id
    ) {
      return NextResponse.json(
        { error: 'You are not the designated faculty guide for this group' },
        { status: 403 }
      );
    }

    // Update the proposal record
    const updatedProposal = await prisma.projectProposal.update({
      where: { id },
      data: {
        status,
        feedback: feedback?.trim() || null,
        reviewedById: sessionUser.id,
        reviewedAt: new Date(),
      },
    });

    // If approved, sync project details directly to the team!
    if (status === 'approved') {
      await prisma.team.update({
        where: { id: proposal.teamId },
        data: {
          projectTitle: proposal.title,
          projectDescription: proposal.problemStatement,
          projectDomain: proposal.domain || 'Electronics and Computer Science',
          projectSource: 'student_proposed',
          projectStatus: 'approved',
        },
      });
    } else if (status === 'rejected') {
      await prisma.team.update({
        where: { id: proposal.teamId },
        data: {
          projectStatus: 'rejected',
        },
      });
    } else if (status === 'changes_requested') {
      await prisma.team.update({
        where: { id: proposal.teamId },
        data: {
          projectStatus: 'changes_requested',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Proposal ${status.replace('_', ' ')} successfully`,
      data: updatedProposal,
    });
  } catch (error: any) {
    console.error('[MentorProposalReviewAPI] Failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to review proposal' },
      { status: 500 }
    );
  }
}
