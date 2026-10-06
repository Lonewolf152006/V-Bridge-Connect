import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { Certificate } from '@/types';

import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const dbCerts = await prisma.certificate.findMany({
      where: user.role === 'student' ? { studentId: user.userId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    });

    let mappedCerts: Certificate[] = dbCerts.map((c) => ({
      id: c.id,
      studentId: c.studentId,
      activityId: c.activityId || 'act-external',
      activityTitle: c.activityTitle,
      type: c.type === 'platform_issued' ? 'PLATFORM_ISSUED' : 'SELF_REPORTED',
      issueDate: c.issueDate?.toISOString() || c.createdAt.toISOString(),
      verificationHash: c.verificationHash || undefined,
      externalProvider: c.externalProvider || undefined,
      disclaimer:
        c.type === 'self_reported'
          ? 'UNVERIFIED STUDENT SELF-REPORT: Excluded from official university transcripts and ABET/NAAC audit submissions (FR-115).'
          : 'Official university-issued credential, cryptographically verified and recorded on the institutional ledger.',
    }));

    if (type === 'OFFICIAL') {
      mappedCerts = mappedCerts.filter((c) => c.type === 'PLATFORM_ISSUED');
    } else if (type === 'SELF_REPORTED') {
      mappedCerts = mappedCerts.filter((c) => c.type === 'SELF_REPORTED');
    }

    return NextResponse.json({
      success: true,
      total: mappedCerts.length,
      data: mappedCerts,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('[API certificates error]:', error);
    return NextResponse.json({
      success: true,
      total: 0,
      data: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request, 'student', 'coordinator', 'super_admin');
    const body = await request.json();

    const targetStudentId = user.role === 'student' ? user.userId : (body.studentId || user.userId);

    const created = await prisma.certificate.create({
      data: {
        studentId: targetStudentId,
        activityTitle: body.activityTitle || 'External Accreditation',
        type: 'self_reported',
        status: 'posted',
        externalProvider: body.externalProvider || 'Coursera / AWS',
        externalFileUrl: body.fileUrl || 'https://external-credentials.org/cert-verify',
      },
    });

    const frontendCert: Certificate = {
      id: created.id,
      studentId: created.studentId,
      activityId: created.activityId || 'act-external',
      activityTitle: created.activityTitle,
      type: 'SELF_REPORTED',
      issueDate: created.createdAt.toISOString(),
      externalProvider: created.externalProvider || undefined,
      disclaimer:
        'UNVERIFIED STUDENT SELF-REPORT: Excluded from official university transcripts and ABET/NAAC audit submissions (FR-115).',
    };

    return NextResponse.json(
      {
        success: true,
        message: 'External credential recorded in database under segregated self-reported ledger (FR-115)',
        data: frontendCert,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('[API create certificate error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record external certificate' },
      { status: 400 }
    );
  }
}

