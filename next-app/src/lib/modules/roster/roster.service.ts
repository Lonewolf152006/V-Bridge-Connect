// VBridgeConnect — Roster Service & Auto-Connect Engine
// Matches students & faculty with their pre-assigned groups upon login.
// Supports faculty invite codes for industry mentor onboarding.

import prisma from '@/lib/db/prisma';
import eventBus from '@/lib/events/bus';

export interface AutoConnectResult {
  connected: boolean;
  teamsJoined: Array<{
    teamId: string;
    teamName: string;
    activityId: string;
    role: string;
    mentorName?: string;
  }>;
}

export const rosterService = {
  /**
   * Automatically connects a user to their pre-assigned team(s), activity,
   * and conversation(s) as soon as they sign in.
   */
  async autoConnectUserOnLogin(user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  }): Promise<AutoConnectResult> {
    const normalizedEmail = user.email.toLowerCase().trim();

    // 1. Check for pending roster invitations for this email
    const pendingInvitations = await prisma.rosterInvitation.findMany({
      where: {
        email: normalizedEmail,
        claimed: false,
      },
      include: {
        team: {
          include: {
            mentor: { select: { id: true, name: true, email: true } },
            conversations: { where: { type: 'group' }, take: 1 },
          },
        },
        activity: { select: { id: true, title: true } },
      },
    });

    const teamsJoined: AutoConnectResult['teamsJoined'] = [];

    for (const inv of pendingInvitations) {
      const isLead = inv.role === 'student_lead';
      const memberRole = isLead ? 'lead' : 'contributor';

      // A. Create or activate TeamMembership
      const existingMembership = await prisma.teamMembership.findFirst({
        where: {
          teamId: inv.teamId,
          userId: user.id,
          removedAt: null,
        },
      });

      if (!existingMembership) {
        await prisma.teamMembership.create({
          data: {
            teamId: inv.teamId,
            userId: user.id,
            role: memberRole,
            reason: 'Auto-connected from official department roster',
          },
        });
      }

      // B. Create or update official Application record (status: selected)
      const existingApp = await prisma.application.findUnique({
        where: {
          activityId_applicantId: {
            activityId: inv.activityId,
            applicantId: user.id,
          },
        },
      });

      if (!existingApp) {
        await prisma.application.create({
          data: {
            activityId: inv.activityId,
            applicantId: user.id,
            teamId: inv.teamId,
            status: 'selected',
            statementOfPurpose: 'Enrolled via official departmental cohort roster.',
          },
        });
      } else if (existingApp.status !== 'selected') {
        await prisma.application.update({
          where: { id: existingApp.id },
          data: { status: 'selected', teamId: inv.teamId },
        });
      }

      // C. Add student to the Team's Group Conversation
      const conversation = inv.team.conversations[0];
      if (conversation) {
        const existingParticipant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: conversation.id,
            userId: user.id,
            removedAt: null,
          },
        });

        if (!existingParticipant) {
          await prisma.conversationParticipant.create({
            data: {
              conversationId: conversation.id,
              userId: user.id,
            },
          });
        }
      }

      // D. Mark RosterInvitation as claimed
      await prisma.rosterInvitation.update({
        where: { id: inv.id },
        data: {
          claimed: true,
          claimedAt: new Date(),
          claimedById: user.id,
        },
      });

      // E. Create welcome notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: `Connected to ${inv.team.name}`,
          body: `You have been automatically placed in team "${inv.team.name}" for ${inv.activity.title} with faculty guide ${inv.team.mentor?.name || 'Assigned Faculty'}.`,
          severity: 'info',
          linkTo: `/projects/${inv.teamId}`,
          entityType: 'team',
          entityId: inv.teamId,
        },
      });

      teamsJoined.push({
        teamId: inv.teamId,
        teamName: inv.team.name,
        activityId: inv.activityId,
        role: memberRole,
        mentorName: inv.team.mentor?.name,
      });

      // Emit event bus notification
      await eventBus.publish({
        type: 'team.member_added',
        entityType: 'team',
        entityId: inv.teamId,
        action: 'auto_connected',
        actorId: user.id,
        metadata: {
          email: normalizedEmail,
          teamName: inv.team.name,
          role: memberRole,
        },
        timestamp: new Date(),
      });
    }

    return {
      connected: teamsJoined.length > 0,
      teamsJoined,
    };
  },

  /**
   * Allows an Industry Partner to join a Faculty's groups using the unique Faculty Code.
   */
  async joinCohortWithFacultyCode(
    industryUserId: string,
    facultyCode: string
  ): Promise<{
    success: boolean;
    facultyName: string;
    facultyEmail: string;
    teamsJoined: Array<{ id: string; name: string }>;
  }> {
    if (!facultyCode || facultyCode.trim() === '') {
      throw new Error('Faculty code is required');
    }

    const code = facultyCode.trim().toUpperCase();

    // 1. Locate faculty guide by code
    const faculty = await prisma.user.findFirst({
      where: {
        facultyCode: { equals: code, mode: 'insensitive' },
      },
      select: { id: true, name: true, email: true },
    });

    if (!faculty) {
      throw new Error(`Faculty invite code "${code}" is invalid or does not exist.`);
    }

    // 2. Fetch all teams guided by this faculty member
    const teams = await prisma.team.findMany({
      where: { mentorId: faculty.id },
      include: {
        conversations: { where: { type: 'group' }, take: 1 },
      },
    });

    if (teams.length === 0) {
      throw new Error(`No active project teams are currently assigned to ${faculty.name}.`);
    }

    const joinedTeams: Array<{ id: string; name: string }> = [];

    for (const team of teams) {
      // A. Update team's industryMentorId
      await prisma.team.update({
        where: { id: team.id },
        data: { industryMentorId: industryUserId },
      });

      // B. Add industry partner to the Team's Group Conversation
      const conversation = team.conversations[0];
      if (conversation) {
        const existingParticipant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: conversation.id,
            userId: industryUserId,
            removedAt: null,
          },
        });

        if (!existingParticipant) {
          await prisma.conversationParticipant.create({
            data: {
              conversationId: conversation.id,
              userId: industryUserId,
            },
          });
        }
      }

      joinedTeams.push({ id: team.id, name: team.name });
    }

    // 3. Notify the Faculty Mentor
    await prisma.notification.create({
      data: {
        userId: faculty.id,
        title: 'Industry Partner Joined Your Teams',
        body: `An industry mentor has connected to your ${joinedTeams.length} mentored teams via your code (${code}).`,
        severity: 'info',
        entityType: 'faculty',
        entityId: faculty.id,
      },
    });

    return {
      success: true,
      facultyName: faculty.name,
      facultyEmail: faculty.email,
      teamsJoined: joinedTeams,
    };
  },

  /**
   * Retrieve all groups and pending/claimed roster statuses for a faculty member.
   */
  async getFacultyCohortStatus(facultyUserId: string) {
    const faculty = await prisma.user.findUnique({
      where: { id: facultyUserId },
      select: { id: true, name: true, email: true, facultyCode: true },
    });

    if (!faculty) {
      throw new Error('Faculty member not found');
    }

    // Auto-generate faculty code if not yet assigned
    if (!faculty.facultyCode) {
      const cleanLastName = faculty.name.replace(/^(dr\.|prof\.)\s+/i, '').split(' ').pop()?.toUpperCase() || 'GUIDE';
      let generated = `FAC-${cleanLastName}-2026`;
      try {
        await prisma.user.update({
          where: { id: faculty.id },
          data: { facultyCode: generated },
        });
        faculty.facultyCode = generated;
      } catch {
        generated = `FAC-${cleanLastName}-${Math.floor(1000 + Math.random() * 9000)}`;
        await prisma.user.update({
          where: { id: faculty.id },
          data: { facultyCode: generated },
        });
        faculty.facultyCode = generated;
      }
    }

    const teams = await prisma.team.findMany({
      where: { mentorId: facultyUserId },
      include: {
        activity: { select: { id: true, title: true } },
        members: {
          where: { removedAt: null },
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        industryMentor: { select: { id: true, name: true, email: true } },
        rosterInvitations: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      faculty,
      teams: teams.map((team) => {
        const claimedCount = team.rosterInvitations.filter((r) => r.claimed).length;
        const totalCount = team.rosterInvitations.length;

        return {
          id: team.id,
          name: team.name,
          activityTitle: team.activity.title,
          projectTitle: team.projectTitle,
          projectDescription: team.projectDescription,
          projectDomain: team.projectDomain,
          projectSource: team.projectSource,
          projectStatus: team.projectStatus,
          industryMentor: team.industryMentor,
          membersCount: team.members.length,
          rosterProgress: {
            claimed: claimedCount,
            total: totalCount,
            allConnected: totalCount > 0 && claimedCount === totalCount,
          },
          students: team.rosterInvitations.map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            role: r.role,
            claimed: r.claimed,
            claimedAt: r.claimedAt,
          })),
        };
      }),
    };
  },

  /**
   * Regenerate or set a custom unique invite code for a faculty member.
   */
  async generateOrUpdateFacultyCode(facultyUserId: string, customCode?: string) {
    const faculty = await prisma.user.findUnique({
      where: { id: facultyUserId },
      select: { id: true, name: true, email: true, facultyCode: true },
    });

    if (!faculty) {
      throw new Error('Faculty member not found');
    }

    let code = customCode?.trim().toUpperCase();
    if (!code) {
      const cleanLastName = faculty.name.replace(/^(dr\.|prof\.)\s+/i, '').split(' ').pop()?.toUpperCase() || 'GUIDE';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      code = `FAC-${cleanLastName}-${randomSuffix}`;
    }

    const updated = await prisma.user.update({
      where: { id: facultyUserId },
      data: { facultyCode: code },
      select: { id: true, name: true, email: true, facultyCode: true },
    });

    return updated;
  },
};
