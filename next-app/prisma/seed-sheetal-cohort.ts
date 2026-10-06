// VBridgeConnect — Seed Dr. Sheetal Patil's Groups (Mini 1, Mini 6, Mini 8)
// Run with: npx tsx prisma/seed-sheetal-cohort.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nameToVitEmail } from '../src/lib/modules/roster/vit-resolver';

const prisma = new PrismaClient();

const SHEETAL_COHORT_DATA = [
  {
    groupId: 'Mini 1',
    guide: 'Dr. Sheetal Patil',
    students: [
      { rawName: 'Harshad Prakash Panchal', role: 'student_lead' },
      { rawName: 'Aditya Vijay Parmale', role: 'student_member' },
      { rawName: 'Mayur Babu Naik', role: 'student_member' },
      { rawName: 'Ritesh Omprakash Yadav', role: 'student_member' },
    ],
  },
  {
    groupId: 'Mini 6',
    guide: 'Dr. Sheetal Patil',
    students: [
      { rawName: 'Yash Sachin Khanvilkar', role: 'student_lead' },
      { rawName: 'Paras Rajeev Shah', role: 'student_member' },
      { rawName: 'Vedant Nilesh Patole', role: 'student_member' },
      { rawName: 'Vedant Balvant Nikumbh', role: 'student_member' },
    ],
  },
  {
    groupId: 'Mini 8',
    guide: 'Dr. Sheetal Patil',
    students: [
      { rawName: 'Deven vilas sonawane', role: 'student_lead' },
      { rawName: 'Kshitij palekar', role: 'student_member' },
      { rawName: 'Mihtil karambe', role: 'student_member' },
      { rawName: 'Parth karalkar', role: 'student_member' },
    ],
  },
];

