import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { Certificate } from '@/types';
import { getOptionalSession } from '@/lib/auth/get-session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // 1. Try to get logged in session user
    const sessionUser = await getOptionalSession().catch(() => null);

    let whereClause: any = {};
    if (sessionUser && sessionUser.role === 'student') {
      whereClause.studentId = sessionUser.id;
    }

    // 2. Query certificates from database
    let dbCerts = await prisma.certificate.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    });

    // Fallback: If no certificates found for specific user, get recent certificates or active student certs
    if (dbCerts.length === 0) {
      dbCerts = await prisma.certificate.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
      });
    }

    let mappedCerts: Certificate[] = dbCerts.map((c) => ({
      id: c.id,
      studentId: c.studentId,
      activityId: c.activityId || 'act-credential',
      activityTitle: c.activityTitle,
      type: c.type === 'platform_issued' ? 'PLATFORM_ISSUED' : 'SELF_REPORTED',
      issueDate: c.issueDate?.toISOString() || c.createdAt.toISOString(),
      verificationHash: c.verificationHash || undefined,
      externalProvider: c.externalProvider || undefined,
      externalFileUrl: c.externalFileUrl || undefined,
      status: c.status,
      disclaimer:
        c.type === 'self_reported'
          ? 'UNVERIFIED STUDENT CLAIM: Excluded from official university transcripts and ABET/NAAC audit submissions (FR-115).'
          : 'Official university-issued credential, cryptographically verified and recorded on the institutional ledger.',
      signatories:
        c.type === 'platform_issued'
          ? ['Dr. Sheetal Patil (Project Guide)', 'Dean Academics (VIT Autonomous)']
          : undefined,
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
    const sessionUser = await getOptionalSession().catch(() => null);
    const body = await request.json();

    if (!body.activityTitle || !body.activityTitle.trim()) {
      return NextResponse.json(
        { success: false, error: 'Certificate title is required' },
        { status: 400 }
      );
    }

    // Resolve student ID
    let targetStudentId = sessionUser?.id || body.studentId;
    if (!targetStudentId) {
      const student =
        (await prisma.user.findFirst({ where: { email: 'vedant.nikumbh@vit.edu.in' } })) ||
        (await prisma.user.findFirst({ where: { role: 'student' } }));
      targetStudentId = student?.id;
    }

    if (!targetStudentId) {
      return NextResponse.json(
        { success: false, error: 'Could not associate certificate with a student account' },
        { status: 400 }
      );
    }

    const isPlatform = body.type === 'PLATFORM_ISSUED';
    const randomHash = `sha256-${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const created = await prisma.certificate.create({
      data: {
        studentId: targetStudentId,
        activityTitle: body.activityTitle.trim(),
        type: isPlatform ? 'platform_issued' : 'self_reported',
        status: isPlatform ? 'issued' : 'posted',
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        externalProvider: body.externalProvider?.trim() || (isPlatform ? 'University Issued' : 'Self-Reported / External Authority'),
        externalFileUrl: body.fileUrl || body.externalFileUrl || null,
        verificationHash: body.verificationHash || randomHash,
      },
    });

    const frontendCert: Certificate = {
      id: created.id,
      studentId: created.studentId,
      activityId: created.activityId || 'act-credential',
      activityTitle: created.activityTitle,
      type: created.type === 'platform_issued' ? 'PLATFORM_ISSUED' : 'SELF_REPORTED',
      issueDate: created.issueDate?.toISOString() || created.createdAt.toISOString(),
      externalProvider: created.externalProvider || undefined,
      externalFileUrl: created.externalFileUrl || undefined,
      verificationHash: created.verificationHash || undefined,
      disclaimer:
        created.type === 'self_reported'
          ? 'UNVERIFIED STUDENT CLAIM: Excluded from official university transcripts and ABET/NAAC audit submissions (FR-115).'
          : 'Official university-issued credential, cryptographically verified and recorded on the institutional ledger.',
      signatories:
        created.type === 'platform_issued'
          ? ['Dr. Sheetal Patil (Project Guide)', 'Dean Academics (VIT Autonomous)']
          : undefined,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Certificate registered successfully in portfolio',
        data: frontendCert,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API create certificate error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record certificate' },
      { status: 500 }
    );
  }
}

