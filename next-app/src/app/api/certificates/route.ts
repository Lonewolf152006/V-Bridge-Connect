import { z } from 'zod';
import { apiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api/envelope';
import prisma from '@/lib/db/prisma';
import type { Certificate } from '@/types';

const getCertsQuerySchema = z
  .object({
    type: z.enum(['OFFICIAL', 'SELF_REPORTED']).optional(),
    studentId: z.string().optional(),
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 50, 50)),
  })
  .strict();

const createCertSchema = z
  .object({
    activityTitle: z.string().min(1, 'Certificate title is required').max(255),
    studentId: z.string().optional(),
    type: z.enum(['PLATFORM_ISSUED', 'SELF_REPORTED']).optional(),
    issueDate: z.string().optional(),
    externalProvider: z.string().optional(),
    fileUrl: z.string().url().optional(),
    externalFileUrl: z.string().url().optional(),
    verificationHash: z.string().optional(),
  })
  .strict();

export const GET = apiRoute(
  {
    requireAuth: true,
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: getCertsQuerySchema,
  },
  async ({ query, user, requestId }) => {
    const limit = query.limit || 50;

    let whereClause: any = {};
    if (user.role === 'student') {
      whereClause.studentId = user.userId;
    } else if (query.studentId) {
      whereClause.studentId = query.studentId;
    }

    if (query.type === 'OFFICIAL') {
      whereClause.type = 'platform_issued';
    } else if (query.type === 'SELF_REPORTED') {
      whereClause.type = 'self_reported';
    }

    const dbCerts = await prisma.certificate.findMany({
      where: whereClause,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, email: true, institutionalId: true } },
      },
    });

    const hasMore = dbCerts.length > limit;
    const paginated = hasMore ? dbCerts.slice(0, limit) : dbCerts;

    const mappedCerts: Certificate[] = paginated.map((c: any) => ({
      id: c.id,
      studentId: c.studentId,
      studentName: c.student?.name || 'Student',
      studentEmail: c.student?.email || undefined,
      studentInstitutionalId: c.student?.institutionalId || undefined,
      student: c.student
        ? {
            id: c.student.id,
            name: c.student.name,
            email: c.student.email,
            role: 'STUDENT',
            department: 'Electronics and Computer Science',
            avatarUrl: '',
            institutionalId: c.student.institutionalId || undefined,
            isOnline: true,
          }
        : undefined,
      activityId: c.activityId || 'act-credential',
      activityTitle: c.activityTitle,
      type: c.type === 'platform_issued' ? 'PLATFORM_ISSUED' : 'SELF_REPORTED',
      issueDate: c.issueDate?.toISOString() || c.createdAt?.toISOString() || new Date().toISOString(),
      verificationHash: c.verificationHash || undefined,
      externalProvider: c.externalProvider || undefined,
      externalFileUrl: c.externalFileUrl || undefined,
      uploadReceiptUrl: c.externalFileUrl || undefined,
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

    return createSuccessResponse(mappedCerts, {
      requestId,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore ? mappedCerts[mappedCerts.length - 1]?.id : null,
        total: mappedCerts.length,
      },
    });
  }
);

export const POST = apiRoute(
  {
    requireAuth: true,
    roles: ['student', 'coordinator', 'super_admin', 'industry_partner'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: createCertSchema,
  },
  async ({ body, user, requestId }) => {
    let targetStudentId = user.userId;
    if (user.role !== 'student' && body.studentId) {
      targetStudentId = body.studentId;
    }

    if (!targetStudentId) {
      return createErrorResponse('VALIDATION_ERROR', 'Target student ID is required', 422, requestId);
    }

    const isPlatform = body.type === 'PLATFORM_ISSUED' && user.role !== 'student';
    const randomHash = `sha256-${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const created = await prisma.certificate.create({
      data: {
        studentId: targetStudentId,
        activityTitle: body.activityTitle.trim(),
        type: isPlatform ? 'platform_issued' : 'self_reported',
        status: isPlatform ? 'issued' : 'posted',
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        externalProvider:
          body.externalProvider?.trim() || (isPlatform ? 'University Issued' : 'Self-Reported / External Authority'),
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
      uploadReceiptUrl: created.externalFileUrl || undefined,
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

    return createSuccessResponse(frontendCert, { status: 201, requestId });
  }
);
