// VBridgeConnect — Realistic Institutional Scale Seeder (Phase C3)
// Generates:
//   - 4 Departments
//   - 200 Users (160 Students, 20 Faculty Mentors/Coordinators, 10 Coordinators, 5 Industry Partners, 5 Admins)
//   - 40 Activities
//   - 60 Teams & Team Memberships
//   - 2,000 Milestones
//   - 10,000 Messages & Audit Events

import { PrismaClient, UserRole, ActivityStatus, MilestoneStatus, TeamRiskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'Test1234!';

async function main() {
  console.log('🚀 Starting Phase C3 Realistic Institutional Scale Seeder...\n');
  const startTime = performance.now();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. College
  const college = await prisma.college.upsert({
    where: { code: 'VBU' },
    update: {},
    create: { name: 'VBridge University', code: 'VBU' },
  });

  // 2. Departments
  const deptCodes = [
    { code: 'CS-AI', name: 'Computer Science & AI' },
    { code: 'EE', name: 'Electrical Engineering' },
    { code: 'MECH', name: 'Mechanical & Automation' },
    { code: 'CIVIL', name: 'Civil & Infrastructure' },
  ];

  const depts: Record<string, string> = {};
  for (const d of deptCodes) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: { name: d.name, code: d.code, collegeId: college.id },
    });
    depts[d.code] = dept.id;
  }
  const deptIds = Object.values(depts);

  // 3. Term
  const term = await prisma.term.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Fall 2026',
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: new Date('2026-12-15T23:59:59Z'),
      departmentId: deptIds[0],
    },
  });

  // Check how many users already exist
  const existingUserCount = await prisma.user.count();
  console.log(`Current users in database: ${existingUserCount}`);

  // Create users up to 200
  const usersToCreate = [];
  const neededUsers = Math.max(0, 200 - existingUserCount);

  if (neededUsers > 0) {
    console.log(`Creating ${neededUsers} institutional users...`);
    for (let i = 1; i <= neededUsers; i++) {
      let role: UserRole = 'student';
      let deptId = deptIds[i % deptIds.length];
      let facultyCode: string | undefined = undefined;

      if (i <= 5) {
        role = 'super_admin';
      } else if (i <= 15) {
        role = 'coordinator';
      } else if (i <= 35) {
        role = 'coordinator';
        facultyCode = `FAC-MENTOR-${1000 + i}`;
      } else if (i <= 40) {
        role = 'industry_partner';
      } else {
        role = 'student';
      }

      usersToCreate.push({
        id: uuidv4(),
        email: `scale.user.${i}.${Date.now()}@university.edu`,
        name: `Scale User ${i} (${role})`,
        role,
        departmentId: deptId,
        passwordHash,
        facultyCode,
        institutionalId: `INST-${2026}-${String(i).padStart(4, '0')}`,
      });
    }

    await prisma.user.createMany({
      data: usersToCreate,
      skipDuplicates: true,
    });
    console.log(`✓ Created users successfully.`);
  }

  // Fetch all users for relations
  const allUsers = await prisma.user.findMany({ select: { id: true, role: true, departmentId: true } });
  const students = allUsers.filter((u) => u.role === 'student');
  const coordinators = allUsers.filter((u) => u.role === 'coordinator');
  const partners = allUsers.filter((u) => u.role === 'industry_partner');
  console.log(`Total active users: ${allUsers.length} (Students: ${students.length}, Coordinators: ${coordinators.length})`);

  // 4. Activities (up to 40)
  const existingActivitiesCount = await prisma.activity.count();
  const neededActivities = Math.max(0, 40 - existingActivitiesCount);

  if (neededActivities > 0) {
    console.log(`Creating ${neededActivities} activities...`);
    const activitiesData = [];
    const types = ['project', 'research', 'competition', 'internship'];
    const statuses: ActivityStatus[] = ['active', 'published', 'draft', 'completed'];

    for (let i = 1; i <= neededActivities; i++) {
      const owner = coordinators[i % coordinators.length] || allUsers[0];
      activitiesData.push({
        id: uuidv4(),
        title: `Institutional Program ${i} — ${types[i % types.length].toUpperCase()}`,
        description: `Autonomous academic project track ${i} with industry alignment and ABET/NAAC accreditation criteria.`,
        type: types[i % types.length],
        status: statuses[i % statuses.length],
        departmentId: owner.departmentId || deptIds[0],
        termId: term.id,
        ownerId: owner.id,
        capacity: 30,
        filledSeats: 15,
        teamSizeMin: 2,
        teamSizeMax: 5,
        applicationDeadline: new Date(Date.now() + 30 * 86400000),
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 86400000),
        visibility: 'college',
        participationMode: 'team_after_selection',
        certificateEligible: true,
      });
    }

    await prisma.activity.createMany({
      data: activitiesData,
      skipDuplicates: true,
    });
    console.log(`✓ Created activities successfully.`);
  }

  const allActivities = await prisma.activity.findMany({ select: { id: true } });

  // 5. Teams (up to 60)
  const existingTeamsCount = await prisma.team.count();
  const neededTeams = Math.max(0, 60 - existingTeamsCount);

  if (neededTeams > 0) {
    console.log(`Creating ${neededTeams} teams...`);
    const teamsData = [];
    const risks: TeamRiskStatus[] = ['on_track', 'on_track', 'on_track', 'watch', 'at_risk'];

    for (let i = 1; i <= neededTeams; i++) {
      const act = allActivities[i % allActivities.length];
      const mentor = coordinators[i % coordinators.length] || null;
      const partner = partners.length > 0 ? partners[i % partners.length] : null;

      teamsData.push({
        id: uuidv4(),
        activityId: act.id,
        name: `Cohort Team ${i} - ${['Alpha', 'Omega', 'Nova', 'Vertex', 'Synergy', 'Apex'][i % 6]}`,
        mentorId: mentor ? mentor.id : null,
        industryMentorId: partner ? partner.id : null,
        projectTitle: `Advanced Automated Solution Track ${i}`,
        projectDomain: ['AI/ML', 'IoT', 'Cloud', 'Robotics', 'Web3'][i % 5],
        riskStatus: risks[i % risks.length],
        lastActivityAt: new Date(),
      });
    }

    await prisma.team.createMany({
      data: teamsData,
      skipDuplicates: true,
    });
    console.log(`✓ Created teams successfully.`);
  }

  const allTeams = await prisma.team.findMany({ select: { id: true, activityId: true } });

  // 6. Milestones (up to 2,000)
  const existingMilestonesCount = await prisma.milestone.count();
  const neededMilestones = Math.max(0, 2000 - existingMilestonesCount);

  if (neededMilestones > 0) {
    console.log(`Creating ${neededMilestones} milestones in batches...`);
    const milestoneStatuses: MilestoneStatus[] = ['accepted', 'in_progress', 'submitted', 'not_started', 'overdue'];
    const BATCH_SIZE = 500;
    let createdCount = 0;

    for (let b = 0; b < neededMilestones; b += BATCH_SIZE) {
      const currentBatchSize = Math.min(BATCH_SIZE, neededMilestones - b);
      const batchData = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const idx = b + i;
        const team = allTeams[idx % allTeams.length];
        const stageNum = (idx % 6) + 1;

        batchData.push({
          id: uuidv4(),
          activityId: team.activityId,
          teamId: team.id,
          title: `Milestone ${stageNum}: ${['Literature Survey', 'Architecture & Design', 'Mid-Term Review', 'Beta Prototype', 'Integration Testing', 'Final Defense'][stageNum - 1]}`,
          description: `Deliverable requirement and evaluation criteria for Sprint Stage ${stageNum}.`,
          stageNumber: stageNum,
          status: milestoneStatuses[idx % milestoneStatuses.length],
          dueDate: new Date(Date.now() + (stageNum * 14 - 30) * 86400000),
          weightage: 15,
          deliverableType: 'any',
        });
      }

      await prisma.milestone.createMany({
        data: batchData,
        skipDuplicates: true,
      });
      createdCount += currentBatchSize;
      process.stdout.write(`  Processed ${createdCount} / ${neededMilestones} milestones...\r`);
    }
    console.log(`\n✓ Created ${neededMilestones} milestones successfully.`);
  }

  // 7. Conversations & Messages + Audit Events (up to 10,000)
  const existingMsgCount = await prisma.message.count();
  const existingAuditCount = await prisma.auditEvent.count();
  const totalEventsNeeded = Math.max(0, 10000 - (existingMsgCount + existingAuditCount));

  if (totalEventsNeeded > 0) {
    console.log(`Creating conversations, messages, and audit events (${totalEventsNeeded} total)...`);

    // Ensure conversations exist for teams
    const existingConversations = await prisma.conversation.findMany({ select: { id: true, teamId: true } });
    const convTeamIds = new Set(existingConversations.map((c) => c.teamId));
    const convsToCreate = [];

    for (const t of allTeams) {
      if (!convTeamIds.has(t.id)) {
        convsToCreate.push({
          id: uuidv4(),
          type: 'group' as const,
          name: `Team Chat — ${t.id.slice(0, 8)}`,
          teamId: t.id,
          activityId: t.activityId,
        });
      }
    }

    if (convsToCreate.length > 0) {
      await prisma.conversation.createMany({
        data: convsToCreate,
        skipDuplicates: true,
      });
    }

    const allConversations = await prisma.conversation.findMany({ select: { id: true } });

    // Seed Messages (5,000) & Audit Events (5,000)
    const BATCH_SIZE = 1000;
    const msgCount = Math.floor(totalEventsNeeded / 2);
    const auditCount = totalEventsNeeded - msgCount;

    // Messages
    console.log(`Seeding ${msgCount} messages...`);
    for (let b = 0; b < msgCount; b += BATCH_SIZE) {
      const curSize = Math.min(BATCH_SIZE, msgCount - b);
      const msgBatch = [];
      for (let i = 0; i < curSize; i++) {
        const conv = allConversations[(b + i) % allConversations.length];
        const sender = allUsers[(b + i) % allUsers.length];
        msgBatch.push({
          id: uuidv4(),
          conversationId: conv.id,
          senderId: sender.id,
          content: `Automated status update and check-in item ${b + i + 1} regarding team progress and deliverable review.`,
          createdAt: new Date(Date.now() - (b + i) * 60000),
        });
      }
      await prisma.message.createMany({ data: msgBatch, skipDuplicates: true });
    }

    // Audit Events
    console.log(`Seeding ${auditCount} audit events...`);
    const actions = ['submission.created', 'milestone.evaluated', 'team.risk_updated', 'certificate.issued', 'role.assigned'];
    for (let b = 0; b < auditCount; b += BATCH_SIZE) {
      const curSize = Math.min(BATCH_SIZE, auditCount - b);
      const auditBatch = [];
      for (let i = 0; i < curSize; i++) {
        const actor = allUsers[(b + i) % allUsers.length];
        auditBatch.push({
          id: uuidv4(),
          actorId: actor.id,
          entityType: 'submission',
          entityId: uuidv4(),
          action: actions[(b + i) % actions.length],
          priorValue: { status: 'draft' },
          newValue: { status: 'accepted' },
          ipAddress: '127.0.0.1',
          createdAt: new Date(Date.now() - (b + i) * 120000),
        });
      }
      await prisma.auditEvent.createMany({ data: auditBatch, skipDuplicates: true });
    }
  }

  const finalCounts = {
    users: await prisma.user.count(),
    activities: await prisma.activity.count(),
    teams: await prisma.team.count(),
    milestones: await prisma.milestone.count(),
    messages: await prisma.message.count(),
    auditEvents: await prisma.auditEvent.count(),
  };

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log('\n================================================================');
  console.log('   PHASE C3 REALISTIC INSTITUTIONAL SCALE SEEDING COMPLETE      ');
  console.log('================================================================');
  console.log(`Users:        ${finalCounts.users} (Target >= 200)`);
  console.log(`Activities:   ${finalCounts.activities} (Target >= 40)`);
  console.log(`Teams:        ${finalCounts.teams} (Target >= 60)`);
  console.log(`Milestones:   ${finalCounts.milestones} (Target >= 2,000)`);
  console.log(`Messages:     ${finalCounts.messages}`);
  console.log(`Audit Events: ${finalCounts.auditEvents}`);
  console.log(`Combined Activity Events: ${finalCounts.messages + finalCounts.auditEvents} (Target >= 10,000)`);
  console.log(`Total Elapsed Time: ${elapsed}s`);
  console.log('================================================================\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seeding scale failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
