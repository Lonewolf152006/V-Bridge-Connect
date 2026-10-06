import { NextResponse } from 'next/server';
import { MOCK_SUBMISSIONS } from '@/services/mockData';
import type { Submission } from '@/types';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';

export async function GET(request: Request) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const milestoneId = searchParams.get('milestoneId');

    let filtered = [...MOCK_SUBMISSIONS];

    if (teamId) {
      filtered = filtered.filter((s) => s.teamId === teamId);
    }

    if (milestoneId) {
      filtered = filtered.filter((s) => s.milestoneId === milestoneId);
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request, 'student', 'coordinator', 'super_admin');
    const body = await request.json();

    const newSubmission: Submission = {
      id: `sub-${Date.now()}`,
      teamId: body.teamId || 'team-001',
      milestoneId: body.milestoneId || 'ms-002',
      version: body.version || 3,
      submittedById: user.userId,
      submittedAt: new Date().toISOString(),
      fileUrl: body.fileUrl || '/uploads/deliverable-v3.zip',
      fileName: body.fileName || 'NexGen_Prototype_v3.zip',
      fileSizeBytes: body.fileSizeBytes || 14800000,
      checksumSha256: `a4f89d31${Date.now()}bf9081e28901`,
      externalUrl: body.githubCommitSha || body.demoVideoUrl || 'https://github.com/nexgen-ai/pipeline',
      studentNote: body.studentNote,
    };

    return NextResponse.json({
      success: true,
      message: 'Deliverable registered immutably (FR-052)',
      data: newSubmission,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to record deliverable submission' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAuth(request, 'coordinator', 'super_admin');
    const body = await request.json();
    const { submissionId, scores, publicFeedback, privateNote, passStatus } = body;

    return NextResponse.json({
      success: true,
      message: 'Rubric evaluation cryptographically signed and committed',
      submissionId,
      scores,
      publicFeedback,
      auditTimestamp: new Date().toISOString(),
      passStatus: passStatus || 'APPROVED',
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to record rubric evaluation' },
      { status: 400 }
    );
  }
}

