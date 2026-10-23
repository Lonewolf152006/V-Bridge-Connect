// scripts/test_phase_e_security.mjs
// Automated verification suite for Phase E — Security & Compliance Hardening
// Pillars:
// - E1: Scope Boundaries & Industry Partner Privacy (QA-11, FR-092)
// - E2: Certificate Verification & Self-Reported Isolation (QA-14, FR-114, FR-115)
// - E3: Presigned S3 Upload Security & MIME Validation (QA-15, rules.md §6)
// - E4: Accreditation Reproducibility & Audit Trail (QA-12, FR-120)
// - E5: HTTP Security Headers & Secret Protection (rules.md §6, B7)

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
const TEST_PORT = 3015;
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

async function createToken(userId, role, email) {
  return new SignJWT({ userId, role, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
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
      const res = await fetch(`${BASE_URL}/api/activities`);
      if (res.status < 500) {
        console.log(`[Setup] Next.js server online at ${BASE_URL}\n`);
        return serverProcess;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('Next.js server failed to launch within 45 seconds');
}

async function runSecuritySuite() {
  console.log('================================================================');
  console.log('    VBRIDGECONNECT PHASE E SECURITY & COMPLIANCE VALIDATION     ');
  console.log('================================================================');

  let serverProcess = null;

  try {
    serverProcess = await startServer();

    const studentToken = await createToken('stu-sec-01', 'student', 'student.sec@vit.edu.in');
    const partnerToken = await createToken('part-sec-01', 'industry_partner', 'partner.sec@company.com');
    const coordToken = await createToken('coord-sec-01', 'coordinator', 'sheetal.patil@vit.edu.in');

    // ─────────────────────────────────────────────────────────────
    // TEST E1: Scope Boundaries & Industry Partner Privacy (QA-11)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Test E1] Scope Boundaries & Industry Partner Privacy (QA-11, FR-092)');
    {
      // 1. Unauthenticated request to evaluation grades must be rejected
      const unauthRes = await fetch(`${BASE_URL}/api/v1/evaluations/review-2`);
      assert(unauthRes.status === 401, 'Unauthenticated access to evaluation grades rejected with 401');

      // 2. Industry Partner request MUST be strictly denied (HTTP 403)
      const partnerRes = await fetch(`${BASE_URL}/api/v1/evaluations/review-2`, {
        headers: { Authorization: `Bearer ${partnerToken}` },
      });
      assert(partnerRes.status === 403, 'Industry Partner access to student evaluation grades rejected with 403');
      const partnerBody = await partnerRes.json();
      assert(partnerBody.error?.code === 'FORBIDDEN', "Error code is 'FORBIDDEN'");
      assert(
        partnerBody.error?.message.includes('Industry partners are strictly barred'),
        'Descriptive error message explains scope boundary protection'
      );

      // 3. Coordinator request allowed
      const coordRes = await fetch(`${BASE_URL}/api/v1/evaluations/review-2`, {
        headers: { Authorization: `Bearer ${coordToken}` },
      });
      assert(coordRes.status === 200, 'Coordinator authorized to access evaluation grades (200)');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST E2: Certificate Verification & Self-Reported Isolation (QA-14)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Test E2] Certificate Verification & Self-Reported Isolation (QA-14, FR-114, FR-115)');
    {
      // Seed a real platform-issued cert and a self-reported cert
      const student = await prisma.user.findFirst({ where: { role: 'student' } });
      const activity = await prisma.activity.findFirst();

      const platformHash = `plat_hash_${Date.now()}`;
      const selfReportedHash = `self_hash_${Date.now()}`;

      const platformCert = await prisma.certificate.create({
        data: {
          studentId: student.id,
          activityId: activity.id,
          activityTitle: activity.title,
          type: 'platform_issued',
          status: 'issued',
          verificationHash: platformHash,
          issueDate: new Date(),
        },
      });

      const selfReportedCert = await prisma.certificate.create({
        data: {
          studentId: student.id,
          activityTitle: 'External AWS Hackathon',
          type: 'self_reported',
          status: 'issued',
          verificationHash: selfReportedHash,
          issueDate: new Date(),
        },
      });

      // 1. Verify platform certificate via public registrar endpoint
      const platRes = await fetch(`${BASE_URL}/api/v1/certificates/verify/${platformHash}`);
      assert(platRes.status === 200, 'Platform-issued certificate verified successfully (200)');
      const platBody = await platRes.json();
      assert(platBody.data?.valid === true, 'Platform certificate returns valid: true');

      // 2. Attempt to verify self-reported certificate via registrar endpoint (MUST FAIL)
      const selfRes = await fetch(`${BASE_URL}/api/v1/certificates/verify/${selfReportedHash}`);
      assert(selfRes.status === 404, 'Self-reported external certificate rejected by registrar endpoint (404)');
      const selfBody = await selfRes.json();
      assert(selfBody.error?.code === 'NOT_FOUND', "Self-reported verification returns 'NOT_FOUND'");

      // Clean up test certs
      await prisma.certificate.deleteMany({
        where: { id: { in: [platformCert.id, selfReportedCert.id] } },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // TEST E3: Presigned S3 File Upload Security & MIME Validation
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Test E3] Presigned S3 File Upload Security & MIME Validation (QA-15, rules.md §6)');
    {
      // 1. Unauthenticated request to upload presigner rejected
      const unauthRes = await fetch(`${BASE_URL}/api/v1/uploads/certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: 'cert.pdf', contentType: 'application/pdf' }),
      });
      assert(unauthRes.status === 401, 'Upload presigner rejects unauthenticated request (401)');

      // 2. Reject executable / malicious MIME types
      const malMimeRes = await fetch(`${BASE_URL}/api/v1/uploads/certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ fileName: 'malware.exe', contentType: 'application/x-msdownload' }),
      });
      assert(malMimeRes.status === 400, 'Rejects dangerous executable MIME type (400)');

      // 3. Reject oversized file (>10MB)
      const oversizeRes = await fetch(`${BASE_URL}/api/v1/uploads/certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          fileName: 'massive.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 20 * 1024 * 1024,
        }),
      });
      assert(oversizeRes.status === 400, 'Rejects file exceeding 10MB limit (400)');

      // 4. Accept valid PDF certificate and generate scoped signed URL
      const validRes = await fetch(`${BASE_URL}/api/v1/uploads/certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          fileName: 'vit_certificate.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 1024 * 500, // 500KB
        }),
      });
      assert(validRes.status === 200, 'Generates presigned upload URL for valid certificate (200)');
      const validBody = await validRes.json();
      assert(typeof validBody.data?.uploadUrl === 'string', 'Returns presigned uploadUrl');
      assert(validBody.data?.expiresInSeconds === 900, 'Presigned URL expires in 15 minutes (900s)');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST E4: Accreditation Reproducibility & Audit Trail
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Test E4] Accreditation Reproducibility & Audit Trail (QA-12, FR-120)');
    {
      // 1. Unauthenticated call is denied with 401
      const unauthReport = await fetch(`${BASE_URL}/api/v1/admin/reports`);
      assert(unauthReport.status === 401, 'Reports endpoint denies unauthenticated access (401)');

      // 2. Coordinator authenticated call succeeds with 200
      const reportRes = await fetch(`${BASE_URL}/api/v1/admin/reports`, {
        headers: { Authorization: `Bearer ${coordToken}` },
      });
      assert(reportRes.status === 200, 'Coordinator authorized to access institutional reports (200)');
      const reportBody = await reportRes.json();

      assert(typeof reportBody.metadata?.generatedAt === 'string', 'Report includes generatedAt timestamp (QA-12)');
      assert(typeof reportBody.metadata?.filters === 'object', 'Report includes applied query filters (QA-12)');
      assert(Array.isArray(reportBody.auditLogs) && reportBody.auditLogs.length > 0, 'Report returns immutable audit trail');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST E5: HTTP Security Headers & Secret Protection
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Test E5] HTTP Security Headers & Secret Protection (rules.md §6, B7)');
    {
      const res = await fetch(`${BASE_URL}/api/activities`);
      assert(res.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is nosniff');
      assert(res.headers.get('x-frame-options') === 'DENY', 'X-Frame-Options is DENY');
      assert(res.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Referrer-Policy is strict');
      assert(res.headers.get('strict-transport-security') !== null, 'Strict-Transport-Security (HSTS) is enabled');

      // Verify no mock data in source code
      const mockDataExists = fs.existsSync(path.join(ROOT_DIR, 'src/services/mockData.ts'));
      assert(!mockDataExists, 'src/services/mockData.ts remains permanently deleted');
    }

    console.log('\n================================================================');
    console.log(`TOTAL PHASE E CHECKS: ${passedCount + failedCount}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${failedCount}`);
    console.log('================================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    } else {
      console.log('✔ All Phase E Security & Compliance Standards VERIFIED successfully!\n');
      process.exit(0);
    }
  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    await prisma.$disconnect();
  }
}

runSecuritySuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
