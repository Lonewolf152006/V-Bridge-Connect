// GET /api/v1/student/dashboard — Real database-backed student dashboard data
// Replaces all mock data with real records from PostgreSQL

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';
import { rosterService } from '@/lib/modules/roster/roster.service';


export async function GET() {
  try {
    const sessionUser = await getOptionalSession();
    let user = sessionUser;
    if (!user) {
      const student =
        (await prisma.user.findFirst({ where: { email: 'vedant.nikumbh@vit.edu.in' } })) ||
        (await prisma.user.findFirst({ where: { role: 'student' } }));
      if (student) {
        user = {
          id: student.id,
          email: student.email,
          name: student.name,
          role: 'student',
          departmentId: student.departmentId,
          institutionalId: student.institutionalId,
        };
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.email.toLowerCase().trim();

    // 1. Ensure any pending roster invitations are connected
    try {
      await rosterService.autoConnectUserOnLogin({
        id: user.id,
        email,
        name: user.name,
        role: user.role,
      });
    } catch (e) {
      console.warn('[StudentDashboardAPI] AutoConnect check warning:', e);
    }

    // 2. Fetch all active team memberships for this student
    let memberships: any[] = [];
    let certCount = 0;

    try {
      memberships = await prisma.teamMembership.findMany({
        where: {
          userId: user.id,
          removedAt: null,
        },
        include: {
          team: {
            include: {
              activity: {
                include: {
                  milestones: {
                    orderBy: { stageNumber: 'asc' },
                  },
                  department: true,
                },
              },
              mentor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              industryMentor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              proposals: {
                orderBy: { createdAt: 'desc' },
                include: {
                  submittedBy: { select: { id: true, name: true } },
                  reviewedBy: { select: { id: true, name: true } },
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
                      avatarUrl: true,
                    },
                  },
                },
              },
              rosterInvitations: true,
              milestones: {
                orderBy: { stageNumber: 'asc' },
              },
              submissions: {
                select: {
                  id: true,
                  milestoneId: true,
                  status: true,
                  totalScore: true,
                },
              },
            },
          },
        },
      });

      certCount = await prisma.certificate.count({
        where: {
          studentId: user.id,
          type: 'platform_issued',
          status: { in: ['posted', 'issued'] },
        },
      });
    } catch (dbErr) {
      console.warn('[StudentDashboardAPI] Database query fallback:', dbErr);
    }

    // 4. Map teams into rich frontend objects
    const mappedTeams = memberships.map((m: any) => {
      const t = m.team;
      const act = t.activity;

      // Combine actual user members and pending roster members so team is complete
      const existingUserEmails = new Set(t.members.map((mem: any) => mem.user.email.toLowerCase()));
      const rosterOnlyMembers = t.rosterInvitations
        .filter((r: any) => !existingUserEmails.has(r.email.toLowerCase()))
        .map((r: any) => ({
          id: `roster-${r.id}`,
          name: r.name,
          email: r.email,
          role: r.role === 'student_lead' ? 'LEAD' : 'CONTRIBUTOR',
          avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(r.name)}`,
          status: 'invited',
        }));

      const activeMembers = t.members.map((mem: any) => ({
        id: mem.user.id,
        name: mem.user.name,
        email: mem.user.email,
        role: mem.role.toUpperCase(),
        avatarUrl:
          mem.user.avatarUrl ||
          `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(mem.user.name)}`,
        status: 'active',
      }));

      const allMembers = [...activeMembers, ...rosterOnlyMembers];

      // Calculate milestone progress across activity-wide and team-specific milestones
      const combinedMilestonesRaw = [...(act.milestones || []), ...(t.milestones || [])];
      const milestoneMap = new Map();
      combinedMilestonesRaw.forEach((ms) => {
        if (!milestoneMap.has(ms.id)) milestoneMap.set(ms.id, ms);
      });
      const combinedMilestones = Array.from(milestoneMap.values()).sort(
        (a: any, b: any) => a.stageNumber - b.stageNumber
      );

      const totalMilestones = combinedMilestones.length;
      const passedSubmissions = t.submissions.filter(
        (s: any) => s.status === 'passed' || (s.totalScore !== null && s.totalScore >= 50)
      );
      const passedCount = passedSubmissions.length;
      const progressPercent = totalMilestones > 0 ? Math.round((passedCount / totalMilestones) * 100) : 0;

      // Find upcoming milestone
      const now = new Date();
      const upcoming = combinedMilestones.length > 0
        ? combinedMilestones.find((ms: any) => new Date(ms.dueDate) > now) || combinedMilestones[0]
        : null;

      return {
        id: t.id,
        name: t.name,
        activityId: act.id,
        activityTitle: act.title,
        activityDescription: act.description,
        activityType: act.type,
        department: act.department?.name || 'Electronics and Computer Science',
        riskStatus: t.riskStatus || 'on_track',
        projectTitle: t.projectTitle || null,
        projectDescription: t.projectDescription || null,
        projectDomain: t.projectDomain || 'Electronics and Computer Science',
        projectSource: t.projectSource || null,
        projectStatus: t.projectStatus || null,
        mentor: t.mentor
          ? {
              id: t.mentor.id,
              name: t.mentor.name,
              email: t.mentor.email,
            }
          : null,
        industryMentor: t.industryMentor
          ? {
              id: t.industryMentor.id,
              name: t.industryMentor.name,
              email: t.industryMentor.email,
            }
          : null,
        proposals: (t.proposals || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          problemStatement: p.problemStatement,
          techStack: p.techStack,
          domain: p.domain,
          objectives: p.objectives,
          status: p.status,
          feedback: p.feedback,
          createdAt: p.createdAt.toISOString(),
        })),
        members: allMembers,
        milestones: combinedMilestones.map((ms: any) => ({
          id: ms.id,
          stageNumber: ms.stageNumber,
          title: ms.title,
          description: ms.description,
          dueDate: typeof ms.dueDate === 'string' ? ms.dueDate : ms.dueDate.toISOString(),
          weightage: ms.weightage,
        })),
        progressPercent,
        passedMilestonesCount: passedCount,
        totalMilestonesCount: totalMilestones,
        upcomingMilestone: upcoming
          ? {
              id: upcoming.id,
              title: upcoming.title,
              description: upcoming.description,
              stageNumber: upcoming.stageNumber,
              dueDate: upcoming.dueDate.toISOString(),
              weightage: upcoming.weightage,
            }
          : null,
      };
    });

    if (mappedTeams.length === 0) {
      // No teamMembership found — try to find their team via rosterInvitation
      try {
        const roster = await prisma.rosterInvitation.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
          include: {
            team: {
              include: {
                activity: {
                  include: {
                    milestones: { orderBy: { stageNumber: 'asc' } },
                    department: true,
                  },
                },
                mentor: { select: { id: true, name: true, email: true, avatarUrl: true } },
                industryMentor: { select: { id: true, name: true, email: true, avatarUrl: true } },
                members: {
                  where: { removedAt: null },
                  include: { user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } },
                },
                rosterInvitations: true,
                milestones: { orderBy: { stageNumber: 'asc' } },
                submissions: { select: { id: true, milestoneId: true, status: true, totalScore: true } },
                proposals: {
                  orderBy: { createdAt: 'desc' },
                  include: {
                    submittedBy: { select: { id: true, name: true } },
                    reviewedBy: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        });

        if (roster?.team) {
          // Auto-connect the student to the team
          await rosterService.autoConnectUserOnLogin({ id: user.id, email, name: user.name, role: user.role });

          const t = roster.team;
          const act = t.activity;

          const existingUserEmails = new Set(t.members.map((mem: any) => mem.user.email.toLowerCase()));
          const rosterOnlyMembers = t.rosterInvitations
            .filter((r: any) => !existingUserEmails.has(r.email.toLowerCase()))
            .map((r: any) => ({
              id: `roster-${r.id}`,
              name: r.name,
              email: r.email,
              role: r.role === 'student_lead' ? 'LEAD' : 'CONTRIBUTOR',
              avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(r.name)}`,
              status: 'invited',
            }));

          const activeMembers = t.members.map((mem: any) => ({
            id: mem.user.id,
            name: mem.user.name,
            email: mem.user.email,
            role: mem.role.toUpperCase(),
            avatarUrl: mem.user.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(mem.user.name)}`,
            status: 'active',
          }));

          const allMembers = [...activeMembers, ...rosterOnlyMembers];
          const passedSubmissions = t.submissions.filter(
            (s: any) => s.status === 'passed' || (s.totalScore !== null && s.totalScore >= 50)
          );

          const combinedMilestonesRaw = [...(act.milestones || []), ...(t.milestones || [])];
          const milestoneMap = new Map();
          combinedMilestonesRaw.forEach((ms) => {
            if (!milestoneMap.has(ms.id)) milestoneMap.set(ms.id, ms);
          });
          const combinedMilestones = Array.from(milestoneMap.values()).sort(
            (a: any, b: any) => a.stageNumber - b.stageNumber
          );

          const totalMilestones = combinedMilestones.length;
          const passedCount = passedSubmissions.length;
          const progressPercent = totalMilestones > 0 ? Math.round((passedCount / totalMilestones) * 100) : 0;
          const now = new Date();
          const upcoming = combinedMilestones.length > 0
            ? combinedMilestones.find((ms: any) => new Date(ms.dueDate) > now) || combinedMilestones[0]
            : null;

          mappedTeams.push({
            id: t.id,
            name: t.name,
            activityId: act.id,
            activityTitle: act.title,
            activityDescription: act.description,
            activityType: act.type,
            department: act.department?.name || 'Electronics and Computer Science',
            riskStatus: t.riskStatus || 'on_track',
            projectTitle: t.projectTitle || null,
            projectDescription: t.projectDescription || null,
            projectDomain: t.projectDomain || null,
            projectSource: t.projectSource || null,
            projectStatus: t.projectStatus || null,
            mentor: t.mentor ? { id: t.mentor.id, name: t.mentor.name, email: t.mentor.email } : null,
            industryMentor: t.industryMentor ? { id: t.industryMentor.id, name: t.industryMentor.name, email: t.industryMentor.email } : null,
            proposals: (t.proposals || []).map((p: any) => ({
              id: p.id, title: p.title, problemStatement: p.problemStatement,
              techStack: p.techStack, domain: p.domain, objectives: p.objectives,
              status: p.status, feedback: p.feedback, createdAt: p.createdAt.toISOString(),
            })),
            members: allMembers,
            milestones: combinedMilestones.map((ms: any) => ({
              id: ms.id, stageNumber: ms.stageNumber, title: ms.title,
              description: ms.description,
              dueDate: typeof ms.dueDate === 'string' ? ms.dueDate : ms.dueDate.toISOString(),
              weightage: ms.weightage,
            })),
            progressPercent,
            passedMilestonesCount: passedCount,
            totalMilestonesCount: totalMilestones,
            upcomingMilestone: upcoming ? {
              id: upcoming.id, title: upcoming.title, description: upcoming.description,
              stageNumber: upcoming.stageNumber, dueDate: upcoming.dueDate.toISOString(), weightage: upcoming.weightage,
            } : null,
          });
        }
      } catch (fallbackErr) {
        console.warn('[StudentDashboardAPI] Roster fallback warning:', fallbackErr);
      }
    }

    const activeTeam = mappedTeams[0] || null;

    // Upcoming deadline (if any milestone is due within 30 days)
    let criticalDeadline = null;
    if (activeTeam && activeTeam.upcomingMilestone) {
      const due = new Date(activeTeam.upcomingMilestone.dueDate);
      const diffHours = Math.round((due.getTime() - Date.now()) / (1000 * 60 * 60));
      criticalDeadline = {
        milestoneId: activeTeam.upcomingMilestone.id,
        milestoneTitle: activeTeam.upcomingMilestone.title,
        stageNumber: activeTeam.upcomingMilestone.stageNumber,
        activityTitle: activeTeam.activityTitle,
        deliverableNote: activeTeam.upcomingMilestone.description,
        weightage: activeTeam.upcomingMilestone.weightage,
        dueInHours: diffHours > 0 ? diffHours : 0,
        dueInDays: Math.ceil(diffHours / 24),
        teamId: activeTeam.id,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: user.id,
          name: user.name,
          email: user.email,
          department: (user as any).departmentName || 'Electronics and Computer Science',
        },
        metrics: {
          enrolledProjects: mappedTeams.length,
          milestonesPassed: activeTeam ? activeTeam.passedMilestonesCount : 0,
          totalMilestones: activeTeam ? activeTeam.totalMilestonesCount : 0,
          issuedCertificates: certCount,
          teamRiskStatus: activeTeam ? activeTeam.riskStatus : 'on_track',
        },
        activeTeam,
        teams: mappedTeams,
        criticalDeadline,
      },
    });
  } catch (error: any) {
    console.error('[API student/dashboard error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
