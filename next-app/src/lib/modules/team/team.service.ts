// VBridgeConnect — Team Service
// FR-020 to FR-024: Team Formation, Limits, Lead Assignment, Membership Auditing & Risk Management

import { teamRepository } from './team.repository';
import {
  validateTeamRiskTransition,
  assertTeamRiskTransitionRole,
} from './team.state-machine';
import eventBus from '@/lib/events/bus';
import { type TokenPayload, AuthError } from '@/lib/auth/jwt';
import { assertActivityScope, assertTeamScope } from '@/lib/auth/rbac';
import prisma from '@/lib/db/prisma';

export interface CreateTeamDTO {
  activityId: string;
  name: string;
  reason?: string;
}

export interface AddTeamMemberDTO {
  userId: string;
  role?: 'lead' | 'contributor';
  reason?: string;
}

export const teamService = {
  /**
   * Create a new team for an activity (FR-020).
   * Designates creator as Team Lead (FR-022).
   */
  async createTeam(dto: CreateTeamDTO, user: TokenPayload) {
    const activity = await prisma.activity.findUnique({
      where: { id: dto.activityId },
      select: {
        id: true,
        title: true,
        status: true,
        departmentId: true,
        teamSizeMin: true,
        teamSizeMax: true,
      },
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    if (!['published', 'active'].includes(activity.status)) {
      throw new Error(`Cannot form team: activity is in "${activity.status}" state`);
    }

    // Check if user is already in an active team for this activity
    const existingMembership = await prisma.teamMembership.findFirst({
      where: {
        userId: user.userId,
        removedAt: null,
        team: { activityId: dto.activityId },
      },
    });

    if (existingMembership) {
      throw new Error('You are already an active member of another team in this activity');
    }

    const team = await teamRepository.createTeam({
      activityId: dto.activityId,
      name: dto.name,
      leadUserId: user.userId,
      reason: dto.reason,
    });

    await eventBus.publish({
      type: 'team.created',
      entityType: 'team',
      entityId: team.id,
      action: 'created',
      actorId: user.userId,
      metadata: {
        teamName: dto.name,
        activityId: dto.activityId,
        leadUserId: user.userId,
      },
      timestamp: new Date(),
    });

    return team;
  },

  /**
   * Get team details by ID. Scoped server-side (architecture.md §8).
   */
  async getById(id: string, user: TokenPayload) {
    await assertTeamScope(user, id);
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new Error('Team not found');
    }
    return team;
  },

  /**
   * List teams for an activity. Scoped.
   */
  async listByActivity(activityId: string, user: TokenPayload) {
    if (user.role !== 'super_admin') {
      await assertActivityScope(user, activityId);
    }
    return teamRepository.findByActivityId(activityId);
  },

  /**
   * Add a member to a team (FR-020, FR-021, FR-023).
   * Enforces configurable min/max size limits.
   */
  async addMember(teamId: string, dto: AddTeamMemberDTO, user: TokenPayload) {
    await assertTeamScope(user, teamId);
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Authorization: Team lead or Coordinator or Super Admin
    const isLead = team.members.some(
      (m) => m.user.id === user.userId && m.role === 'lead'
    );
    const isCoordinator = user.role === 'coordinator';
    const isAdmin = user.role === 'super_admin';

    if (!isLead && !isCoordinator && !isAdmin) {
      throw new AuthError('Only team lead or coordinator can add team members', 403);
    }

    // FR-021: Team size enforcement (maximum limit)
    const activeCount = await teamRepository.countActiveMembers(teamId);
    if (activeCount >= team.activity.teamSizeMax) {
      throw new Error(
        `Team has reached maximum allowed members (${team.activity.teamSizeMax})`
      );
    }

    // Check if target user is already in any active team for this activity
    const alreadyEnrolled = await prisma.teamMembership.findFirst({
      where: {
        userId: dto.userId,
        removedAt: null,
        team: { activityId: team.activity.id },
      },
    });

    if (alreadyEnrolled) {
      throw new Error('User is already an active member of a team in this activity');
    }

    const membership = await teamRepository.addMember({
      teamId,
      userId: dto.userId,
      role: dto.role ?? 'contributor',
      reason: dto.reason ?? `Added by ${user.role}`,
    });

    await eventBus.publish({
      type: 'team.member_added',
      entityType: 'team',
      entityId: teamId,
      action: 'member_added',
      actorId: user.userId,
      metadata: {
        addedUserId: dto.userId,
        role: dto.role ?? 'contributor',
        reason: dto.reason,
      },
      timestamp: new Date(),
    });

    return membership;
  },

  /**
   * Remove a member from a team with mandatory reason (FR-023).
   */
  async removeMember(
    teamId: string,
    targetUserId: string,
    reason: string,
    user: TokenPayload
  ) {
    if (!reason || reason.trim() === '') {
      throw new Error('Recorded reason is required for membership removal (FR-023)');
    }

    await assertTeamScope(user, teamId);
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const targetMembership = team.members.find((m) => m.user.id === targetUserId);
    if (!targetMembership) {
      throw new Error('Member not found on this team');
    }

    // Authorization: Member leaving self, Team lead, or Coordinator/Admin
    const isSelfLeaving = user.userId === targetUserId;
    const isLead = team.members.some(
      (m) => m.user.id === user.userId && m.role === 'lead'
    );
    const isCoordinator = user.role === 'coordinator';
    const isAdmin = user.role === 'super_admin';

    if (!isSelfLeaving && !isLead && !isCoordinator && !isAdmin) {
      throw new AuthError('Unauthorized to remove this member', 403);
    }

    const activeCount = await teamRepository.countActiveMembers(teamId);
    if (activeCount <= 1) {
      throw new Error('Cannot remove the only member of a team. Disband team instead.');
    }

    // If removing the lead, a new lead must be assigned or must be handled
    if (targetMembership.role === 'lead') {
      const remainingMembers = team.members.filter((m) => m.user.id !== targetUserId);
      if (remainingMembers.length > 0) {
        // Designate the first remaining member as lead automatically
        await teamRepository.setLead(teamId, remainingMembers[0].user.id);
      }
    }

    const updated = await teamRepository.removeMember(targetMembership.id, reason);

    await eventBus.publish({
      type: 'team.member_removed',
      entityType: 'team',
      entityId: teamId,
      action: 'member_removed',
      actorId: user.userId,
      reason,
      metadata: {
        removedUserId: targetUserId,
      },
      timestamp: new Date(),
    });

    return updated;
  },

  /**
   * Reassign Team Lead (FR-022: Exactly one lead per team).
   */
  async changeLead(teamId: string, newLeadUserId: string, user: TokenPayload) {
    await assertTeamScope(user, teamId);
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const isCurrentLead = team.members.some(
      (m) => m.user.id === user.userId && m.role === 'lead'
    );
    const isCoordinator = user.role === 'coordinator';
    const isAdmin = user.role === 'super_admin';

    if (!isCurrentLead && !isCoordinator && !isAdmin) {
      throw new AuthError('Only current lead or coordinator can change team lead', 403);
    }

    const isTargetMember = team.members.some((m) => m.user.id === newLeadUserId);
    if (!isTargetMember) {
      throw new Error('Target user must be an active member of the team');
    }

    await teamRepository.setLead(teamId, newLeadUserId);

    await eventBus.publish({
      type: 'team.lead_changed',
      entityType: 'team',
      entityId: teamId,
      action: 'lead_changed',
      actorId: user.userId,
      metadata: { newLeadUserId },
      timestamp: new Date(),
    });

    return { message: 'Team lead successfully changed', leadUserId: newLeadUserId };
  },

  /**
   * Transition Team Risk Status (FR-034, Section 9).
   * Verbs: flag-watch, flag-risk, flag-blocked, resolve-risk, downgrade-risk.
   */
  async transitionRisk(
    teamId: string,
    verb: string,
    reason: string | undefined,
    user: TokenPayload
  ) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const transition = validateTeamRiskTransition(team.riskStatus, verb);
    assertTeamRiskTransitionRole(transition, user.role);

    // FR-034: Reason required for at_risk or blocked
    if (transition.requiresReason && (!reason || reason.trim() === '')) {
      throw new Error(`Reason is required to flag team as "${transition.to}" (FR-034)`);
    }

    const updated = await teamRepository.updateRiskStatus(
      teamId,
      transition.to,
      reason ?? undefined
    );

    await eventBus.publish({
      type: 'team.risk_updated',
      entityType: 'team',
      entityId: teamId,
      action: 'risk_updated',
      actorId: user.userId,
      priorValue: { riskStatus: team.riskStatus },
      newValue: { riskStatus: transition.to },
      reason,
      metadata: { verb },
      timestamp: new Date(),
    });

    return updated;
  },
};