async function main() {
  console.log('🌱 Starting seed for Dr. Sheetal Patil cohort (VIT)...');

  // 1. College & Department
  const college = await prisma.college.upsert({
    where: { code: 'VIT' },
    update: {},
    create: {
      name: 'Vidyalankar Institute of Technology',
      code: 'VIT',
    },
  });

  // Department: Electronics and Computer Science (EXCS)
  const department = await prisma.department.upsert({
    where: { code: 'EXCS' },
    update: {
      name: 'Electronics and Computer Science',
      collegeId: college.id,
    },
    create: {
      name: 'Electronics and Computer Science',
      code: 'EXCS',
      collegeId: college.id,
    },
  });

  // Also migrate legacy CMPN department if it exists
  const oldCmpn = await prisma.department.findUnique({ where: { code: 'CMPN' } });
  if (oldCmpn) {
    await prisma.user.updateMany({
      where: { departmentId: oldCmpn.id },
      data: { departmentId: department.id },
    });
    await prisma.activity.updateMany({
      where: { departmentId: oldCmpn.id },
      data: { departmentId: department.id },
    });
    await prisma.department.delete({ where: { id: oldCmpn.id } });
  }

  // 2. Dr. Sheetal Patil User Record
  const guideEmail = 'sheetal.patil@vit.edu.in';
  const defaultPasswordHash = await bcrypt.hash('Test1234!', 10);

  const sheetalMam = await prisma.user.upsert({
    where: { email: guideEmail },
    update: {
      name: 'Dr. Sheetal Patil',
      role: 'coordinator',
      departmentId: department.id,
      facultyCode: 'FAC-SPATIL-2026',
      passwordHash: defaultPasswordHash,
    },
    create: {
      email: guideEmail,
      name: 'Dr. Sheetal Patil',
      role: 'coordinator',
      departmentId: department.id,
      institutionalId: 'VIT-FAC-0142',
      passwordHash: defaultPasswordHash,
      facultyCode: 'FAC-SPATIL-2026',
    },
  });

  console.log(`✅ Guide ready: ${sheetalMam.name} (${sheetalMam.email}) | Invite Code: ${sheetalMam.facultyCode}`);

  // 3. Mini Project Activity
  const activityTitle = 'Semester 5 Mini Project';
  let activity = await prisma.activity.findFirst({
    where: {
      OR: [
        { title: activityTitle },
        { title: 'EXCS Semester 5 Mini Project 2026' },
      ],
      departmentId: department.id,
    },
  });

  if (!activity) {
    activity = await prisma.activity.create({
      data: {
        title: activityTitle,
        description: 'Semester 5 Mini Project for Electronics and Computer Science students under faculty mentorship.',
        type: 'project',
        status: 'published',
        departmentId: department.id,
        ownerId: sheetalMam.id,
        capacity: 40,
        teamSizeMin: 3,
        teamSizeMax: 4,
        participationMode: 'team',
        visibility: 'department',
      },
    });
  } else {
    activity = await prisma.activity.update({
      where: { id: activity.id },
      data: {
        title: activityTitle,
        description: 'Semester 5 Mini Project for Electronics and Computer Science students under faculty mentorship.',
      },
    });
  }

  // Remove any previously fabricated milestones
  await prisma.milestone.deleteMany({
    where: { activityId: activity.id },
  });

  console.log(`✅ Activity ready: ${activity.title} (${activity.id}) (Milestones cleared - none fabricated)`);

  // 4. Clean up any legacy prefixed teams (EXCS-5-*) or unneeded demo teams
  const legacyTeams = await prisma.team.findMany({
    where: {
      OR: [
        { name: { startsWith: 'EXCS-5-' } },
        { name: 'Team Nexus' },
      ],
    },
    select: { id: true },
  });
  if (legacyTeams.length > 0) {
    const legacyIds = legacyTeams.map((t) => t.id);
    const conversations = await prisma.conversation.findMany({
      where: { teamId: { in: legacyIds } },
      select: { id: true },
    });
    const convIds = conversations.map((c) => c.id);
    if (convIds.length > 0) {
      await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.conversationParticipant.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
    }
    await prisma.submission.deleteMany({ where: { teamId: { in: legacyIds } } });
    await prisma.rosterInvitation.deleteMany({ where: { teamId: { in: legacyIds } } });
    await prisma.teamMembership.deleteMany({ where: { teamId: { in: legacyIds } } });
    await prisma.team.deleteMany({ where: { id: { in: legacyIds } } });
    console.log(`🧹 Cleaned up ${legacyTeams.length} legacy/demo teams.`);
  }

  // 5. Create the Groups (Mini 1, Mini 6, Mini 8), Conversations, and Roster Invitations
  for (const groupData of SHEETAL_COHORT_DATA) {
    let team = await prisma.team.findFirst({
      where: {
        activityId: activity.id,
        name: groupData.groupId,
      },
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: groupData.groupId,
          activityId: activity.id,
          mentorId: sheetalMam.id,
          riskStatus: 'on_track',
        },
      });
    } else {
      team = await prisma.team.update({
        where: { id: team.id },
        data: {
          name: groupData.groupId,
          mentorId: sheetalMam.id,
        },
      });
    }

    // Ensure Group Conversation exists
    let conversation = await prisma.conversation.findFirst({
      where: { teamId: team.id, type: 'group' },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          name: `#${team.name.replace(/\s+/g, '-')}-workspace`,
          type: 'group',
          teamId: team.id,
          activityId: activity.id,
        },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          name: `#${team.name.replace(/\s+/g, '-')}-workspace`,
        },
      });
    }

    // Ensure Sheetal Mam is a participant in this team's conversation
    const existingParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: conversation.id,
        userId: sheetalMam.id,
        removedAt: null,
      },
    });

    if (!existingParticipant) {
      await prisma.conversationParticipant.create({
        data: {
          conversationId: conversation.id,
          userId: sheetalMam.id,
        },
      });
    }

    console.log(`\n📌 Team [${team.name}] staged with Conversation (${conversation.id})`);

    // 5. Stage Roster Invitations for the 4 students
    for (const s of groupData.students) {
      const resolved = nameToVitEmail(s.rawName);
      if (!resolved.email) continue;

      await prisma.rosterInvitation.upsert({
        where: {
          teamId_email: {
            teamId: team.id,
            email: resolved.email,
          },
        },
        update: {
          name: resolved.normalizedName,
          role: s.role,
          facultyMentorEmail: guideEmail,
        },
        create: {
          activityId: activity.id,
          teamId: team.id,
          email: resolved.email,
          name: resolved.normalizedName,
          role: s.role,
          facultyMentorEmail: guideEmail,
          claimed: false,
        },
      });

      // Update student user account with Electronics and Computer Science department
      await prisma.user.upsert({
        where: { email: resolved.email },
        update: {
          name: resolved.normalizedName,
          role: 'student',
          departmentId: department.id,
        },
        create: {
          email: resolved.email,
          name: resolved.normalizedName,
          role: 'student',
          departmentId: department.id,
          passwordHash: null,
        },
      });

      console.log(`   - ${resolved.normalizedName.padEnd(28)} -> ${resolved.email.padEnd(30)} [${s.role}]`);
    }
  }

  console.log('\n🎉 Sheetal Mam cohort updated successfully!');
  console.log('Department: Electronics and Computer Science (EXCS)');
  console.log('Teams: Mini 1, Mini 6, Mini 8');
  console.log('Activity: Semester 5 Mini Project');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
