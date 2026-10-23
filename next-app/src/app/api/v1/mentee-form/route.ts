import { z } from 'zod';
import { apiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api/envelope';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/db/prisma';

export interface MenteePersonalDetails {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  mentorName: string;
  mentorEmail?: string;
  department: string;
  yearAndDivision: string;
  studentMobile: string;
  residentialTelephone: string;
  residentialAddress: string;
  emergencyContact: string;
  permanentAddress: string;
  emailVit: string;
  emailPersonal: string;
  familyBackground: string;
  medicalHistory: string;
  hobbiesAndInterest: string;
  strength: string;
  weakness: string;
  studentSignature: string;
  studentSignedAt: string;
  mentorSignature?: string;
  mentorRemarks?: string;
  mentorSignedAt?: string;
  status: 'draft' | 'submitted' | 'verified';
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'mentee_forms.json');

async function getStoredMenteeForms(): Promise<MenteePersonalDetails[]> {
  const formMap = new Map<string, MenteePersonalDetails>();

  try {
    const dbEvents = await prisma.auditEvent.findMany({
      where: { entityType: 'mentee_personal_details' },
      orderBy: { createdAt: 'desc' },
    });
    for (const evt of dbEvents) {
      if (evt.newValue && typeof evt.newValue === 'object') {
        const item = evt.newValue as unknown as MenteePersonalDetails;
        if (item.id && (item.emailVit || item.rollNo)) {
          formMap.set(item.emailVit.toLowerCase(), item);
        }
      }
    }
  } catch (dbErr) {
    console.warn('[MenteeForm API] Error fetching DB mentee forms:', dbErr);
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = await fs.promises.readFile(DATA_FILE, 'utf-8');
      const fileForms: MenteePersonalDetails[] = JSON.parse(raw);
      for (const f of fileForms) {
        const key = f.emailVit?.toLowerCase() || f.rollNo?.toLowerCase() || f.id;
        if (!formMap.has(key)) {
          formMap.set(key, f);
        }
      }
    }
  } catch (err) {
    console.warn('[MenteeForm API] Error reading mentee forms file:', err);
  }

  return Array.from(formMap.values()).sort((a, b) => (a.rollNo || '').localeCompare(b.rollNo || ''));
}

async function saveStoredMenteeForms(forms: MenteePersonalDetails[]): Promise<void> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(forms, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[MenteeForm API] File write warning:', err);
  }
}

const getMenteeFormQuerySchema = z
  .object({
    email: z.string().optional(),
    studentId: z.string().optional(),
    rollNo: z.string().optional(),
    mentor: z.string().optional(),
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 50, 50)),
  })
  .strict();

const postMenteeFormSchema = z
  .object({
    studentId: z.string().optional(),
    studentName: z.string().min(1, 'studentName is required').max(150),
    rollNo: z.string().min(1, 'rollNo is required').max(50),
    emailVit: z.string().email('Valid emailVit is required'),
    emailPersonal: z.string().optional(),
    mentorName: z.string().optional(),
    mentorEmail: z.string().optional(),
    department: z.string().optional(),
    yearAndDivision: z.string().optional(),
    studentMobile: z.string().optional(),
    residentialTelephone: z.string().optional(),
    residentialAddress: z.string().optional(),
    emergencyContact: z.string().optional(),
    permanentAddress: z.string().optional(),
    familyBackground: z.string().optional(),
    medicalHistory: z.string().optional(),
    hobbiesAndInterest: z.string().optional(),
    strength: z.string().optional(),
    weakness: z.string().optional(),
    studentSignature: z.string().optional(),
    studentSignedAt: z.string().optional(),
    status: z.enum(['draft', 'submitted', 'verified']).optional(),
  })
  .strict();

const patchMenteeFormSchema = z
  .object({
    formId: z.string().optional(),
    rollNo: z.string().optional(),
    mentorSignature: z.string().optional(),
    mentorRemarks: z.string().optional(),
    status: z.enum(['draft', 'submitted', 'verified']).optional(),
  })
  .strict();

export const GET = apiRoute(
  {
    requireAuth: true,
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: getMenteeFormQuerySchema,
  },
  async ({ query, requestId }) => {
    const allForms = await getStoredMenteeForms();
    const limit = query.limit || 50;

    if (query.email) {
      const email = query.email.toLowerCase();
      const found = allForms.find((f) => f.emailVit.toLowerCase() === email);
      return createSuccessResponse(found || null, { requestId, headers: { 'x-form-found': found ? 'true' : 'false' } });
    }

    if (query.rollNo) {
      const rollNo = query.rollNo.toLowerCase();
      const found = allForms.find((f) => f.rollNo.toLowerCase() === rollNo);
      return createSuccessResponse(found || null, { requestId });
    }

    if (query.studentId) {
      const found = allForms.find((f) => f.studentId === query.studentId);
      return createSuccessResponse(found || null, { requestId });
    }

    if (query.mentor) {
      const mentor = query.mentor.toLowerCase();
      const filtered = allForms.filter(
        (f) =>
          f.mentorName.toLowerCase().includes(mentor) ||
          (f.mentorEmail && f.mentorEmail.toLowerCase().includes(mentor))
      );
      const paginated = filtered.slice(0, limit);
      return createSuccessResponse(paginated, {
        requestId,
        pagination: {
          limit,
          hasMore: filtered.length > limit,
          nextCursor: filtered.length > limit ? paginated[paginated.length - 1]?.id : null,
          total: filtered.length,
        },
      });
    }

    const paginated = allForms.slice(0, limit);
    return createSuccessResponse(paginated, {
      requestId,
      pagination: {
        limit,
        hasMore: allForms.length > limit,
        nextCursor: allForms.length > limit ? paginated[paginated.length - 1]?.id : null,
        total: allForms.length,
      },
    });
  }
);

