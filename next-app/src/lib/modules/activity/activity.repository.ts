// VBridgeConnect — Activity Repository
// rules.md §9: A module owns its own tables. Only the repository touches Prisma directly.

import prisma from '@/lib/db/prisma';
import { type ActivityStatus, type Prisma } from '@prisma/client';

export const activityRepository = {
  async findById(id: string) {
    return prisma.activity.findUnique({ where: { id } });
  },

  async findByIdWithRelations(id: string) {
    return prisma.activity.findUnique({
      where: { id },
      include: {
        department: true,
        owner: { select: { id: true, name: true, email: true, role: true } },
        teams: { include: { members: { where: { removedAt: null } } } },
        milestones: { orderBy: { stageNumber: 'asc' } },
      },
    });
  },

  async findMany(filters: {
    departmentId?: string;
    status?: ActivityStatus;
    ownerId?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.ActivityWhereInput = {};

    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.status) where.status = filters.status;
    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.type) where.type = filters.type;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, email: true, role: true } },
          department: { select: { id: true, name: true } },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    return { data, total, page, limit, generatedAt: new Date().toISOString() };
  },

  async create(data: Prisma.ActivityCreateInput) {
    return prisma.activity.create({ data });
  },

  async updateStatus(id: string, status: ActivityStatus, extra?: Partial<{
    cancellationReason: string;
    archiveReason: string;
  }>) {
    return prisma.activity.update({
      where: { id },
      data: { status, ...extra },
    });
  },

  async update(id: string, data: Prisma.ActivityUpdateInput) {
    return prisma.activity.update({ where: { id }, data });
  },

  /**
   * Increment filledSeats atomically inside a transaction.
   * Used by application.select — the capacity-sensitive write (QA-10).
   */
  async incrementFilledSeats(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.activity.update({
      where: { id },
      data: { filledSeats: { increment: 1 } },
    });
  },

  /**
   * Decrement filledSeats (e.g. when withdrawing a selected application).
   */
  async decrementFilledSeats(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.activity.update({
      where: { id },
      data: { filledSeats: { decrement: 1 } },
    });
  },

  /**
   * Lock and read activity for capacity check inside a transaction.
   * Uses raw SQL SELECT FOR UPDATE for row-level locking (QA-10).
   */
  async lockForCapacityCheck(id: string, tx: Prisma.TransactionClient) {
    const result = await tx.$queryRaw<Array<{ id: string; capacity: number; filled_seats: number }>>`
      SELECT id, capacity, filled_seats
      FROM activities
      WHERE id = ${id}::uuid
      FOR UPDATE
    `;
    return result[0] ?? null;
  },
};
