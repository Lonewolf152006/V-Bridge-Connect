import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { nameToVitEmail } from '@/lib/modules/roster/vit-resolver';

export interface RosterStudentInput {
  name: string;
  role?: string; // 'lead' | 'member' | 'student_lead' | 'student_member'
  email?: string;
  rollNo?: string;
}

export interface RosterGroupInput {
  groupId: string; // e.g. "Mini 1", "Team 4"
  guideName: string; // e.g. "Dr. Sheetal Patil"
  guideEmail?: string;
  students: RosterStudentInput[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const groups: RosterGroupInput[] = body.groups;
    const activityTitle = body.activityTitle || 'Semester 5 Mini Project';
    const departmentName = body.departmentName || 'Electronics and Computer Science';

    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one group with students and a faculty guide.' },
        { status: 400 }
      );
    }

    // 1. Ensure College exists
    const college = await prisma.college.upsert({
      where: { code: 'VIT' },
      update: {},
      create: {
        name: 'Vidyalankar Institute of Technology',
        code: 'VIT',
      },
    });

    // 2. Ensure Department exists
    const deptCode = departmentName === 'Electronics and Computer Science' ? 'EXCS' : 'DEPT';
    const department = await prisma.department.upsert({
      where: { code: deptCode },
      update: { name: departmentName },
      create: {
        name: departmentName,
        code: deptCode,
        collegeId: college.id,
      },
    });

    const defaultPasswordHash = await bcrypt.hash('Test1234!', 10);

    const processedGroups: Array<{
      groupName: string;
      guideName: string;
      guideEmail: string;
      studentsCount: number;
      students: string[];
    }> = [];

    let totalStudentsLinked = 0;

    // Process each group
    for (const grp of groups) {
      if (!grp.groupId || !grp.guideName) continue;

      const groupCleanName = grp.groupId.trim();
      const guideCleanName = grp.guideName.trim();

      // Resolve Faculty Guide Email
      let guideEmail = grp.guideEmail?.trim().toLowerCase();
      if (!guideEmail) {
        const resolvedGuide = nameToVitEmail(guideCleanName);
        guideEmail = resolvedGuide.email || `${guideCleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@vit.edu.in`;
      }

      // Generate or retrieve Faculty Code
      const facultyCode = `FAC-${guideCleanName.replace(/^(dr\.|prof\.)\s+/i, '').split(' ').pop()?.toUpperCase() || 'GUIDE'}-2026`;

      // 3. Upsert Faculty Guide User
      const facultyUser = await prisma.user.upsert({
        where: { email: guideEmail },
        update: {
          name: guideCleanName,
          role: 'coordinator',
          departmentId: department.id,
          facultyCode,
        },
        create: {
          name: guideCleanName,
          email: guideEmail,
          role: 'coordinator',
          departmentId: department.id,
          facultyCode,
          institutionalId: facultyCode,
          passwordHash: defaultPasswordHash,
        },
      });

      // 4. Upsert Activity (Semester 5 Mini Project)
      let activity = await prisma.activity.findFirst({
        where: {
          title: activityTitle,
          departmentId: department.id,
        },
      });

      if (!activity) {
        activity = await prisma.activity.create({
          data: {
            title: activityTitle,
            description: `${activityTitle} for ${department.name} under faculty mentorship.`,
            type: 'project',
            status: 'published',
            departmentId: department.id,
            ownerId: facultyUser.id,
            capacity: 60,
            teamSizeMin: 3,
            teamSizeMax: 4,
            participationMode: 'team',
            visibility: 'department',
          },
        });
      }

      // 5. Upsert Team
      let team = await prisma.team.findFirst({
        where: {
          activityId: activity.id,
          name: groupCleanName,
        },
      });

      if (!team) {
        team = await prisma.team.create({
          data: {
            name: groupCleanName,
            activityId: activity.id,
            mentorId: facultyUser.id,
            riskStatus: 'on_track',
          },
        });
      } else {
        team = await prisma.team.update({
          where: { id: team.id },
          data: {
            mentorId: facultyUser.id,
          },
        });
      }

      // 6. Ensure Team Conversation exists
      const conversationName = `#${team.name.replace(/\s+/g, '-').toLowerCase()}-workspace`;
      let conversation = await prisma.conversation.findFirst({
        where: { teamId: team.id, type: 'group' },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            name: conversationName,
            type: 'group',
            teamId: team.id,
            activityId: activity.id,
          },
        });
      }

      // Add Faculty Guide to Conversation
      const guideParticipant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: conversation.id,
          userId: facultyUser.id,
          removedAt: null,
        },
      });

      if (!guideParticipant) {
        await prisma.conversationParticipant.create({
          data: {
            conversationId: conversation.id,
            userId: facultyUser.id,
          },
        });
      }

      // 7. Process Students in Group
      const studentsList: string[] = [];

      for (const s of grp.students) {
        if (!s.name || s.name.trim() === '') continue;

        const resolved = nameToVitEmail(s.name);
        const studentEmail = s.email?.toLowerCase().trim() || resolved.email;
        if (!studentEmail) continue;

        const studentFullName = resolved.normalizedName || s.name.trim();
        const isLead =
          s.role?.toLowerCase().includes('lead') ||
          s.role?.toLowerCase() === 'team_lead' ||
          grp.students.indexOf(s) === 0;
        const membershipRole = isLead ? 'lead' : 'contributor';
        const rosterRole = isLead ? 'student_lead' : 'student_member';

        // Upsert student User
        const studentUser = await prisma.user.upsert({
          where: { email: studentEmail },
          update: {
            name: studentFullName,
            role: 'student',
            departmentId: department.id,
            institutionalId: s.rollNo || undefined,
          },
          create: {
            email: studentEmail,
            name: studentFullName,
            role: 'student',
            departmentId: department.id,
            institutionalId: s.rollNo || undefined,
            passwordHash: defaultPasswordHash,
          },
        });

        // Upsert RosterInvitation (marked claimed)
        await prisma.rosterInvitation.upsert({
          where: {
            teamId_email: {
              teamId: team.id,
              email: studentEmail,
            },
          },
          update: {
            name: studentFullName,
            role: rosterRole,
            facultyMentorEmail: guideEmail,
            claimed: true,
            claimedAt: new Date(),
            claimedById: studentUser.id,
          },
          create: {
            activityId: activity.id,
            teamId: team.id,
            email: studentEmail,
            name: studentFullName,
            role: rosterRole,
            facultyMentorEmail: guideEmail,
            claimed: true,
            claimedAt: new Date(),
            claimedById: studentUser.id,
          },
        });

        // Upsert TeamMembership
        const existingMembership = await prisma.teamMembership.findFirst({
          where: {
            teamId: team.id,
            userId: studentUser.id,
            removedAt: null,
          },
        });

        if (!existingMembership) {
          await prisma.teamMembership.create({
            data: {
              teamId: team.id,
              userId: studentUser.id,
              role: membershipRole,
              reason: 'Auto-associated via Cohort Roster Upload',
            },
          });
        }

        // Upsert Application
        const existingApp = await prisma.application.findUnique({
          where: {
            activityId_applicantId: {
              activityId: activity.id,
              applicantId: studentUser.id,
            },
          },
        });

        if (!existingApp) {
          await prisma.application.create({
            data: {
              activityId: activity.id,
              applicantId: studentUser.id,
              teamId: team.id,
              status: 'selected',
              statementOfPurpose: 'Allocated via Cohort Roster Upload.',
            },
          });
        }

        // Add to team conversation
        const studentParticipant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: conversation.id,
            userId: studentUser.id,
            removedAt: null,
          },
        });

        if (!studentParticipant) {
          await prisma.conversationParticipant.create({
            data: {
              conversationId: conversation.id,
              userId: studentUser.id,
            },
          });
        }

        studentsList.push(`${studentFullName} (${membershipRole.toUpperCase()})`);
        totalStudentsLinked++;
      }

      processedGroups.push({
        groupName: team.name,
        guideName: facultyUser.name,
        guideEmail: facultyUser.email,
        studentsCount: studentsList.length,
        students: studentsList,
      });
    }

    // 8. Record Immutable Audit Event
    await prisma.auditEvent.create({
      data: {
        action: 'COHORT_ROSTER_UPLOADED',
        entityType: 'cohort_roster',
        entityId: `roster-${Date.now()}`,
        reason: `Roster upload successfully associated ${processedGroups.length} groups and ${totalStudentsLinked} students with departmental faculty.`,
        newValue: {
          groupsCount: processedGroups.length,
          studentsLinkedCount: totalStudentsLinked,
          department: department.name,
          groups: processedGroups.map(g => ({ name: g.groupName, guide: g.guideName, count: g.studentsCount })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed and associated ${processedGroups.length} groups with their faculty guide!`,
      summary: {
        groupsProcessed: processedGroups.length,
        totalStudentsLinked,
        department: department.name,
        activityTitle,
      },
      details: processedGroups,
    });
  } catch (error: any) {
    console.error('[API /api/v1/roster/upload POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload and associate roster', details: error.message },
      { status: 500 }
    );
  }
}
