// VBridgeConnect — Certificate Repository
// FR-110 to FR-117: Platform credentials (with SHA-256 hash) vs self-reported achievements

import prisma from '@/lib/db/prisma';
import { type CertificateStatus, type CertificateType } from '@prisma/client';

export const certificateRepository = {
  async findById(id: string) {
    return prisma.certificate.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            department: { select: { name: true } },
            institutionalId: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            department: { select: { name: true, code: true } },
          },
        },
        revokedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  },

  async findByVerificationHash(verificationHash: string) {
    return prisma.certificate.findUnique({
      where: { verificationHash },
      include: {
        student: { select: { id: true, name: true, department: { select: { name: true } } } },
        activity: {
          select: {
            id: true,
            title: true,
            department: { select: { name: true, code: true } },
          },
        },
      },
    });
  },

  async findByStudentId(
    studentId: string,
    filters?: { type?: CertificateType; status?: CertificateStatus }
  ) {
    return prisma.certificate.findMany({
      where: {
        studentId,
        ...(filters?.type ? { type: filters.type } : {}),
        ...(filters?.status ? { status: filters.status } : { status: { not: 'removed' } }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            department: { select: { name: true, code: true } },
          },
        },
      },
    });
  },

  async findByActivityId(activityId: string) {
    return prisma.certificate.findMany({
      where: {
        activityId,
        type: 'platform_issued',
        status: 'issued', // FR-115: only official issued certificates for activity exports
      },
      include: {
        student: {
          select: { id: true, name: true, email: true, institutionalId: true },
        },
      },
      orderBy: { issueDate: 'asc' },
    });
  },

  async createPlatformCertificate(data: {
    studentId: string;
    activityId: string;
    activityTitle: string;
    status: CertificateStatus;
    issuedById?: string;
    issueDate?: Date;
    verificationHash?: string;
  }) {
    return prisma.certificate.create({
      data: {
        type: 'platform_issued',
        status: data.status,
        studentId: data.studentId,
        activityId: data.activityId,
        activityTitle: data.activityTitle,
        issuedById: data.issuedById,
        issueDate: data.issueDate,
        verificationHash: data.verificationHash,
      },
    });
  },

  async createSelfReported(data: {
    studentId: string;
    activityTitle: string;
    externalProvider?: string;
    externalFileUrl?: string;
    issueDate?: Date;
  }) {
    return prisma.certificate.create({
      data: {
        type: 'self_reported',
        status: 'posted', // FR-113: never blocked, no approval needed
        studentId: data.studentId,
        activityTitle: data.activityTitle,
        externalProvider: data.externalProvider,
        externalFileUrl: data.externalFileUrl,
        issueDate: data.issueDate,
      },
    });
  },

  async updateStatus(
    id: string,
    status: CertificateStatus,
    extra?: {
      revokedById?: string;
      revocationReason?: string;
      revokedAt?: Date;
      verificationHash?: string;
      issueDate?: Date;
      issuedById?: string;
    }
  ) {
    return prisma.certificate.update({
      where: { id },
      data: {
        status,
        ...extra,
      },
    });
  },
};
