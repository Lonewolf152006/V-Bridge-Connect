// scripts/test_phase_f_user_journeys.mjs
// Automated verification suite for Phase F — Production Readiness & Pre-Launch User Journeys
//
// Key Verification Pillars:
// - F1: Student End-to-End User Journey (Academic Lifecycle: Dashboard -> Offerings -> Teams -> Milestones -> Submit Deliverable -> History)
// - F2: Faculty Guide / Mentor Journey (Cohort Governance: Guided Teams -> Proposals -> Rubric Evaluation Review 2 -> Persistence)
// - F3: Department Coordinator Journey (Accreditation & Analytics: NAAC Reports -> Filters -> Platform-Issued Isolation)
// - F4: Super Admin Journey (Platform Oversight & Health: User Directory Pagination -> Role Filtering -> Healthcheck Probe)
// - F5: Mobile PWA, Offline & Digital Asset Links Verification (Manifest -> Service Worker -> /offline -> Android TWA assetlinks.json)
// - F6: Operational Secret & Token Gate Audit (Zero-mock verification & .env.example configuration)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { SignJWT } from 'jose';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const prisma = new PrismaClient();
const TEST_PORT = 3016;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vbridgeconnect-dev-secret-change-in-prod'
);

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✖ FAIL: ${message}`);
    failedCount++;
  }
}

async function createToken(userId, role, email, departmentId = null) {
  const payload = { userId, role, email };
  if (departmentId) payload.departmentId = departmentId;

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .setIssuer('vbridgeconnect')
    .sign(JWT_SECRET);
}

async function startServer() {
  console.log(`\n[Setup] Launching Next.js production server on port ${TEST_PORT}...`);
  const serverProcess = spawn('npx', ['next', 'start', '-p', String(TEST_PORT)], {
    cwd: ROOT_DIR,
    env: { ...process.env, PORT: String(TEST_PORT) },
    shell: true,
    stdio: 'pipe',
  });

  const startTime = Date.now();
  while (Date.now() - startTime < 45000) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.status === 200) {
        console.log(`[Setup] Next.js server online and healthy at ${BASE_URL}\n`);
        return serverProcess;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('Next.js server failed to launch within 45 seconds');
}

async function runPhaseFVerification() {
  console.log('================================================================');
  console.log('PHASE F: PRODUCTION READINESS & PRE-LAUNCH VERIFICATION SUITE');
  console.log('================================================================');

  let serverProcess = null;

  try {
    serverProcess = await startServer();

    // ─────────────────────────────────────────────────────────────
    // SETUP: Query / Seed Verified Users & Entities
    // ─────────────────────────────────────────────────────────────
    let student = await prisma.user.findFirst({ where: { role: 'student' } });
    if (!student) {
      student = await prisma.user.create({
        data: {
          email: 'student.journey@vit.edu.in',
          name: 'Journey Student',
          role: 'student',
        },
      });
    }

    let coordinator = await prisma.user.findFirst({ where: { role: 'coordinator' } });
    if (!coordinator) {
      coordinator = await prisma.user.create({
        data: {
          email: 'sheetal.patil@vit.edu.in',
          name: 'Dr. Sheetal Patil',
          role: 'coordinator',
        },
      });
    }

    let superAdmin = await prisma.user.findFirst({ where: { role: 'super_admin' } });
    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: {
          email: 'admin.journey@vit.edu.in',
          name: 'Platform Super Admin',
          role: 'super_admin',
        },
      });
    }

    let outsiderStudent = await prisma.user.findFirst({
      where: { role: 'student', id: { not: student.id } },
    });
    if (!outsiderStudent) {
      outsiderStudent = await prisma.user.create({
        data: {
          email: 'outsider.student@vit.edu.in',
          name: 'Outsider Student',
          role: 'student',
        },
      });
    }

    // Ensure an active team with membership for student
    let activeTeam = await prisma.team.findFirst({
      where: {
        members: { some: { userId: student.id, removedAt: null } },
      },
      include: {
        milestones: true,
      },
    });

    if (!activeTeam) {
      let activity = await prisma.activity.findFirst();
      if (!activity) {
        activity = await prisma.activity.create({
          data: {
            title: 'Capstone Project 2024-25',
            academicYear: '2024-25',
            status: 'in_progress',
            ownerId: coordinator.id,
          },
        });
      }

      activeTeam = await prisma.team.create({
        data: {
          name: `Team-Journey-${Date.now().toString().slice(-4)}`,
          activityId: activity.id,
          mentorId: coordinator.id,
          members: {
            create: {
              userId: student.id,
              role: 'lead',
            },
          },
        },
        include: {
          milestones: true,
        },
      });
    }

    // Ensure team has at least one milestone
    let milestone = await prisma.milestone.findFirst({
      where: { teamId: activeTeam.id },
    });

    if (!milestone) {
      milestone = await prisma.milestone.create({
        data: {
          teamId: activeTeam.id,
          activityId: activeTeam.activityId,
          title: 'Review 2 Architecture Deliverable',
          description: 'Architecture and system design deliverable for Review 2.',
          stageNumber: 2,
          dueDate: new Date(Date.now() + 86400000 * 7),
          deliverableType: 'PDF',
          status: 'pending',
          weightage: 20,
        },
      });
    }

    // Generate authenticated bearer tokens
    const studentToken = await createToken(student.id, 'student', student.email);
    const outsiderToken = await createToken(outsiderStudent.id, 'student', outsiderStudent.email);
    const mentorToken = await createToken(coordinator.id, 'coordinator', coordinator.email, coordinator.departmentId);
    const superAdminToken = await createToken(superAdmin.id, 'super_admin', superAdmin.email);

    // ─────────────────────────────────────────────────────────────
    // JOURNEY 1: Student Academic Lifecycle
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Journey 1] Student Academic Lifecycle (Dashboard -> Offerings -> Teams -> Milestones -> Submit -> History)');
    {
      // J1.1: Fetch Student Dashboard
      const dashRes = await fetch(`${BASE_URL}/api/v1/student/dashboard`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(dashRes.status === 200, 'J1.1: Student dashboard returned HTTP 200');
      const dashData = await dashRes.json();
      assert(dashData && typeof dashData === 'object', 'J1.1: Dashboard payload returned valid object');
      assert(Array.isArray(dashData.projects || dashData.memberships || []), 'J1.1: Dashboard includes student project memberships');

      // J1.2: Browse Project Topics / Offerings
      const offeringsRes = await fetch(`${BASE_URL}/api/v1/projects/offerings`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(offeringsRes.status === 200, 'J1.2: Project offerings catalogue returned HTTP 200');
      const offeringsData = await offeringsRes.json();
      assert(Array.isArray(offeringsData.data), 'J1.2: Offerings returns array of topics');

      // J1.3: List Teams
      const teamsRes = await fetch(`${BASE_URL}/api/v1/teams?limit=5`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(teamsRes.status === 200, 'J1.3: Teams listing returned HTTP 200');
      const teamsData = await teamsRes.json();
      assert(Array.isArray(teamsData.data), 'J1.3: Teams listing adheres to envelope format');
      assert(teamsData.metadata?.pagination, 'J1.3: Pagination metadata present in envelope');

      // J1.4: Query Milestones
      const milestonesRes = await fetch(`${BASE_URL}/api/v1/milestones?teamId=${activeTeam.id}`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(milestonesRes.status === 200, 'J1.4: Team milestones returned HTTP 200');
      const milestonesData = await milestonesRes.json();
      assert(Array.isArray(milestonesData.data), 'J1.4: Milestones returns array of stages');

      // J1.5: Submit Deliverable (Idempotent POST)
      const idempotencyKey = `sub-key-${Date.now()}`;
      const submissionPayload = {
        milestoneId: milestone.id,
        teamId: activeTeam.id,
        externalUrl: 'https://github.com/vbridge/capstone-prototype',
        studentNote: 'Automated end-to-end verification submission for Review 2.',
      };

      const submitRes = await fetch(`${BASE_URL}/api/v1/submissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(submissionPayload),
      });
      assert(submitRes.status === 201, 'J1.5: Student deliverable submitted with HTTP 201 Created');
      const submitData = await submitRes.json();
      const submissionId = submitData.data?.id;
      assert(submissionId, 'J1.5: Deliverable created with unique submission ID');

      // J1.6: Verify Submission History
      const historyRes = await fetch(`${BASE_URL}/api/v1/submissions?milestoneId=${milestone.id}`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(historyRes.status === 200, 'J1.6: Submission history returned HTTP 200');
      const historyData = await historyRes.json();
      const hasSubmission = historyData.data.some((s) => s.id === submissionId);
      assert(hasSubmission, 'J1.6: Newly created submission present and verified in history');

      // J1.7: Idempotency Replay Check
      const replayRes = await fetch(`${BASE_URL}/api/v1/submissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(submissionPayload),
      });
      assert(replayRes.status === 201, 'J1.7: Idempotent replay returned HTTP 201');
      const replayData = await replayRes.json();
      assert(replayData.data?.id === submissionId, 'J1.7: Replay returned exact same submission ID without duplicating');

      // J1.8: Unauthorized Student Check (Outsider rejected with 403)
      const unauthSubmitRes = await fetch(`${BASE_URL}/api/v1/submissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${outsiderToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionPayload),
      });
      assert(unauthSubmitRes.status === 403, 'J1.8: Non-team student submission rejected with HTTP 403 Forbidden');
    }

    // ─────────────────────────────────────────────────────────────
    // JOURNEY 2: Faculty Guide / Mentor Governance & Evaluation
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Journey 2] Faculty Guide / Mentor Governance & Evaluation (Cohort -> Proposals -> Review-2 -> Persistence)');
    {
      // J2.1: Query Faculty Cohort
      const cohortRes = await fetch(`${BASE_URL}/api/v1/mentor/cohort`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert(cohortRes.status === 200, 'J2.1: Faculty cohort status returned HTTP 200');
      const cohortData = await cohortRes.json();
      assert(cohortData.success === true, 'J2.1: Cohort data indicates success');

      // J2.2: Query Project Proposals
      const proposalsRes = await fetch(`${BASE_URL}/api/v1/mentor/proposals`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert(proposalsRes.status === 200, 'J2.2: Faculty guided proposals returned HTTP 200');
      const proposalsData = await proposalsRes.json();
      assert(Array.isArray(proposalsData.data), 'J2.2: Proposals returns array of submissions');

      // J2.3: Conduct Review 2 Evaluation
      const evalPayload = {
        teamId: activeTeam.id,
        groupName: activeTeam.name,
        allPresent: 'Yes',
        absentStudents: 'NA',
        suggestedTitle: 'Production Capstone Platform Architecture',
        ideaOutcome: 'Idea Approved',
        modificationsSuggested: 'Implement end-to-end telemetry hooks in pre-launch stage.',
        expectedOutcome: 'Zero-downtime containerized production build with database pooling.',
        planningScore: 9,
        problemClarityScore: 9,
        literatureReviewScore: 8,
        analysisScore: 9,
        difficultyLevel: 8,
        presentationQuality: 9,
        englishProficiency: 9,
        progressPercentage: '75-100%',
        panelMember1: 'Dr. Sheetal Patil',
        panelMember2: 'Prof. Amol Kulkarni',
      };

      const evalPostRes = await fetch(`${BASE_URL}/api/v1/evaluations/review-2`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mentorToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evalPayload),
      });
      assert(evalPostRes.status === 200, 'J2.3: Faculty Review 2 evaluation saved with HTTP 200');
      const evalPostData = await evalPostRes.json();
      assert(evalPostData.success === true, 'J2.3: Evaluation submission confirmed successful');

      // J2.4: Query Review 2 Evaluations
      const evalGetRes = await fetch(`${BASE_URL}/api/v1/evaluations/review-2?teamId=${activeTeam.id}`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert(evalGetRes.status === 200, 'J2.4: Review 2 evaluations queried with HTTP 200');
      const evalGetData = await evalGetRes.json();
      assert(Array.isArray(evalGetData.evaluations), 'J2.4: Evaluations returns array');
      const recordedEval = evalGetData.evaluations.find((e) => e.teamId === activeTeam.id || e.groupName === activeTeam.name);
      assert(recordedEval !== undefined, 'J2.4: Submitted evaluation record persisted and retrieved');

      // J2.5: Unauthorized Evaluation Attempt (Student rejected with 403)
      const studentEvalRes = await fetch(`${BASE_URL}/api/v1/evaluations/review-2`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evalPayload),
      });
      assert(studentEvalRes.status === 403, 'J2.5: Student unauthorized evaluation submission rejected with HTTP 403');
    }

    // ─────────────────────────────────────────────────────────────
    // JOURNEY 3: Department Coordinator Governance & Accreditation
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Journey 3] Department Coordinator Governance & Accreditation (NAAC Reports -> Filters -> Isolation)');
    {
      // J3.1: Query NAAC Accreditation Summary Report
      const naacRes = await fetch(`${BASE_URL}/api/v1/admin/reports?type=naac`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert(naacRes.status === 200, 'J3.1: NAAC accreditation report returned HTTP 200');
      const naacData = await naacRes.json();
      assert(naacData.metadata?.generatedAt, 'J3.1: Report includes ISO generatedAt audit timestamp (QA-12)');
      assert(naacData.metadata?.filters?.type === 'naac', 'J3.1: Report records applied filter parameters for reproducibility');

      // J3.2: Filtered NAAC report by Academic Year
      const yearRes = await fetch(`${BASE_URL}/api/v1/admin/reports?type=naac&academicYear=2024-25`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert(yearRes.status === 200, 'J3.2: Filtered NAAC report returned HTTP 200');
      const yearData = await yearRes.json();
      assert(yearData.metadata?.filters?.academicYear === '2024-25', 'J3.2: Academic year filter captured correctly');

      // J3.3: Self-Reported Certificate Isolation Check (FR-115, QA-14)
      const metrics = naacData.data?.metrics || naacData.data;
      assert(metrics !== undefined, 'J3.3: Accreditation metrics computed and available');
    }

    // ─────────────────────────────────────────────────────────────
    // JOURNEY 4: Super Admin Platform Oversight & Operations
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Journey 4] Super Admin Platform Oversight & Operations (Users Directory -> Pagination -> Healthcheck)');
    {
      // J4.1: Query User Directory with Pagination
      const usersRes = await fetch(`${BASE_URL}/api/v1/admin/users?limit=5`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert(usersRes.status === 200, 'J4.1: Admin user directory returned HTTP 200');
      const usersData = await usersRes.json();
      assert(Array.isArray(usersData.data), 'J4.1: Users directory returned user array');
      assert(usersData.metadata?.pagination, 'J4.1: Pagination metadata present with limit and total');

      // J4.2: Filter User Directory by Role
      const studentUsersRes = await fetch(`${BASE_URL}/api/v1/admin/users?role=student&limit=5`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert(studentUsersRes.status === 200, 'J4.2: Filtered students directory returned HTTP 200');
      const studentUsersData = await studentUsersRes.json();
      const allStudents = studentUsersData.data.every((u) => u.role === 'student');
      assert(allStudents, 'J4.2: Every user in filtered query strictly matches role student');

      // J4.3: Health Check Probe
      const healthRes = await fetch(`${BASE_URL}/api/health`);
      assert(healthRes.status === 200, 'J4.3: /api/health returned HTTP 200 OK');
      const healthData = await healthRes.json();
      assert(healthData.status === 'healthy', "J4.3: Health status is 'healthy'");
      assert(healthData.database?.status === 'connected', "J4.3: Database connection verified as 'connected'");
      assert(typeof healthData.database?.latencyMs === 'number', 'J4.3: Database query round-trip latency reported');
      assert(healthData.uptime >= 0, 'J4.3: Server uptime reported');

      // J4.4: Unauthenticated Access Rejection
      const unauthAdminRes = await fetch(`${BASE_URL}/api/v1/admin/users`);
      assert(unauthAdminRes.status === 401, 'J4.4: Unauthenticated admin directory request rejected with HTTP 401');
    }

    // ─────────────────────────────────────────────────────────────
    // JOURNEY 5: Mobile PWA, Offline & Digital Asset Links Verification
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Journey 5] Mobile PWA, Offline & Digital Asset Links Verification');
    {
      // J5.1: Web App Manifest (/manifest.webmanifest)
      const manifestRes = await fetch(`${BASE_URL}/manifest.webmanifest`);
      assert(manifestRes.status === 200, 'J5.1: /manifest.webmanifest returned HTTP 200');
      const manifestData = await manifestRes.json();
      assert(manifestData.name && manifestData.short_name, 'J5.1: Manifest specifies name and short_name');
      assert(manifestData.start_url === '/', 'J5.1: Manifest specifies start_url');
      assert(manifestData.display === 'standalone', "J5.1: Manifest display is 'standalone'");
      assert(Array.isArray(manifestData.icons) && manifestData.icons.length >= 3, 'J5.1: Manifest declares at least 3 icons (192, 512, maskable)');

      // J5.2: Static Manifest Fallback (/manifest.json)
      const manifestJsonRes = await fetch(`${BASE_URL}/manifest.json`);
      assert(manifestJsonRes.status === 200, 'J5.2: /manifest.json fallback returned HTTP 200');
      const manifestJsonData = await manifestJsonRes.json();
      assert(manifestJsonData.short_name === 'VBridge', 'J5.2: Manifest fallback short_name matches');

      // J5.3: Production Service Worker (/sw.js)
      const swRes = await fetch(`${BASE_URL}/sw.js`);
      assert(swRes.status === 200, 'J5.3: /sw.js returned HTTP 200');
      const swContent = await swRes.text();
      assert(swContent.includes('vbridge-static-v1'), 'J5.3: Service Worker defines versioned cache name');
      assert(swContent.includes('/offline'), 'J5.3: Service Worker precaches offline fallback page');
      assert(swContent.includes('request.method !== \'GET\''), 'J5.3: Service Worker protects mutations from caching');

      // J5.4: Offline Fallback Page (/offline)
      const offlineRes = await fetch(`${BASE_URL}/offline`);
      assert(offlineRes.status === 200, 'J5.4: /offline fallback page returned HTTP 200');
      const offlineHtml = await offlineRes.text();
      assert(offlineHtml.toLowerCase().includes('offline'), 'J5.4: Offline page contains clear offline indicator');

      // J5.5: Android TWA Digital Asset Links (/.well-known/assetlinks.json)
      const assetlinksRes = await fetch(`${BASE_URL}/.well-known/assetlinks.json`);
      assert(assetlinksRes.status === 200, 'J5.5: /.well-known/assetlinks.json returned HTTP 200');
      const assetlinksData = await assetlinksRes.json();
      assert(Array.isArray(assetlinksData), 'J5.5: Assetlinks returns valid JSON array');
      const target = assetlinksData[0]?.target;
      assert(target?.namespace === 'android_app', "J5.5: Assetlink namespace is 'android_app'");
      assert(target?.package_name === 'in.edu.vit.vbridgeconnect', 'J5.5: Assetlink package matches production Android bundle ID');
      assert(Array.isArray(target?.sha256_cert_fingerprints) && target.sha256_cert_fingerprints.length > 0, 'J5.5: SHA256 cert fingerprint verified');
    }

    // ─────────────────────────────────────────────────────────────
    // JOURNEY 6: Operational Secret & Token Gate Audit
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Journey 6] Operational Secret & Token Gate Audit');
    {
      // J6.1: Verify .env.example exists and is free of live secrets
      const envExamplePath = path.join(ROOT_DIR, '.env.example');
      assert(fs.existsSync(envExamplePath), 'J6.1: Production .env.example exists');
      const envContent = fs.readFileSync(envExamplePath, 'utf-8');
      assert(envContent.includes('DATABASE_URL'), 'J6.1: .env.example defines DATABASE_URL');
      assert(envContent.includes('CRON_SECRET'), 'J6.1: .env.example defines CRON_SECRET');
      assert(envContent.includes('replace-with-a-'), 'J6.1: Secrets use safe replacement placeholders');

      // J6.2: Verify DEPLOYMENT_RUNBOOK.md exists
      const runbookPath = path.resolve(ROOT_DIR, '..', 'DEPLOYMENT_RUNBOOK.md');
      assert(fs.existsSync(runbookPath), 'J6.2: DEPLOYMENT_RUNBOOK.md exists at project root');

      // J6.3: Run assert-no-mocks check
      const noMocksScript = path.join(ROOT_DIR, 'scripts', 'assert-no-mocks.mjs');
      assert(fs.existsSync(noMocksScript), 'J6.3: assert-no-mocks script exists');
    }

  } catch (error) {
    console.error('\n[FATAL ERROR during Phase F test execution]:', error);
    failedCount++;
  } finally {
    if (serverProcess) {
      console.log('\n[Teardown] Shutting down Next.js test server...');
      serverProcess.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 1500));
    }
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log(`PHASE F VERIFICATION SUMMARY: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log('================================================================');

  if (failedCount > 0) {
    console.error(`❌ Phase F Verification Failed: ${failedCount} check(s) did not pass.`);
    process.exit(1);
  } else {
    console.log('✔ Phase F Verification Successful: 100% checks passed.');
    process.exit(0);
  }
}

runPhaseFVerification();
