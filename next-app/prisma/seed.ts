// VBridgeConnect — Prisma Seed Script
// Creates deterministic test data for all 4 roles.
// Run: npx prisma db seed

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Test1234!';

async function main() {
  console.log('🌱 Seeding VBridgeConnect database...\n');

  // Hash the default password once
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // ─── College & Departments ──────────────────────────────────────────────
  const college = await prisma.college.upsert({
    where: { code: 'VBU' },
    update: {},
    create: {
      name: 'VBridge University',
      code: 'VBU',
    },
  });

  const csDept = await prisma.department.upsert({
    where: { code: 'CS-AI' },
    update: {},
    create: {
      name: 'Computer Science & AI',
      code: 'CS-AI',
      collegeId: college.id,
    },
  });

  const eeDept = await prisma.department.upsert({
    where: { code: 'EE' },
    update: {},
    create: {
      name: 'Electrical Engineering',
      code: 'EE',
      collegeId: college.id,
    },
  });

  // ─── Term ───────────────────────────────────────────────────────────────
  const term = await prisma.term.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Fall 2026',
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: new Date('2026-12-15T23:59:59Z'),
      departmentId: csDept.id,
    },
  });

  // ─── Users ──────────────────────────────────────────────────────────────
  const usersData: Array<{
    email: string;
    name: string;
    role: UserRole;
    departmentId: string;
    institutionalId: string;
    avatarUrl: string;
  }> = [
    {
      email: 'siddharth@university.edu',
      name: 'Siddharth Chen',
      role: 'student',
      departmentId: csDept.id,
      institutionalId: 'VC-2026-891',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Siddharth',
    },
    {
      email: 'maya@university.edu',
      name: 'Maya Lin',
      role: 'student',
      departmentId: csDept.id,
      institutionalId: 'VC-2026-442',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=MayaLin',
    },
    {
      email: 'tariq@university.edu',
      name: 'Tariq Ahmed',
      role: 'student',
      departmentId: eeDept.id,
      institutionalId: 'VC-2026-218',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Tariq',
    },
    {
      email: 'arjun@university.edu',
      name: 'Prof. Arjun Mehta',
      role: 'coordinator',
      departmentId: csDept.id,
      institutionalId: 'FAC-2015-011',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Arjun',
    },
    {
      email: 'rahul@techcorp.com',
      name: 'Rahul Kapoor',
      role: 'industry_partner',
      departmentId: csDept.id,
      institutionalId: 'IND-2026-001',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Rahul',
    },
    {
      email: 'rita@university.edu',
      name: 'Dean Rita Sharma',
      role: 'super_admin',
      departmentId: csDept.id,
      institutionalId: 'DEAN-2012-001',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Rita',
    },
  ];

  const users: Record<string, { id: string; role: UserRole }> = {};

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash },
      create: {
        ...u,
        passwordHash,
      },
    });
    users[u.email] = { id: user.id, role: user.role };
    console.log(`  ✓ User: ${u.name} (${u.role}) — ${u.email}`);
  }

  // ─── Activities ─────────────────────────────────────────────────────────
  const capstone = await prisma.activity.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      title: 'AI-Powered Accessibility Platform — Capstone 2026',
      description:
        'Build an AI-driven web platform that automatically generates alt text, captions, and screen-reader optimizations for existing websites. Teams will work with real accessibility standards (WCAG 2.2) and deploy a working browser extension.',
      type: 'project',
      status: 'active',
      departmentId: csDept.id,
      termId: term.id,
      ownerId: users['arjun@university.edu'].id,
      capacity: 20,
      filledSeats: 3,
      teamSizeMin: 2,
      teamSizeMax: 5,
      applicationDeadline: new Date('2026-09-15T23:59:59Z'),
      startDate: new Date('2026-09-20T00:00:00Z'),
      endDate: new Date('2026-12-10T23:59:59Z'),
      visibility: 'college',
      participationMode: 'team_after_selection',
      certificateEligible: true,
    },
  });

  const hackathon = await prisma.activity.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      title: 'VBridge Hackathon 2026 — Green Tech Edition',
      description:
        'A 48-hour hackathon focused on sustainable technology solutions. Open to all departments. Prizes for top 3 teams.',
      type: 'competition',
      status: 'published',
      departmentId: csDept.id,
      termId: term.id,
      ownerId: users['arjun@university.edu'].id,
      capacity: 50,
      filledSeats: 0,
      teamSizeMin: 3,
      teamSizeMax: 5,
      applicationDeadline: new Date('2026-11-01T23:59:59Z'),
      startDate: new Date('2026-11-15T09:00:00Z'),
      endDate: new Date('2026-11-17T18:00:00Z'),
      visibility: 'college',
      participationMode: 'pre_formed_team',
      certificateEligible: true,
    },
  });

  console.log(`\n  ✓ Activity: ${capstone.title} (${capstone.status})`);
  console.log(`  ✓ Activity: ${hackathon.title} (${hackathon.status})`);

  // ─── Team (for Capstone) ────────────────────────────────────────────────
  const team = await prisma.team.upsert({
    where: { id: '00000000-0000-0000-0000-000000000020' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000020',
      activityId: capstone.id,
      name: 'Team Nexus',
      riskStatus: 'on_track',
      lastActivityAt: new Date(),
    },
  });

  // Add Siddharth as lead, Maya as contributor
  await prisma.teamMembership.upsert({
    where: {
      teamId_userId_removedAt: {
        teamId: team.id,
        userId: users['siddharth@university.edu'].id,
        removedAt: new Date(0), // sentinel for null-safe unique
      },
    },
    update: {},
    create: {
      teamId: team.id,
      userId: users['siddharth@university.edu'].id,
      role: 'lead',
    },
  });

  await prisma.teamMembership.upsert({
    where: {
      teamId_userId_removedAt: {
        teamId: team.id,
        userId: users['maya@university.edu'].id,
        removedAt: new Date(0),
      },
    },
    update: {},
    create: {
      teamId: team.id,
      userId: users['maya@university.edu'].id,
      role: 'contributor',
    },
  });

  console.log(`\n  ✓ Team: ${team.name} (Siddharth=lead, Maya=contributor)`);

  // ─── Milestones (for Capstone) ──────────────────────────────────────────
  const milestonesData = [
    {
      id: '00000000-0000-0000-0000-000000000030',
      title: 'Project Proposal & Literature Review',
      description: 'Submit a 5-page project proposal with literature survey, problem statement, and methodology.',
      stageNumber: 1,
      status: 'accepted' as const,
      dueDate: new Date('2026-10-01T23:59:59Z'),
      weightage: 15,
      deliverableType: 'PDF',
    },
    {
      id: '00000000-0000-0000-0000-000000000031',
      title: 'Architecture & Prototype',
      description: 'Present system architecture diagrams, tech stack justification, and a working prototype of the core feature.',
      stageNumber: 2,
      status: 'in_progress' as const,
      dueDate: new Date('2026-10-25T23:59:59Z'),
      weightage: 25,
      deliverableType: 'any',
    },
    {
      id: '00000000-0000-0000-0000-000000000032',
      title: 'Beta Release & User Testing',
      description: 'Deploy a beta version, conduct usability testing with 5+ users, and submit a testing report.',
      stageNumber: 3,
      status: 'not_started' as const,
      dueDate: new Date('2026-11-20T23:59:59Z'),
      weightage: 30,
      deliverableType: 'any',
    },
    {
      id: '00000000-0000-0000-0000-000000000033',
      title: 'Final Submission & Presentation',
      description: 'Complete source code, documentation, and deliver a 15-minute live presentation with demo.',
      stageNumber: 4,
      status: 'not_started' as const,
      dueDate: new Date('2026-12-08T23:59:59Z'),
      weightage: 30,
      deliverableType: 'any',
    },
  ];

  for (const ms of milestonesData) {
    await prisma.milestone.upsert({
      where: { id: ms.id },
      update: {},
      create: {
        ...ms,
        activityId: capstone.id,
        teamId: team.id,
      },
    });
    console.log(`  ✓ Milestone: Stage ${ms.stageNumber} — ${ms.title} (${ms.status})`);
  }

  // ─── Application (Siddharth's accepted app for Capstone) ────────────────
  await prisma.application.upsert({
    where: {
      activityId_applicantId: {
        activityId: capstone.id,
        applicantId: users['siddharth@university.edu'].id,
      },
    },
    update: {},
    create: {
      activityId: capstone.id,
      applicantId: users['siddharth@university.edu'].id,
      status: 'selected',
      statementOfPurpose:
        'I am passionate about web accessibility and have experience with WCAG guidelines from my internship at a design agency.',
      reviewerId: users['arjun@university.edu'].id,
    },
  });

  // Maya's accepted app
  await prisma.application.upsert({
    where: {
      activityId_applicantId: {
        activityId: capstone.id,
        applicantId: users['maya@university.edu'].id,
      },
    },
    update: {},
    create: {
      activityId: capstone.id,
      applicantId: users['maya@university.edu'].id,
      status: 'selected',
      statementOfPurpose:
        'My research in NLP aligns perfectly with auto-generating alt text. I bring ML and PyTorch experience.',
      reviewerId: users['arjun@university.edu'].id,
    },
  });

  console.log('\n  ✓ Applications: Siddharth & Maya (selected for Capstone)');

  // ─── Submission (Milestone 1 — accepted) ────────────────────────────────
  await prisma.submission.upsert({
    where: {
      milestoneId_version: {
        milestoneId: '00000000-0000-0000-0000-000000000030',
        version: 1,
      },
    },
    update: {},
    create: {
      milestoneId: '00000000-0000-0000-0000-000000000030',
      teamId: team.id,
      submittedById: users['siddharth@university.edu'].id,
      version: 1,
      status: 'accepted',
      fileName: 'Team_Nexus_Proposal_v1.pdf',
      fileSizeBytes: 2_400_000,
      studentNote: 'Our proposal covers the WCAG 2.2 accessibility standards and proposes a browser extension approach.',
      reviewerId: users['arjun@university.edu'].id,
      reviewerPublicFeedback: 'Excellent proposal. Well-researched literature review. Approved to proceed to Phase 2.',
      reviewedAt: new Date('2026-10-03T14:00:00Z'),
      totalScore: 13,
      maxScore: 15,
    },
  });

  console.log('  ✓ Submission: Milestone 1 v1 (accepted, 13/15)');

  // ─── Summary ────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log('\n📋 Login credentials (all users):');
  console.log(`   Password: ${DEFAULT_PASSWORD}`);
  console.log('\n   Emails:');
  for (const u of usersData) {
    console.log(`     ${u.role.padEnd(18)} → ${u.email}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    prisma.$disconnect();
    process.exit(1);
  });
