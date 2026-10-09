import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';

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

    // Find team in database by ID, exact name, slug, or number
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId);
    const normalizedName = teamId.replace(/^team-/i, '').replace(/-/g, ' ').trim();
    const digitMatch = teamId.match(/\d+/)?.[0];

    const teamInDb = await prisma.team.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: teamId }] : []),
          { name: { equals: teamId, mode: 'insensitive' as const } },
          { name: { equals: normalizedName, mode: 'insensitive' as const } },
          ...(digitMatch ? [{ name: { contains: digitMatch, mode: 'insensitive' as const } }] : []),
        ],
      },
    });

    if (!teamInDb) {
      return NextResponse.json(
        { success: false, error: `Team ${teamId} not found in database.` },
        { status: 404 }
      );
    }

    const updated = await prisma.team.update({
      where: { id: teamInDb.id },
      data: {
        projectTitle: projectTitle.trim(),
        projectDescription: (projectDescription || '').trim(),
        projectDomain: projectDomain || 'Electronics and Computer Science',
        projectSource: sessionUser?.role === 'industry_partner' ? 'industry_offered' : 'faculty_assigned',
        projectStatus: status,
      },
      include: {
        members: {
          include: { user: true },
        },
        mentor: true,
        industryMentor: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Project "${projectTitle}" assigned to ${updated.name} successfully.`,
      data: updated,
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
      const team = await prisma.team.findFirst({
        where: {
          OR: [{ id: teamId }, { name: teamId }],
        },
        include: {
          members: { include: { user: true } },
          mentor: true,
          industryMentor: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: team || null,
      });
    }

    const teams = await prisma.team.findMany({
      include: {
        members: { include: { user: true } },
        mentor: true,
        industryMentor: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: teams,
    });
  } catch (error: any) {
    console.error('[AssignProject API GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
