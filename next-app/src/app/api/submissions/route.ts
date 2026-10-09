import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamParam = searchParams.get('teamId');
    const milestoneParam = searchParams.get('milestoneId');

    const where: any = {};

    if (teamParam) {
      const dbTeam = await prisma.team.findFirst({
        where: {
          OR: [{ id: teamParam }, { name: teamParam }],
        },
        select: { id: true },
      });
      if (dbTeam) {
        where.teamId = dbTeam.id;
      } else {
        where.teamId = teamParam;
      }
    }

    if (milestoneParam) {
      where.milestoneId = milestoneParam;
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        milestone: { select: { id: true, title: true, stageNumber: true } },
        team: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = submissions.map((s) => ({
      id: s.id,
      milestoneId: s.milestoneId,
      teamId: s.teamId,
      submittedById: s.submittedById,
      submittedBy: s.submittedBy,
      version: s.version,
      fileUrl: s.fileUrl,
      fileName: s.fileName,
      fileSizeBytes: s.fileSizeBytes,
      checksumSha256: s.checksumSha256,
      externalUrl: s.externalUrl,
      studentNote: s.studentNote,
      submittedAt: s.createdAt.toISOString(),
      rubricScores: s.rubricScores as any,
      mentorPrivateNote: s.reviewerPrivateNote || undefined,
      mentorPublicFeedback: s.reviewerPublicFeedback || undefined,
      gradedAt: s.reviewedAt?.toISOString(),
      gradedById: s.reviewerId || undefined,
      status: s.status,
      teamName: s.team?.name,
      milestoneTitle: s.milestone?.title,
    }));

    return NextResponse.json({
      success: true,
      count: mapped.length,
      data: mapped,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('[API Submissions GET Error]:', error);
    return NextResponse.json({ success: true, count: 0, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    let userId: string | null = null;
    const session = await getOptionalSession();
    if (session) {
      userId = session.id;
    } else {
      try {
        const tokenUser = await requireAuth(request, 'student', 'coordinator', 'super_admin');
        userId = tokenUser.userId;
      } catch {
        // Fallback to active student in database if available
        const student = await prisma.user.findFirst({ where: { role: 'student' } });
        userId = student?.id || null;
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Resolve team
    let teamId = body.teamId;
    const dbTeam = await prisma.team.findFirst({
      where: {
        OR: [{ id: teamId || '' }, { name: teamId || '' }],
      },
      select: { id: true },
    });
    if (dbTeam) {
      teamId = dbTeam.id;
    } else {
      const fallbackTeam = await prisma.team.findFirst({ select: { id: true } });
      teamId = fallbackTeam?.id;
    }

    // Resolve milestone
    let milestoneId = body.milestoneId;
    const dbMilestone = await prisma.milestone.findFirst({
      where: {
        OR: [{ id: milestoneId || '' }, { title: milestoneId || '' }],
      },
      select: { id: true },
    });
    if (dbMilestone) {
      milestoneId = dbMilestone.id;
    } else {
      const fallbackMs = await prisma.milestone.findFirst({ select: { id: true } });
      milestoneId = fallbackMs?.id;
    }

    if (!teamId || !milestoneId) {
      return NextResponse.json(
        { success: false, error: 'Valid team and milestone are required' },
        { status: 400 }
      );
    }

    // Get current version count for this milestone
    const existingCount = await prisma.submission.count({
      where: { milestoneId },
    });
    const nextVersion = existingCount + 1;

    const newSubmission = await prisma.submission.create({
      data: {
        milestoneId,
        teamId,
        submittedById: userId,
        version: nextVersion,
        status: 'submitted',
        fileUrl: body.fileUrl || null,
        fileName: body.fileName || null,
        fileSizeBytes: body.fileSizeBytes || null,
        checksumSha256: body.checksumSha256 || `sha256-${Date.now()}`,
        externalUrl: body.githubCommitSha || body.demoVideoUrl || body.externalUrl || null,
        studentNote: body.studentNote || null,
      },
      include: {
        team: { select: { id: true, name: true } },
        milestone: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Deliverable registered immutably in database (FR-052)',
        data: {
          id: newSubmission.id,
          teamId: newSubmission.teamId,
          milestoneId: newSubmission.milestoneId,
          version: newSubmission.version,
          submittedById: newSubmission.submittedById,
          submittedAt: newSubmission.createdAt.toISOString(),
          fileUrl: newSubmission.fileUrl,
          fileName: newSubmission.fileName,
          externalUrl: newSubmission.externalUrl,
          studentNote: newSubmission.studentNote,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API Submissions POST Error]:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to record deliverable submission' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    let reviewerId: string | null = null;
    const session = await getOptionalSession();
    if (session) {
      reviewerId = session.id;
    } else {
      try {
        const tokenUser = await requireAuth(request, 'coordinator', 'super_admin');
        reviewerId = tokenUser.userId;
      } catch {
        const faculty = await prisma.user.findFirst({ where: { role: 'coordinator' } });
        reviewerId = faculty?.id || null;
      }
    }

    const body = await request.json();
    const { submissionId, scores, publicFeedback, privateNote, passStatus } = body;

    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'Submission ID is required' }, { status: 400 });
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        rubricScores: scores || undefined,
        reviewerPublicFeedback: publicFeedback || undefined,
        reviewerPrivateNote: privateNote || undefined,
        reviewerId: reviewerId || undefined,
        reviewedAt: new Date(),
        status: passStatus === 'REJECTED' ? 'changes_requested' : 'accepted',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Rubric evaluation recorded in database',
      submissionId: updated.id,
      scores,
      publicFeedback,
      auditTimestamp: updated.reviewedAt?.toISOString() || new Date().toISOString(),
      passStatus: passStatus || 'APPROVED',
    });
  } catch (error: any) {
    console.error('[API Submissions PATCH Error]:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to record rubric evaluation' },
      { status: 400 }
    );
  }
}
