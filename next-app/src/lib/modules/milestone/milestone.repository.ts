// VBridgeConnect — Milestone Repository

import prisma from '@/lib/db/prisma';
import { type MilestoneStatus, type Prisma } from '@prisma/client';

export const milestoneRepository = {
  async findById(id: string) {
    return prisma.milestone.findUnique({ where: { id } });
  },

  async findByIdWithRelations(id: string) {
    return prisma.milestone.findUnique({
      where: { id },
      include: {
        activity: { select: { id: true, title: true, ownerId: true, departmentId: true } },
        team: { select: { id: true, name: true } },
        submissions: { orderBy: { version: 'desc' } },
      },
    });
  },

  async findByActivityId(activityId: string) {
    return prisma.milestone.findMany({
      where: { activityId },
      orderBy: { stageNumber: 'asc' },
      include: {
        team: { select: { id: true, name: true } },
        submissions: { orderBy: { version: 'desc' }, take: 1 },
      },
    });
  },

  async findByTeamId(teamId: string) {
    return prisma.milestone.findMany({
      where: { teamId },
      orderBy: { stageNumber: 'asc' },
      include: {
        submissions: { orderBy: { version: 'desc' }, take: 1 },
      },
    });
  },

  async create(data: Prisma.MilestoneCreateInput) {
    return prisma.milestone.create({ data });
  },

  async updateStatus(id: string, status: MilestoneStatus, extra?: Partial<{
    blockReason: string;
    blockCategory: string;
    waiveReason: string;
    extensionReason: string;
    effectiveDueDate: Date;
  }>) {
    return prisma.milestone.update({
      where: { id },
      data: { status, ...extra },
    });
  },

  /**
   * architecture.md §6: Milestone overdue sweep.
   * SELECT milestones where due_date < NOW() and status not in (accepted, waived, overdue).
   */
  async findOverdueMilestones() {
    return prisma.milestone.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { notIn: ['accepted', 'waived', 'overdue'] },
      },
      include: {
        activity: { select: { id: true, title: true, ownerId: true } },
        team: { select: { id: true, name: true } },
      },
    });
  },
};
