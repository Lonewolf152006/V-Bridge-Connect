// VBridgeConnect — Application Repository
// FR-010 to FR-015: Applications, review, selection, waitlisting, atomic capacity (QA-10)

import prisma from '@/lib/db/prisma';
import { type ApplicationStatus, type Prisma } from '@prisma/client';

export const applicationRepository = {
  async findById(id: string) {
    return prisma.application.findUnique({
      where: { id },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            department: { select: { name: true } },
            institutionalId: true,
            avatarUrl: true,
            role: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            status: true,
            capacity: true,
            filledSeats: true,
            departmentId: true,
            ownerId: true,
            applicationDeadline: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async findByActivityId(
    activityId: string,
    filters?: { status?: ApplicationStatus }
  ) {
    return prisma.application.findMany({
      where: {
        activityId,
        ...(filters?.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            department: { select: { name: true } },
            institutionalId: true,
            avatarUrl: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async findByApplicantId(applicantId: string) {
    return prisma.application.findMany({
      where: { applicantId },
      orderBy: { createdAt: 'desc' },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            applicationDeadline: true,
            startDate: true,
            department: { select: { name: true } },
          },
        },
      },
    });
  },

  async findExisting(activityId: string, applicantId: string) {
    return prisma.application.findUnique({
      where: {
        activityId_applicantId: {
          activityId,
          applicantId,
        },
      },
    });
  },

  async create(data: {
    activityId: string;
    applicantId: string;
    teamId?: string;
    status?: ApplicationStatus;
    answers?: Prisma.InputJsonValue;
    statementOfPurpose?: string;
    portfolioUrl?: string;
  }) {
    return prisma.application.create({
      data: {
        activity: { connect: { id: data.activityId } },
        applicant: { connect: { id: data.applicantId } },
        ...(data.teamId ? { team: { connect: { id: data.teamId } } } : {}),
        status: data.status ?? 'submitted',
        answers: data.answers,
        statementOfPurpose: data.statementOfPurpose,
        portfolioUrl: data.portfolioUrl,
      },
      include: {
        activity: { select: { id: true, title: true } },
        applicant: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async update(
    id: string,
    data: Partial<{
      status: ApplicationStatus;
      answers: Prisma.InputJsonValue;
      statementOfPurpose: string;
      portfolioUrl: string;
      reviewerId: string;
      reviewerNote: string;
      decisionNote: string;
      withdrawalReason: string;
      rejectionReason: string;
    }>
  ) {
    return prisma.application.update({
      where: { id },
      data,
    });
  },

  /**
   * Atomic selection with capacity check (QA-10 & FR-015).
   * Inside a Prisma transaction:
   * 1. Check if activity filledSeats < capacity.
   * 2. If full, throws capacity error.
   * 3. Update application to 'selected'.
   * 4. Increment activity filledSeats by 1.
   */
  async selectWithCapacityLock(
    applicationId: string,
    activityId: string,
    reviewerId: string,
    decisionNote?: string,
    reviewerNote?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const activity = await tx.activity.findUnique({
        where: { id: activityId },
        select: { capacity: true, filledSeats: true, title: true },
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      if (activity.filledSeats >= activity.capacity) {
        throw new Error(
          `Activity "${activity.title}" has reached full capacity (${activity.capacity}/${activity.capacity}). Cannot select applicant.`
        );
      }

      const updatedApp = await tx.application.update({
        where: { id: applicationId },
        data: {
          status: 'selected',
          reviewerId,
          decisionNote,
          reviewerNote,
        },
        include: {
          applicant: { select: { id: true, name: true, email: true } },
          activity: { select: { id: true, title: true } },
        },
      });

      await tx.activity.update({
        where: { id: activityId },
        data: {
          filledSeats: { increment: 1 },
        },
      });

      return updatedApp;
    });
  },

  /**
   * Atomic promotion from waitlist to selected when a seat opens (QA-10).
   */
  async promoteWithCapacityLock(
    applicationId: string,
    activityId: string,
    reviewerId: string,
    decisionNote?: string
  ) {
    return this.selectWithCapacityLock(
      applicationId,
      activityId,
      reviewerId,
      decisionNote,
      'Promoted from waitlist'
    );
  },

  /**
   * Atomic seat release when a selected applicant withdraws.
   */
  async withdrawSelectedWithSeatRelease(
    applicationId: string,
    activityId: string,
    withdrawalReason?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const updatedApp = await tx.application.update({
        where: { id: applicationId },
        data: {
          status: 'withdrawn',
          withdrawalReason,
        },
      });

      await tx.activity.update({
        where: { id: activityId },
        data: {
          filledSeats: { decrement: 1 },
        },
      });

      return updatedApp;
    });
  },
};
