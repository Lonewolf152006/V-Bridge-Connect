// POST /api/v1/teams/[id]/industry-mentor
// Allows faculty guide to assign or remove an industry mentor for their specific group.
// Industry mentor is NOT compulsory for every group — faculty chooses on a per-group basis.

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

    if (sessionUser.role !== 'coordinator' && sessionUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only faculty guides can assign industry mentors to their groups' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { industryMentorId, industryMentorEmail, action } = body;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        conversations: { where: { type: 'group' }, take: 1 },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Action: remove
    if (action === 'remove' || (!industryMentorId && !industryMentorEmail)) {
      const updated = await prisma.team.update({
        where: { id },
        data: { industryMentorId: null },
      });
      return NextResponse.json({
        success: true,
        message: 'Industry mentor removed from group',
        data: updated,
      });
    }

    // Find industry mentor user
    let mentorUser = null;
    if (industryMentorId) {
      mentorUser = await prisma.user.findUnique({
        where: { id: industryMentorId },
      });
    } else if (industryMentorEmail) {
      mentorUser = await prisma.user.findUnique({
        where: { email: industryMentorEmail.toLowerCase().trim() },
      });
    }

    if (!mentorUser) {
      return NextResponse.json(
        { error: 'Industry mentor user not found with provided ID or email' },
        { status: 404 }
      );
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        industryMentorId: mentorUser.id,
      },
      include: {
        industryMentor: { select: { id: true, name: true, email: true } },
      },
    });

    // Add industry mentor to the group's conversation channel if exists
    if (team.conversations.length > 0) {
      const conv = team.conversations[0];
      const existing = await prisma.conversationParticipant.findFirst({
        where: { conversationId: conv.id, userId: mentorUser.id, removedAt: null },
      });
      if (!existing) {
        await prisma.conversationParticipant.create({
          data: {
            conversationId: conv.id,
            userId: mentorUser.id,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Assigned ${mentorUser.name} as industry mentor for ${team.name}`,
      data: updatedTeam,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign industry mentor' },
      { status: 500 }
    );
  }
}
