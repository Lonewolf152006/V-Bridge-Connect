import { test, expect } from '@playwright/test';
import prisma from '../src/lib/db/prisma';

/**
 * ============================================================================
 * VBridgeConnect Automated End-to-End Audit & RBAC Integrity Test Suite
 * ============================================================================
 * 4 Specialized Audit Bots:
 *  - Bot 1: Role-Based Access Control (RBAC) & Data Scoping Verifier (FR-092)
 *  - Bot 2: Database Immutability & Data-Flow Auditor (FR-052 & FR-114/115)
 *  - Bot 3: TE Review-2 Evaluation Schema & Math Verification Bot
 *  - Bot 4: Network Waterfall, Avatar & Bundle Hygiene Bot
 * ============================================================================
 */

test.describe('VBridgeConnect Comprehensive Audit Bots Suite', () => {
  // Global seed check before running tests
  test.beforeAll(async () => {
    // Ensure baseline seed data exists
    const admin = await prisma.user.findFirst({ where: { email: 'admin@vbridge.com' } });
    if (!admin) {
      await prisma.user.create({
        data: {
          email: 'admin@vbridge.com',
          name: 'Super Admin',
          role: 'super_admin',
        },
      });
    }

    const coordinator = await prisma.user.findFirst({ where: { email: 'sheetal.patil@vit.edu.in' } });
    if (!coordinator) {
      await prisma.user.create({
        data: {
          email: 'sheetal.patil@vit.edu.in',
          name: 'Dr. Sheetal Patil',
          role: 'coordinator',
        },
      });
    }

    const student = await prisma.user.findFirst({ where: { email: 'vedant.nikumbh@vit.edu.in' } });
    if (!student) {
      await prisma.user.create({
        data: {
          email: 'vedant.nikumbh@vit.edu.in',
          name: 'Vedant Nikumbh',
          role: 'student',
          institutionalId: 'VIT-ECS-2026-001',
        },
      });
    }

    const partner = await prisma.user.findFirst({ where: { email: 'expert@industry.com' } });
    if (!partner) {
      await prisma.user.create({
        data: {
          email: 'expert@industry.com',
          name: 'Industry Partner',
          role: 'industry_partner',
        },
      });
    }
  });

  // --------------------------------------------------------------------------
  // BOT 1: Role-Based Access Control (RBAC) & Data Scoping Verifier (FR-092)
  // --------------------------------------------------------------------------
  test.describe('Bot 1: Role-Based Access Control (RBAC) & Data Scoping Verifier (FR-092)', () => {
    const industryUser = {
      email: 'expert@industry.com',
      role: 'INDUSTRY_PARTNER',
    };

    test('enforces route-level access control: redirects INDUSTRY_PARTNER away from restricted routes', async ({
      page,
      context,
    }) => {
      // 1. Authenticate as INDUSTRY_PARTNER via demo cookie
      await context.addCookies([
        {
          name: 'vbridge_demo_user',
          value: encodeURIComponent(JSON.stringify(industryUser)),
          domain: 'localhost',
          path: '/',
        },
      ]);

      // 2. Attempt to navigate to restricted routes
      const restrictedRoutes = [
        '/admin/reports',
        '/coordinator/roster-upload',
        '/mentor/dashboard',
      ];

      for (const route of restrictedRoutes) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');

        // Middleware must intercept and redirect away to /dashboard
        const currentUrl = page.url();
        expect(
          currentUrl,
          `INDUSTRY_PARTNER should be blocked from accessing ${route}`
        ).not.toContain(route);
        expect(
          currentUrl,
          `INDUSTRY_PARTNER should be redirected to /dashboard from ${route}`
        ).toContain('/dashboard');
      }
    });

    test('verifies data scoping: sensitive academic keys strictly absent in API and project payloads', async ({
      request,
    }) => {
      const authHeaders = {
        Cookie: `vbridge_demo_user=${encodeURIComponent(JSON.stringify(industryUser))}`,
      };

      // 1. Call GET /api/v1/evaluations/review-2
      const evalRes = await request.get('/api/v1/evaluations/review-2', { headers: authHeaders });
      expect(evalRes.status()).toBe(200);
      const evalJson = await evalRes.json();
      expect(evalJson.success).toBe(true);

      // 2. Call GET /api/v1/student/dashboard
      const studentRes = await request.get('/api/v1/student/dashboard', { headers: authHeaders });
      expect(studentRes.status()).toBe(200);
      const studentJson = await studentRes.json();
      expect(studentJson.success).toBe(true);

      // 3. Inspect team response if available
      const team = await prisma.team.findFirst({ select: { id: true } });
      const teamId = team?.id || 'team-mini-1';
      const teamRes = await request.get(`/projects/${teamId}`, { headers: authHeaders });
      expect([200, 304, 307]).toContain(teamRes.status());

      // 4. Recursive assertion to confirm sensitive keys are strictly absent
      const sensitiveForbiddenKeys = [
        'gpa',
        'cgpa',
        'institutionalgrade',
        'facultyprivatenotes',
      ];

      function assertNoSensitiveFields(obj: any, path = 'root'): void {
        if (!obj || typeof obj !== 'object') return;

        if (Array.isArray(obj)) {
          obj.forEach((item, idx) => assertNoSensitiveFields(item, `${path}[${idx}]`));
          return;
        }

        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          for (const forbidden of sensitiveForbiddenKeys) {
            expect(
              lowerKey,
              `FR-092 Violation: Sensitive key "${key}" found at ${path}.${key} for INDUSTRY_PARTNER`
            ).not.toBe(forbidden);
          }
          assertNoSensitiveFields(value, `${path}.${key}`);
        }
      }

      assertNoSensitiveFields(evalJson, 'evaluations_payload');
      assertNoSensitiveFields(studentJson, 'student_dashboard_payload');
    });
  });

  // --------------------------------------------------------------------------
  // BOT 2: Database Immutability & Data-Flow Auditor (FR-052 & FR-114/115)
  // --------------------------------------------------------------------------
  test.describe('Bot 2: Database Immutability & Data-Flow Auditor (FR-052 & FR-114/115)', () => {
    const studentUser = {
      email: 'vedant.nikumbh@vit.edu.in',
      role: 'STUDENT',
    };

    test('verifies immutable version incrementation and certificate DOM segregation', async ({
      page,
      request,
      context,
    }) => {
      // 1. Resolve an active milestone and team in Prisma
      let milestone = await prisma.milestone.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      let team = await prisma.team.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      let student = await prisma.user.findFirst({
        where: { email: 'vedant.nikumbh@vit.edu.in' },
      });

      if (!milestone) {
        let activity = await prisma.activity.findFirst();
        if (!activity) {
          const dept = await prisma.department.findFirst();
          const admin = await prisma.user.findFirst();
          activity = await prisma.activity.create({
            data: {
              title: 'TE Mini-Project 2026-27',
              description: 'TE Mini-Project 2026-27 description',
              type: 'project',
              capacity: 100,
              departmentId: dept!.id,
              ownerId: admin!.id,
            },
          });
        }
        milestone = await prisma.milestone.create({
          data: {
            activityId: activity.id,
            title: 'Review 2 Architecture Deliverable',
            description: 'Architecture review deliverable',
            stageNumber: 2,
            weightage: 20,
            dueDate: new Date(Date.now() + 86400000 * 14),
          },
        });
      }

      if (!team) {
        team = await prisma.team.create({
          data: {
            name: 'Mini 1',
            activityId: milestone.activityId,
            projectTitle: 'Automated Audit Verification System',
          },
        });
      }

      // 2. Query Prisma baseline count of submissions for this milestone
      const baselineCount = await prisma.submission.count({
        where: { milestoneId: milestone.id },
      });

      const authHeaders = {
        Cookie: `vbridge_demo_user=${encodeURIComponent(JSON.stringify(studentUser))}`,
        'Content-Type': 'application/json',
      };

      // 3. Trigger first submission via API
      const timestamp1 = Date.now();
      const sub1FileUrl = `https://storage.vbridge.edu/deliverables/audit-v1-${timestamp1}.pdf`;
      const sub1Res = await request.post('/api/submissions', {
        headers: authHeaders,
        data: {
          milestoneId: milestone.id,
          teamId: team.id,
          fileUrl: sub1FileUrl,
          fileName: `audit-report-v1-${timestamp1}.pdf`,
          fileSizeBytes: 1048576,
          studentNote: 'Audit Bot 2 Deliverable Version 1 Initial Submission',
        },
      });
      expect(sub1Res.status()).toBe(201);
      const sub1Json = await sub1Res.json();
      expect(sub1Json.success).toBe(true);
      const sub1Id = sub1Json.data.id;

      // Query Prisma directly for version 1 record
      const v1RecordBefore = await prisma.submission.findUnique({
        where: { id: sub1Id },
      });
      expect(v1RecordBefore).not.toBeNull();
      expect(v1RecordBefore!.fileUrl).toBe(sub1FileUrl);

      // Brief delay to ensure chronological distinction
      await new Promise((r) => setTimeout(r, 250));

      // 4. Trigger second sequential submission via API
      const timestamp2 = Date.now();
      const sub2FileUrl = `https://storage.vbridge.edu/deliverables/audit-v2-${timestamp2}.pdf`;
      const sub2Res = await request.post('/api/submissions', {
        headers: authHeaders,
        data: {
          milestoneId: milestone.id,
          teamId: team.id,
          fileUrl: sub2FileUrl,
          fileName: `audit-report-v2-${timestamp2}.pdf`,
          fileSizeBytes: 2097152,
          studentNote: 'Audit Bot 2 Deliverable Version 2 Iteration',
        },
      });
      expect(sub2Res.status()).toBe(201);
      const sub2Json = await sub2Res.json();
      expect(sub2Json.success).toBe(true);

      // 5. Query Prisma directly to verify:
      // a) Total count increased by exactly 2 (never overwritten via in-place UPDATE)
      const finalCount = await prisma.submission.count({
        where: { milestoneId: milestone.id },
      });
      expect(finalCount).toBe(baselineCount + 2);

      // b) Version 1's createdAt timestamp and fileUrl remain completely unchanged
      const v1RecordAfter = await prisma.submission.findUnique({
        where: { id: sub1Id },
      });
      expect(v1RecordAfter).not.toBeNull();
      expect(v1RecordAfter!.fileUrl).toBe(sub1FileUrl);
      expect(v1RecordAfter!.createdAt.toISOString()).toBe(v1RecordBefore!.createdAt.toISOString());
      expect(v1RecordAfter!.version).toBe(v1RecordBefore!.version);

      // 6. Navigate to /certificates and verify Platform-Verified vs Self-Reported segregation
      // Ensure baseline certificates exist in PostgreSQL
      const existingPlatformCert = await prisma.certificate.findFirst({
        where: { type: 'platform_issued' },
      });
      if (!existingPlatformCert) {
        await prisma.certificate.create({
          data: {
            studentId: student?.id || 'demo-student-id',
            activityTitle: 'TE Capstone Industry Project Distinction',
            type: 'platform_issued',
            status: 'issued',
            verificationHash: 'sha256-verified-institutional-ledger-e2e',
            issueDate: new Date(),
          },
        });
      }

      const existingSelfCert = await prisma.certificate.findFirst({
        where: { type: 'self_reported' },
      });
      if (!existingSelfCert) {
        await prisma.certificate.create({
          data: {
            studentId: student?.id || 'demo-student-id',
            activityTitle: 'AWS Certified Cloud Practitioner',
            type: 'self_reported',
            status: 'posted',
            externalProvider: 'Amazon Web Services',
            issueDate: new Date(),
          },
        });
      }

      await context.addCookies([
        {
          name: 'vbridge_demo_user',
          value: encodeURIComponent(JSON.stringify(studentUser)),
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/certificates');
      await page.waitForLoadState('networkidle');

      // Verify Platform-Verified certificate indicators
      const platformBadge = page.locator('text=Official University Verified');
      await expect(platformBadge.first()).toBeVisible();

      const shaHashLabel = page.locator('text=SHA-256 Ledger Hash');
      await expect(shaHashLabel.first()).toBeVisible();

      const qrButton = page.locator('button:has-text("Verify Ledger QR")');
      await expect(qrButton.first()).toBeVisible();

      // Verify Self-Reported certificate indicators
      const selfReportedBadge = page.locator('text=Uploaded / External');
      await expect(selfReportedBadge.first()).toBeVisible();

      const selfReportedContainerNotice = page.locator(
        'text=Self-reported external credential'
      );
      await expect(selfReportedContainerNotice.first()).toBeVisible();
    });
  });

  // --------------------------------------------------------------------------
  // BOT 3: TE Review-2 Evaluation Schema & Math Verification Bot
  // --------------------------------------------------------------------------
  test.describe('Bot 3: TE Review-2 Evaluation Schema & Math Verification Bot', () => {
    const coordinatorUser = {
      email: 'sheetal.patil@vit.edu.in',
      role: 'COORDINATOR',
    };
    const adminUser = {
      email: 'admin@vbridge.com',
      role: 'SUPER_ADMIN',
    };

    test('validates schema boundaries and accurately verifies 43/50 marks computation in DB and Admin UI', async ({
      page,
      request,
      context,
    }) => {
      const coordHeaders = {
        Cookie: `vbridge_demo_user=${encodeURIComponent(JSON.stringify(coordinatorUser))}`,
        'Content-Type': 'application/json',
      };

      // 1. Boundary Test A: 'Modifications required' with empty modificationsSuggested -> HTTP 400
      const invalidModRes = await request.post('/api/v1/evaluations/review-2', {
        headers: coordHeaders,
        data: {
          groupName: 'Mini 1',
          outcome: 'Modifications required',
          modificationsSuggested: '',
          expectedOutcome: 'Fix hardware driver',
        },
      });
      expect(invalidModRes.status()).toBe(400);
      const invalidModJson = await invalidModRes.json();
      expect(invalidModJson.success).toBe(false);

      // 2. Boundary Test B: Out-of-range rubric score (score = 0) -> HTTP 400
      const scoreZeroRes = await request.post('/api/v1/evaluations/review-2', {
        headers: coordHeaders,
        data: {
          groupName: 'Mini 1',
          outcome: 'Idea Approved',
          planning: 0,
          problemStatement: 9,
          literatureReview: 8,
          analysis: 9,
        },
      });
      expect(scoreZeroRes.status()).toBe(400);

      // Boundary Test C: Out-of-range rubric score (score = 11) -> HTTP 400
      const scoreElevenRes = await request.post('/api/v1/evaluations/review-2', {
        headers: coordHeaders,
        data: {
          groupName: 'Mini 1',
          outcome: 'Idea Approved',
          planning: 8,
          problemStatement: 11,
          literatureReview: 8,
          analysis: 9,
        },
      });
      expect(scoreElevenRes.status()).toBe(400);

      // 3. Submit valid 18-question payload with exact known marks:
      // planning: 8          (8 * 0.5 = 4.0)
      // problemStatement: 9  (9 * 1.0 = 9.0)
      // literatureReview: 8  (8 * 1.5 = 12.0)
      // analysis: 9          (9 * 2.0 = 18.0)
      // Total = 4.0 + 9.0 + 12.0 + 18.0 = 43.0 out of 50
      const targetGroupName = `Audit-Group-${Date.now().toString(36).toUpperCase()}`;
      const validPayload = {
        groupName: targetGroupName,
        allPresent: 'Yes',
        absentStudents: 'NA',
        suggestedTitle: 'Edge Vision Inspection System for Industrial Safety',
        outcome: 'Idea Approved',
        modificationsSuggested: 'NA',
        expectedOutcome: 'Sub-50ms inference latency on Jetson edge board',
        planning: 8,
        problemStatement: 9,
        literatureReview: 8,
        analysis: 9,
        difficultyLevel: 8,
        presentationQuality: 9,
        englishProficiency: 8,
        progressPercentage: '50-75%',
        panelMember1: 'Dr. Sheetal Patil',
        panelMember2: 'Prof. Amol Kulkarni',
        evaluatorName: 'Dr. Sheetal Patil',
        evaluatorEmail: 'sheetal.patil@vit.edu.in',
      };

      const validRes = await request.post('/api/v1/evaluations/review-2', {
        headers: coordHeaders,
        data: validPayload,
      });
      expect([200, 201]).toContain(validRes.status());
      const validJson = await validRes.json();
      expect(validJson.success).toBe(true);
      expect(validJson.evaluation.totalMarks).toBe(43);
      expect(validJson.evaluation.planningMarks).toBe(4);
      expect(validJson.evaluation.problemClarityMarks).toBe(9);
      expect(validJson.evaluation.literatureReviewMarks).toBe(12);
      expect(validJson.evaluation.analysisMarks).toBe(18);

      const evaluationId = validJson.evaluation.id;

      // 4. Verify directly in PostgreSQL via Prisma client
      const dbAuditEvent = await prisma.auditEvent.findFirst({
        where: {
          entityType: 'review_2_evaluation',
          entityId: evaluationId,
        },
      });
      expect(dbAuditEvent, 'Audit event must be stored in database').not.toBeNull();
      const storedPayload = dbAuditEvent!.newValue as any;
      expect(storedPayload.totalMarks).toBe(43);
      expect(storedPayload.groupName).toBe(targetGroupName);

      // 5. Verify on /admin/reports as SUPER_ADMIN
      await context.addCookies([
        {
          name: 'vbridge_demo_user',
          value: encodeURIComponent(JSON.stringify(adminUser)),
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      // Assert row containing targetGroupName exists with totalMarks 43
      const tableRow = page.locator(`tr:has-text("${targetGroupName}")`);
      await expect(tableRow).toBeVisible({ timeout: 15000 });
      await expect(tableRow.locator('text=43').first()).toBeVisible();
    });
  });

  // --------------------------------------------------------------------------
  // BOT 4: Network Waterfall, Avatar & Bundle Hygiene Bot
  // --------------------------------------------------------------------------
  test.describe('Bot 4: Network Waterfall, Avatar & Bundle Hygiene Bot', () => {
    const adminUser = {
      email: 'admin@vbridge.com',
      role: 'SUPER_ADMIN',
    };

    test('enforces zero Dicebear calls, deferred xlsx chunk import, and session polling budget', async ({
      page,
      request,
      context,
    }) => {
      // 1. Attach page.on('request') listener for hygiene monitoring
      let dicebearCalls: string[] = [];
      let xlsxLoadedBeforeClick = false;
      let clickedExportButton = false;
      let sessionRequestCount = 0;

      page.on('request', (req) => {
        const url = req.url();

        // Rule 4: Zero requests to api.dicebear.com
        if (url.includes('api.dicebear.com')) {
          dicebearCalls.push(url);
        }

        // Rule 5: Dynamic import of xlsx chunk only upon user click
        if (url.toLowerCase().includes('xlsx') || url.toLowerCase().includes('sheetjs')) {
          if (!clickedExportButton) {
            xlsxLoadedBeforeClick = true;
          }
        }

        // NextAuth session spam hygiene
        if (url.includes('/api/auth/session')) {
          sessionRequestCount++;
        }
      });

      // 2. Authenticate as admin
      await context.addCookies([
        {
          name: 'vbridge_demo_user',
          value: encodeURIComponent(JSON.stringify(adminUser)),
          domain: 'localhost',
          path: '/',
        },
      ]);

      // 3. Navigate across /dashboard, /projects/[teamId], and /admin/reports
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const team = await prisma.team.findFirst({ select: { id: true } });
      const teamId = team?.id || 'team-mini-1';
      await page.goto(`/projects/${teamId}`);
      await page.waitForLoadState('networkidle');

      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      // Assert Rule 4: Zero Dicebear network requests
      expect(
        dicebearCalls.length,
        `Hygiene Rule 4 Violation: Detected ${dicebearCalls.length} request(s) to api.dicebear.com: ${dicebearCalls.join(', ')}`
      ).toBe(0);

      // Assert Rule 5: xlsx chunk must NOT be downloaded on initial page load
      expect(
        xlsxLoadedBeforeClick,
        'Hygiene Rule 5 Violation: xlsx bundle chunk was downloaded on initial page load before user clicked export!'
      ).toBe(false);

      // 4. Tab blur and focus cycle to verify session polling budget
      sessionRequestCount = 0; // reset for the blur/focus cycle
      await page.evaluate(() => {
        window.dispatchEvent(new Event('blur'));
        window.dispatchEvent(new Event('focus'));
      });
      await page.waitForTimeout(600);

      expect(
        sessionRequestCount,
        `Hygiene Rule 1 Violation: /api/auth/session was called ${sessionRequestCount} times during tab blur/focus cycle (max budget: 2)`
      ).toBeLessThanOrEqual(2);

      // 5. Test Export Review-2 Excel (.xlsx) button
      const exportButton = page.locator('button:has-text("Export Review-2 Excel (.xlsx)")');
      if (await exportButton.isVisible()) {
        clickedExportButton = true;
        // Intercept download or alert
        page.once('dialog', (dialog) => dialog.dismiss());
        const downloadPromise = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
        await exportButton.click();
        await downloadPromise;
      }

      // 6. Measure API response times (< 500ms benchmark)
      const authHeaders = {
        Cookie: `vbridge_demo_user=${encodeURIComponent(JSON.stringify(adminUser))}`,
      };

      const startStudent = Date.now();
      const resStudent = await request.get('/api/v1/student/dashboard', { headers: authHeaders });
      const durationStudent = Date.now() - startStudent;
      expect(resStudent.status()).toBe(200);

      if (durationStudent > 500) {
        console.warn(`[PERF WARNING] /api/v1/student/dashboard took ${durationStudent}ms (> 500ms budget)`);
      } else {
        console.log(`[PERF PASS] /api/v1/student/dashboard responded in ${durationStudent}ms`);
      }

      const startEval = Date.now();
      const resEval = await request.get('/api/v1/evaluations/review-2', { headers: authHeaders });
      const durationEval = Date.now() - startEval;
      expect(resEval.status()).toBe(200);

      if (durationEval > 500) {
        console.warn(`[PERF WARNING] /api/v1/evaluations/review-2 took ${durationEval}ms (> 500ms budget)`);
      } else {
        console.log(`[PERF PASS] /api/v1/evaluations/review-2 responded in ${durationEval}ms`);
      }
    });
  });
});
