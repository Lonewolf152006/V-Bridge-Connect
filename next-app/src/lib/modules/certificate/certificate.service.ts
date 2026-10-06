// VBridgeConnect — Certificate Service
// FR-110 to FR-117: Platform credentials vs self-reported achievements
// Cryptographic verification hash generation and revocation audit trail.

import crypto from 'crypto';
import { certificateRepository } from './certificate.repository';
import {
  validateCertificateTransition,
  assertCertificateTransitionRole,
} from './certificate.state-machine';
import eventBus from '@/lib/events/bus';
import { type TokenPayload, AuthError } from '@/lib/auth/jwt';
import { assertActivityScope } from '@/lib/auth/rbac';
import prisma from '@/lib/db/prisma';

export interface CreateSelfReportedDTO {
  activityTitle: string;
  externalProvider: string;
  externalFileUrl: string;
  issueDate?: string;
}

export const certificateService = {
  /**
   * Issue a platform certificate upon activity completion (FR-110, FR-111).
   */
  async issuePlatformCertificate(
    activityId: string,
    studentId: string,
    issuedById: string
  ) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { department: { select: { name: true } } },
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    if (!activity.certificateEligible) {
      throw new Error('This activity is not eligible for platform-issued certificates');
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Check for existing platform certificate
    const existing = await prisma.certificate.findFirst({
      where: {
        activityId,
        studentId,
        type: 'platform_issued',
        status: { in: ['issued', 'eligible'] },
      },
    });

    if (existing) {
      return existing;
    }

    // Generate unique SHA-256 verification hash
    const issueDate = new Date();
    const hashPayload = `${activityId}:${studentId}:${issueDate.toISOString()}:${crypto.randomUUID()}`;
    const verificationHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const cert = await certificateRepository.createPlatformCertificate({
      studentId,
      activityId,
      activityTitle: activity.title,
      status: 'issued',
      issuedById,
      issueDate,
      verificationHash,
    });

    await eventBus.publish({
      type: 'certificate.issued',
      entityType: 'certificate',
      entityId: cert.id,
      action: 'issued',
      actorId: issuedById,
      metadata: {
        activityId,
        studentId,
        verificationHash,
        certificateType: 'platform_issued',
      },
      timestamp: issueDate,
    });

    return cert;
  },

  /**
   * Upload a self-declared achievement certificate (FR-112, FR-113).
   * Never blocked, requires no coordinator approval.
   */
  async uploadSelfReported(dto: CreateSelfReportedDTO & { studentId?: string }, user: TokenPayload) {
    if (user.role === 'student' && dto.studentId && dto.studentId !== user.userId) {
      throw new AuthError('Forbidden: you cannot submit self-reported certificates on behalf of another student', 403);
    }
    const studentId = user.role === 'student' ? user.userId : (dto.studentId || user.userId);

    const cert = await certificateRepository.createSelfReported({
      studentId,
      activityTitle: dto.activityTitle,
      externalProvider: dto.externalProvider,
      externalFileUrl: dto.externalFileUrl,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
    });

    await eventBus.publish({
      type: 'certificate.posted',
      entityType: 'certificate',
      entityId: cert.id,
      action: 'posted',
      actorId: user.userId,
      metadata: {
        certificateType: 'self_reported',
        activityTitle: dto.activityTitle,
      },
      timestamp: new Date(),
    });

    return cert;
  },

  /**
   * Get certificate by ID with FR-114 label distinction.
   */
  async getById(id: string, user?: TokenPayload) {
    const cert = await certificateRepository.findById(id);
    if (!cert) {
      throw new Error('Certificate not found');
    }

    if (user) {
      if (user.role === 'student' && cert.studentId !== user.userId) {
        throw new AuthError('Forbidden: you can only view your own certificate', 403);
      }
      if (user.role === 'industry_partner') {
        throw new AuthError('Forbidden: industry partners cannot access student certificates', 403);
      }
    }

    // FR-114: Distinguish label
    const label =
      cert.type === 'platform_issued'
        ? `Issued by ${cert.activity?.department?.name || 'Institution'}`
        : 'Self-reported';

    return {
      ...cert,
      displayLabel: label,
      isOfficial: cert.type === 'platform_issued',
    };
  },

  /**
   * Verify a platform certificate publicly by SHA-256 hash (FR-111, QA-06).
   */
  async verifyByHash(hash: string) {
    const cert = await certificateRepository.findByVerificationHash(hash);
    if (!cert) {
      return { valid: false, message: 'Invalid or unknown certificate verification hash' };
    }

    if (cert.status === 'revoked') {
      return {
        valid: false,
        status: 'revoked',
        message: 'This certificate was revoked by the institution',
        revokedAt: cert.revokedAt,
        revocationReason: cert.revocationReason,
      };
    }

    return {
      valid: true,
      status: cert.status,
      activityTitle: cert.activityTitle,
      recipientName: cert.student.name,
      issueDate: cert.issueDate,
      issuingDepartment: cert.activity?.department?.name,
      verificationHash: cert.verificationHash,
    };
  },

  /**
   * Revoke a platform-issued certificate with mandatory reason (FR-116, QA-14).
   */
  async revokePlatformCertificate(
    id: string,
    reason: string,
    user: TokenPayload
  ) {
    if (!reason || reason.trim() === '') {
      throw new Error('Revocation reason is required (FR-116)');
    }

    const cert = await certificateRepository.findById(id);
    if (!cert) {
      throw new Error('Certificate not found');
    }

    const transition = validateCertificateTransition(cert.status, 'revoke', cert.type);
    assertCertificateTransitionRole(transition, user.role);

    const updated = await certificateRepository.updateStatus(id, 'revoked', {
      revokedById: user.userId,
      revokedAt: new Date(),
      revocationReason: reason,
    });

    await eventBus.publish({
      type: 'certificate.revoked',
      entityType: 'certificate',
      entityId: id,
      action: 'revoked',
      actorId: user.userId,
      reason,
      priorValue: { status: cert.status },
      newValue: { status: 'revoked' },
      timestamp: new Date(),
    });

    return updated;
  },

  /**
   * Remove a self-reported certificate (FR-112).
   */
  async removeSelfReported(id: string, user: TokenPayload) {
    const cert = await certificateRepository.findById(id);
    if (!cert) {
      throw new Error('Certificate not found');
    }

    if (cert.type !== 'self_reported') {
      throw new Error('Only self-reported certificates can be removed by students');
    }

    if (cert.studentId !== user.userId && user.role !== 'super_admin') {
      throw new AuthError('You can only remove your own self-reported certificate', 403);
    }

    const transition = validateCertificateTransition(cert.status, 'remove', cert.type);
    assertCertificateTransitionRole(transition, user.role);

    return certificateRepository.updateStatus(id, 'removed');
  },

  /**
   * List all certificates for student (FR-117).
   */
  async listMyCertificates(user: TokenPayload) {
    const certs = await certificateRepository.findByStudentId(user.userId);
    return certs.map((c) => ({
      ...c,
      displayLabel:
        c.type === 'platform_issued'
          ? `Issued by ${c.activity?.department?.name || 'Institution'}`
          : 'Self-reported',
      isOfficial: c.type === 'platform_issued',
    }));
  },

  /**
   * Official export/listing for coordinator (FR-115: excludes self-reported).
   */
  async listOfficialByActivity(activityId: string, user: TokenPayload) {
    if (user.role !== 'super_admin') {
      await assertActivityScope(user, activityId);
    }
    return certificateRepository.findByActivityId(activityId);
  },

  /**
   * Register event subscribers.
   * Auto-issues certificates when an activity completes (FR-110).
   */
  registerSubscribers(): void {
    eventBus.subscribe('activity.completed', async (event) => {
      try {
        const activityId = event.entityId;
        const actorId = event.actorId || 'system';

        const activity = await prisma.activity.findUnique({
          where: { id: activityId },
          select: { certificateEligible: true },
        });

        if (!activity?.certificateEligible) return;

        const enrolledStudents = await prisma.application.findMany({
          where: { activityId, status: 'selected' },
          select: { applicantId: true },
        });

        for (const app of enrolledStudents) {
          try {
            await certificateService.issuePlatformCertificate(
              activityId,
              app.applicantId,
              actorId
            );
          } catch (e) {
            console.error(`[Certificate] Error auto-issuing cert for student ${app.applicantId}:`, e);
          }
        }
      } catch (err) {
        console.error('[Certificate] Error in activity.completed subscriber:', err);
      }
    });
  },
};

