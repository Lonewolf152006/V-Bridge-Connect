// VBridgeConnect — Team Repository
// FR-020 to FR-024: Team creation, membership, lead assignment, risk tracking

import prisma from '@/lib/db/prisma';
import { type TeamRiskStatus, type TeamMemberRole } from '@prisma/client';

export const teamRepository = {
  async findById(id: string) {
    return prisma.team.findUnique({
      where: { id },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            status: true,
            departmentId: true,
            teamSizeMin: true,
            teamSizeMax: true,
          },
        },
        members: {
          where: { removedAt: null },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                departmentId: true,
                avatarUrl: true,
              },
            },
          },
        },
        milestones: {
          select: {
            id: true,
            title: true,
            stageNumber: true,
            status: true,
            dueDate: true,
          },
          orderBy: { stageNumber: 'asc' },
        },
      },
    });
  },

  async findByActivityId(activityId: string) {
    return prisma.team.findMany({
      where: { activityId },
      include: {
        members: {
          where: { removedAt: null },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findByUserId(userId: string) {
    return prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
            removedAt: null,
          },
        },
      },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        members: {
          where: { removedAt: null },
          select: {
            id: true,
            role: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  },

  async countActiveMembers(teamId: string): Promise<number> {
    return prisma.teamMembership.count({
      where: { teamId, removedAt: null },
    });
  },

  /**
   * Create a team and automatically add the creator as Team Lead (FR-022).
   */
  async createTeam(data: {
    activityId: string;
    name: string;
    leadUserId: string;
    reason?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          activityId: data.activityId,
          name: data.name,
          riskStatus: 'on_track',
          lastActivityAt: new Date(),
        },
      });

      await tx.teamMembership.create({
        data: {
          teamId: team.id,
          userId: data.leadUserId,
          role: 'lead',
          reason: data.reason ?? 'Team creator designated as lead',
        },
      });

      return team;
    });
  },

  /**
   * Add a member to an existing team (FR-020, FR-023).
   */
  async addMember(data: {
    teamId: string;
    userId: string;
    role?: TeamMemberRole;
    reason?: string;
  }) {
    return prisma.teamMembership.create({
      data: {
        teamId: data.teamId,
        userId: data.userId,
        role: data.role ?? 'contributor',
        reason: data.reason,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  },

  /**
   * Soft-remove a member with recorded reason (FR-023).
   */
  async removeMember(membershipId: string, removeReason: string) {
    return prisma.teamMembership.update({
      where: { id: membershipId },
      data: {
        removedAt: new Date(),
        removeReason,
      },
    });
  },

  /**
   * Set team lead ensuring exactly one lead per team (FR-022).
   */
  async setLead(teamId: string, targetUserId: string) {
    return prisma.$transaction(async (tx) => {
      // Demote current active lead(s)
      await tx.teamMembership.updateMany({
        where: { teamId, role: 'lead', removedAt: null },
        data: { role: 'contributor' },
      });

      // Promote designated target
      return tx.teamMembership.updateMany({
        where: { teamId, userId: targetUserId, removedAt: null },
        data: { role: 'lead' },
      });
    });
  },

  /**
   * Update risk status and reason (FR-034).
   */
  async updateRiskStatus(teamId: string, riskStatus: TeamRiskStatus, riskReason?: string) {
    return prisma.team.update({
      where: { id: teamId },
      data: {
        riskStatus,
        riskReason,
      },
    });
  },

  async updateLastActivity(teamId: string) {
    return prisma.team.update({
      where: { id: teamId },
      data: { lastActivityAt: new Date() },
    });
  },
};
