import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';
import { MOCK_TEAMS } from '@/services/mockData';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getOptionalSession();
    const body = await request.json();
    const {
      teamId,
      projectTitle,
      projectDescription,
      projectDomain,
      industryMentorName,
      status = 'in_progress',
    } = body;

    if (!teamId || !projectTitle?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Team ID and Project Title are required.' },
        { status: 400 }
      );
    }

    // 1. In-memory update for mock store / client instant reflection
    const mockTeam = MOCK_TEAMS.find((t) => t.id === teamId);
    if (mockTeam) {
      mockTeam.projectTitle = projectTitle.trim();
      mockTeam.projectDescription = (projectDescription || '').trim();
      mockTeam.projectDomain = projectDomain || 'IoT & Embedded Systems';
      mockTeam.projectSource = 'faculty_assigned';
      mockTeam.projectStatus = status;
      if (industryMentorName) {
        mockTeam.industryMentorName = industryMentorName;
      }
    }

    // 2. Database update (if database is reachable)
    let dbUpdated = null;
    try {
      // Find team by ID or name
      const teamInDb = await prisma.team.findFirst({
        where: {
          OR: [{ id: teamId }, { name: mockTeam?.name || teamId }],
        },
      });

      if (teamInDb) {
        dbUpdated = await prisma.team.update({
          where: { id: teamInDb.id },
          data: {
            projectTitle: projectTitle.trim(),
            projectDescription: (projectDescription || '').trim(),
            projectDomain: projectDomain || 'Electronics and Computer Science',
            projectSource: 'faculty_assigned',
            projectStatus: status,
          },
          include: {
            members: {
              include: { user: true },
            },
            mentor: true,
          },
        });
      }
    } catch (dbErr) {
      console.warn('[AssignProject API] Database update warning (using fallback):', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Project "${projectTitle}" assigned to ${mockTeam?.name || 'group'} successfully.`,
      data: mockTeam || dbUpdated,
    });
  } catch (error: any) {
    console.error('[AssignProject API Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to assign project.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (teamId) {
      const mockTeam = MOCK_TEAMS.find((t) => t.id === teamId);
      return NextResponse.json({
        success: true,
        data: mockTeam || null,
      });
    }

    return NextResponse.json({
      success: true,
      data: MOCK_TEAMS,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
