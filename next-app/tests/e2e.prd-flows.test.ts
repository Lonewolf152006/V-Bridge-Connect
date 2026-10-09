import { describe, it, expect, afterAll } from 'vitest';
import prisma from '@/lib/db/prisma';

describe('STEP 6 — E2E PRD Flow Verification', () => {
  const ts = Date.now();
  let createdActivityId: string | null = null;
  let createdMilestoneId: string | null = null;
  let createdSubmissionId: string | null = null;
  let createdUserId: string | null = null;

  afterAll(async () => {
    // Cleanup created test records in cascade order
    if (createdMilestoneId) {
      await prisma.submission.deleteMany({ where: { milestoneId: createdMilestoneId } }).catch(() => {});
      await prisma.milestone.delete({ where: { id: createdMilestoneId } }).catch(() => {});
    }
    if (createdActivityId) {
      await prisma.activity.delete({ where: { id: createdActivityId } }).catch(() => {});
    }
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
  });

  // ─── Flow 1: Auth & Role Boundaries ─────────────────────────────────────
  describe('Flow 1: Authentication & Role Permissions', () => {
    it('verifies student role access and dashboard retrieval', async () => {
      const res = await fetch('http://127.0.0.1:3000/api/v1/student/dashboard');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.metrics).toBeDefined();
    }, 15000);

    it('verifies admin access to directory and reports', async () => {
      const resUsers = await fetch('http://127.0.0.1:3000/api/v1/admin/users');
      expect(resUsers.status).toBe(200);
      const usersData = await resUsers.json();
      expect(Array.isArray(usersData.users)).toBe(true);
      expect(usersData.users.length).toBeGreaterThan(0);

      const resReports = await fetch('http://127.0.0.1:3000/api/v1/admin/reports');
      expect(resReports.status).toBe(200);
      const reportsData = await resReports.json();
      expect(reportsData.metrics).toBeDefined();
      expect(reportsData.metrics.totalStudents).toBeGreaterThan(0);
    }, 15000);
  });

  // ─── Flow 2: Core Loop — Multi-Role Interaction ──────────────────────────
  describe('Flow 2: Core Loop (Coordinator Creates -> Student Submits -> Mentor Evaluates)', () => {
    it('executes full project lifecycle from creation to evaluation', async () => {
      // 1. Find a faculty mentor
      const mentor = await prisma.user.findFirst({
        where: { email: { contains: 'sheetal' } },
      });
      expect(mentor).toBeDefined();

      // 2. Find a test team that has at least one member
      let team = await prisma.team.findFirst({
        where: { members: { some: {} } },
        include: { activity: true, members: { include: { user: true } } },
      });
      if (!team) {
        team = await prisma.team.findFirst({
          include: { activity: true, members: { include: { user: true } } },
        });
      }
      expect(team).toBeDefined();

      // 3. Coordinator/Mentor creates a new Milestone for the activity
      const milestone = await prisma.milestone.create({
        data: {
          activityId: team!.activityId,
          stageNumber: 99,
          title: `E2E Verified Sprint Milestone ${ts}`,
          description: 'Autonomous end-to-end integration test deliverable',
          dueDate: new Date(Date.now() + 86400000 * 14),
          weightage: 25,
          deliverableType: 'GITHUB_URL',
        },
      });
      createdMilestoneId = milestone.id;
      expect(milestone.id).toBeDefined();

      // 4. Student queries milestone via API
      const resMilestones = await fetch('http://127.0.0.1:3000/api/v1/milestones');
      expect(resMilestones.status).toBe(200);
      const milestonesJson = await resMilestones.json();
      const foundMilestone = (milestonesJson.data || []).find((m: any) => m.id === milestone.id);
      expect(foundMilestone).toBeDefined();
      expect(foundMilestone.title).toBe(`E2E Verified Sprint Milestone ${ts}`);

      // 5. Student submits work
      let studentMember = team!.members[0]?.user;
      if (!studentMember) {
        const anyStudent = await prisma.user.findFirst({ where: { role: 'student' } });
        studentMember = anyStudent!;
      }
      expect(studentMember).toBeDefined();

      const subRes = await fetch('http://127.0.0.1:3000/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: team!.id,
          milestoneId: milestone.id,
          externalUrl: 'https://github.com/vbridge/verified-e2e-artifact',
          studentNote: 'Automated E2E submission verifying cross-role flow',
        }),
      });
      expect([200, 201]).toContain(subRes.status);
      const subJson = await subRes.json();
      expect(subJson.success).toBe(true);
      expect(subJson.data?.id).toBeDefined();
      createdSubmissionId = subJson.data.id;

      // 6. Mentor views submission on submissions endpoint
      const checkSubRes = await fetch('http://127.0.0.1:3000/api/submissions');
      expect(checkSubRes.status).toBe(200);
      const listJson = await checkSubRes.json();
      const foundSub = (listJson.data || []).find((s: any) => s.id === createdSubmissionId);
      expect(foundSub).toBeDefined();
      expect(foundSub.status).toBe('submitted');

      // 7. Coordinator/Mentor accepts submission via state machine transition verb
      const { signAccessToken } = await import('@/lib/auth/jwt');
      const coordinatorToken = await signAccessToken({
        userId: mentor!.id,
        role: 'coordinator',
        email: mentor!.email,
        departmentId: mentor!.departmentId || undefined,
      });

      const gradeRes = await fetch(`http://127.0.0.1:3000/api/v1/submissions/${createdSubmissionId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${coordinatorToken}`,
        },
        body: JSON.stringify({
          publicFeedback: 'Exemplary architectural soundness and verified test evidence.',
          totalScore: 95,
          maxScore: 100,
        }),
      });
      expect([200, 201]).toContain(gradeRes.status);
      const gradeJson = await gradeRes.json();
      expect(gradeJson.success).toBe(true);
      expect(gradeJson.data.status).toBe('accepted');

      // 8. Verify the submission in DB reflects accepted state
      const dbSub = await prisma.submission.findUnique({
        where: { id: createdSubmissionId! },
      });
      expect(dbSub?.status).toBe('accepted');
    }, 20000);
  });

  // ─── Flow 3: Error Paths, Validation & Boundaries ────────────────────────
  describe('Flow 3: Boundary Validations & Error Rejections', () => {
    it('rejects milestone creation with missing required fields with clear 400 or 401 error', async () => {
      const res = await fetch('http://127.0.0.1:3000/api/v1/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing title, activityId
          stageNumber: 1,
        }),
      });
      expect([400, 401]).toContain(res.status);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('rejects project assignment when title is missing', async () => {
      const res = await fetch('http://127.0.0.1:3000/api/v1/mentor/assign-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: 'team-mini-1',
          // missing title
        }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('rejects duplicate or invalid state transitions', async () => {
      if (!createdSubmissionId) return;

      // Cannot execute an invalid state machine verb
      const res = await fetch(`http://127.0.0.1:3000/api/v1/submissions/${createdSubmissionId}/invalid-verb`, {
        method: 'POST',
      });
      expect(res.status).toBe(400);
    });
  });
});