export const POST = apiRoute(
  {
    requireAuth: true,
    roles: ['student', 'coordinator', 'super_admin'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: postMenteeFormSchema,
  },
  async ({ body, user, requestId }) => {
    const rollNo = body.rollNo.trim().toUpperCase();
    const emailVit = body.emailVit.trim().toLowerCase();
    const nowIso = new Date().toISOString();

    const allForms = await getStoredMenteeForms();
    const existingIndex = allForms.findIndex(
      (f) => f.emailVit.toLowerCase() === emailVit || f.rollNo.toUpperCase() === rollNo
    );

    const formRecord: MenteePersonalDetails = {
      id: existingIndex >= 0 ? allForms[existingIndex].id : `mentee-form-${Date.now()}`,
      studentId: body.studentId || user.userId || `student-${rollNo.toLowerCase()}`,
      studentName: body.studentName.trim(),
      rollNo,
      mentorName: body.mentorName?.trim() || 'Dr. Sheetal Patil',
      mentorEmail: body.mentorEmail?.trim() || 'sheetal.patil@vit.edu.in',
      department: body.department?.trim() || 'Department of Electronics and Computer Science',
      yearAndDivision: body.yearAndDivision?.trim() || 'TE ECS - Div B',
      studentMobile: body.studentMobile?.trim() || '',
      residentialTelephone: body.residentialTelephone?.trim() || '',
      residentialAddress: body.residentialAddress?.trim() || '',
      emergencyContact: body.emergencyContact?.trim() || '',
      permanentAddress: body.permanentAddress?.trim() || '',
      emailVit,
      emailPersonal: body.emailPersonal?.trim() || '',
      familyBackground: body.familyBackground?.trim() || '',
      medicalHistory: body.medicalHistory?.trim() || 'None',
      hobbiesAndInterest: body.hobbiesAndInterest?.trim() || '',
      strength: body.strength?.trim() || '',
      weakness: body.weakness?.trim() || '',
      studentSignature: body.studentSignature?.trim() || body.studentName.trim(),
      studentSignedAt: body.studentSignedAt || nowIso,
      mentorSignature: existingIndex >= 0 ? allForms[existingIndex].mentorSignature : '',
      mentorRemarks: existingIndex >= 0 ? allForms[existingIndex].mentorRemarks : '',
      mentorSignedAt: existingIndex >= 0 ? allForms[existingIndex].mentorSignedAt : '',
      status: body.status || 'submitted',
      createdAt: existingIndex >= 0 ? allForms[existingIndex].createdAt : nowIso,
      updatedAt: nowIso,
    };

    if (existingIndex >= 0) {
      allForms[existingIndex] = formRecord;
    } else {
      allForms.push(formRecord);
    }

    await saveStoredMenteeForms(allForms);

    try {
      await prisma.user.updateMany({
        where: { email: { equals: emailVit, mode: 'insensitive' } },
        data: { institutionalId: rollNo },
      });
    } catch (dbUpdateErr) {
      console.warn('[MenteeForm API] User table rollNo update warning:', dbUpdateErr);
    }

    try {
      await prisma.auditEvent.create({
        data: {
          entityType: 'mentee_personal_details',
          entityId: formRecord.id,
          action: existingIndex >= 0 ? 'UPDATE_MENTEE_FORM' : 'SUBMIT_MENTEE_FORM',
          actorId: user.userId || null,
          newValue: formRecord as any,
          reason: `Student ${formRecord.studentName} (${rollNo}) submitted Department Mentee form`,
        },
      });
    } catch (auditErr) {
      console.warn('[MenteeForm API] Audit event warning:', auditErr);
    }

    return createSuccessResponse(formRecord, { status: 201, requestId });
  }
);

export const PATCH = apiRoute(
  {
    requireAuth: true,
    roles: ['coordinator', 'super_admin', 'industry_partner'],
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: patchMenteeFormSchema,
  },
  async ({ body, user, requestId }) => {
    const { formId, rollNo, mentorSignature, mentorRemarks, status } = body;

    if (!formId && !rollNo) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Form ID or Roll No is required for mentor verification.',
        422,
        requestId
      );
    }

    const allForms = await getStoredMenteeForms();
    const targetIndex = allForms.findIndex(
      (f) =>
        (formId && f.id === formId) ||
        (rollNo && f.rollNo.toUpperCase() === rollNo.toUpperCase())
    );

    if (targetIndex === -1) {
      return createErrorResponse('NOT_FOUND', 'Mentee form record not found.', 404, requestId);
    }

    const nowIso = new Date().toISOString();
    const updatedForm: MenteePersonalDetails = {
      ...allForms[targetIndex],
      mentorSignature: mentorSignature || user.name || 'Dr. Sheetal Patil',
      mentorRemarks: mentorRemarks || allForms[targetIndex].mentorRemarks || 'Verified by Mentor',
      mentorSignedAt: nowIso,
      status: status || 'verified',
      updatedAt: nowIso,
    };

    allForms[targetIndex] = updatedForm;
    await saveStoredMenteeForms(allForms);

    try {
      await prisma.auditEvent.create({
        data: {
          entityType: 'mentee_personal_details',
          entityId: updatedForm.id,
          action: 'VERIFY_MENTEE_FORM',
          actorId: user.userId || null,
          newValue: updatedForm as any,
          reason: `Mentor verified mentee form for ${updatedForm.studentName} (${updatedForm.rollNo})`,
        },
      });
    } catch (auditErr) {
      console.warn('[MenteeForm API] Audit event warning:', auditErr);
    }

    return createSuccessResponse(updatedForm, { requestId });
  }
);
