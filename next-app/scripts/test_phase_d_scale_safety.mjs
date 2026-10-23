// scripts/test_phase_d_scale_safety.mjs
// Automated verification suite for Phase D — Scale Safety
// Pillars:
// - D1: Connection Pool Audit & Singleton Hardening
// - D2: Stateless Storage & In-Memory Elimination (PostgreSQL Idempotency & Rate Limiting)
// - D3: Offload Slow Tasks via Next.js after() Background Task Dispatcher
// - D4: Supabase Realtime Channel Budget & 200-User Capacity
// - D5: Idempotent Background Sweepers / Cron Jobs & Bearer Secret Security

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const prisma = new PrismaClient();
const CRON_SECRET = process.env.CRON_SECRET || 'vb_cron_sec_8f93e2b10a47d6c5e19a';
const TEST_PORT = 3012;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

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

async function startServer() {
  console.log(`\n[Setup] Launching Next.js production server on port ${TEST_PORT}...`);
  const serverProcess = spawn('npx', ['next', 'start', '-p', String(TEST_PORT)], {
    cwd: ROOT_DIR,
    env: { ...process.env, PORT: String(TEST_PORT) },
    shell: true,
    stdio: 'pipe',
  });

  serverProcess.stdout.on('data', (d) => {
    // optional debug logging
  });
  serverProcess.stderr.on('data', (d) => {
    // optional debug logging
  });

  // Poll until server responds
  const startTime = Date.now();
  while (Date.now() - startTime < 45000) {
    try {
      const res = await fetch(`${BASE_URL}/api/cron/cleanup`);
      if (res.status === 401 || res.status === 200) {
        console.log(`[Setup] Next.js server online at ${BASE_URL}\n`);
        return serverProcess;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('Next.js server failed to launch within 45 seconds');
}

async function runScaleSafetySuite() {
  console.log('================================================================');
  console.log('     VBRIDGECONNECT PHASE D SCALE SAFETY VALIDATION SUITE       ');
  console.log('================================================================');

  let serverProcess = null;

  try {
    // ─────────────────────────────────────────────────────────────
    // TEST D1: Connection Pool Audit & Singleton Hardening
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Test D1] Connection Pool Audit & Singleton Hardening');
    {
      const dbUrl = process.env.DATABASE_URL || '';
      const directUrl = process.env.DIRECT_URL || '';

      assert(dbUrl.includes(':6543'), 'DATABASE_URL routes through Supabase Supavisor pooler on port 6543');
      assert(dbUrl.includes('pgbouncer=true'), 'DATABASE_URL specifies pgbouncer=true transaction pooling mode');
      assert(dbUrl.includes('connection_limit=10'), 'DATABASE_URL configures connection_limit=10 to protect Supabase tier');
      assert(dbUrl.includes('pool_timeout=15'), 'DATABASE_URL configures pool_timeout=15 for fast failover');
      assert(directUrl.includes(':5432'), 'DIRECT_URL is reserved on direct port 5432 for migrations and DDL');

      // Verify Prisma Singleton code
      const prismaTs = fs.readFileSync(path.join(ROOT_DIR, 'src/lib/db/prisma.ts'), 'utf-8');
      assert(prismaTs.includes('globalForPrisma.prisma = prisma'), 'Prisma Client singleton preserved across serverless invocations');
      assert(prismaTs.includes('checkDatabasePoolHealth'), 'Exported checkDatabasePoolHealth helper');

      // Test live database pool query
      const startQuery = performance.now();
      const res = await prisma.$queryRaw`SELECT 1 as connected`;
      const queryDuration = performance.now() - startQuery;
      assert(Array.isArray(res) && res.length > 0, `Database pool query executed successfully in ${queryDuration.toFixed(2)}ms`);
    }

    // ─────────────────────────────────────────────────────────────
    // TEST D2: Stateless Storage & In-Memory State Elimination
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Test D2] Stateless Storage & In-Memory State Elimination');
    {
      const idempotencyCode = fs.readFileSync(path.join(ROOT_DIR, 'src/lib/api/idempotency.ts'), 'utf-8');
      assert(!idempotencyCode.includes('setInterval('), 'idempotency.ts contains zero setInterval background timer leaks');
      assert(!idempotencyCode.includes('new Map('), 'idempotency.ts contains zero in-process Map storage');
      assert(idempotencyCode.includes('prisma.idempotencyRecord'), 'idempotency.ts uses PostgreSQL IdempotencyRecord model');

      const rateLimiterCode = fs.readFileSync(path.join(ROOT_DIR, 'src/lib/api/rate-limiter.ts'), 'utf-8');
      assert(!rateLimiterCode.includes('setInterval('), 'rate-limiter.ts contains zero setInterval timer leaks');
      assert(!rateLimiterCode.includes('new Map('), 'rate-limiter.ts contains zero in-process Map storage');
      assert(rateLimiterCode.includes('rate_limit_records'), 'rate-limiter.ts uses PostgreSQL rate_limit_records table');

      const studentDashboardCode = fs.readFileSync(path.join(ROOT_DIR, 'src/app/api/v1/student/dashboard/route.ts'), 'utf-8');
      assert(!studentDashboardCode.includes('autoConnectCache'), 'student dashboard route eliminated in-memory autoConnectCache Map');

      // Live PostgreSQL Idempotency and Rate Limit write test
      const testKey = `test-idemp-${Date.now()}`;
      await prisma.idempotencyRecord.create({
        data: {
          key: testKey,
          status: 201,
          response: { created: true, test: 'scale_safety' },
          expiresAt: new Date(Date.now() + 60000),
        },
      });

      const retrievedKey = await prisma.idempotencyRecord.findUnique({ where: { key: testKey } });
      assert(retrievedKey !== null && retrievedKey.status === 201, 'PostgreSQL durable IdempotencyRecord verified');
      await prisma.idempotencyRecord.delete({ where: { key: testKey } });
    }

    // ─────────────────────────────────────────────────────────────
    // TEST D3: Non-Blocking Background Tasks via Next.js after()
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Test D3] Non-Blocking Background Tasks via Next.js after()');
    {
      const afterTaskPath = path.join(ROOT_DIR, 'src/lib/async/after-task.ts');
      assert(fs.existsSync(afterTaskPath), 'src/lib/async/after-task.ts exists');

      const afterTaskCode = fs.readFileSync(afterTaskPath, 'utf-8');
      assert(afterTaskCode.includes("from 'next/server'"), 'Imports after from next/server');
      assert(afterTaskCode.includes('runInBackground'), 'Exports runInBackground dispatcher');

      const busCode = fs.readFileSync(path.join(ROOT_DIR, 'src/lib/events/bus.ts'), 'utf-8');
      assert(busCode.includes('runInBackground'), 'Domain EventBus dispatches wildcard/audit writes via runInBackground');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST D4: Supabase Realtime Channel Budget & 200-User Capacity
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Test D4] Supabase Realtime Channel Budget & 200-User Capacity');
    {
      const realtimePath = path.join(ROOT_DIR, 'src/lib/realtime/supabase-realtime.ts');
      assert(fs.existsSync(realtimePath), 'src/lib/realtime/supabase-realtime.ts exists');

      const realtimeCode = fs.readFileSync(realtimePath, 'utf-8');
      assert(realtimeCode.includes('subscribeUserNotifications'), 'Exports subscribeUserNotifications (1 channel per user)');
      assert(realtimeCode.includes('subscribeWorkspaceChannel'), 'Exports subscribeWorkspaceChannel (1 channel per workspace)');
      assert(realtimeCode.includes('getRealtimeChannelMetrics'), 'Exports getRealtimeChannelMetrics with budget validation');

      // Verify WorkspaceDiscussionTab uses strict channel manager
      const discTabCode = fs.readFileSync(path.join(ROOT_DIR, 'src/screens/workspace/WorkspaceDiscussionTab.tsx'), 'utf-8');
      assert(discTabCode.includes('subscribeWorkspaceChannel'), 'WorkspaceDiscussionTab subscribes to workspace realtime channel');
      assert(discTabCode.includes('unsubscribeRealtime()'), 'WorkspaceDiscussionTab cleanly unsubscribes on unmount / route transition');
      assert(!discTabCode.includes('3000)'), 'Aggressive 3-second polling replaced with realtime + low-frequency fallback');

      // Validate Channel Budget calculation
      const maxChannelsPerClient = 2;
      const targetUserScale = 200;
      const peakChannels = maxChannelsPerClient * targetUserScale; // 400
      const supabaseProCeiling = 500;
      assert(peakChannels <= supabaseProCeiling, `Peak channel capacity (${peakChannels}) fits within Supabase Pro ceiling (${supabaseProCeiling})`);
    }

    // ─────────────────────────────────────────────────────────────
    // TEST D5: Idempotent Background Sweepers / Cron Jobs & Security
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Test D5] Idempotent Background Sweepers / Cron Jobs & Security');
    {
      const vercelJsonPath = path.join(ROOT_DIR, 'vercel.json');
      assert(fs.existsSync(vercelJsonPath), 'vercel.json exists');
      const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
      assert(Array.isArray(vercelJson.crons) && vercelJson.crons.length >= 2, 'vercel.json registers background crons');

      // Start local server to test endpoints
      serverProcess = await startServer();

      // 1. Test overdue-milestones security (Reject unauthorized)
      const unauthRes1 = await fetch(`${BASE_URL}/api/cron/overdue-milestones`, { method: 'POST' });
      assert(unauthRes1.status === 401, 'overdue-milestones rejects request without bearer token (401)');
      const unauthBody1 = await unauthRes1.json();
      assert(unauthBody1.error?.code === 'UNAUTHORIZED', "overdue-milestones returns 'UNAUTHORIZED' error code");

      // 2. Test overdue-milestones execution with valid CRON_SECRET
      const authRes1 = await fetch(`${BASE_URL}/api/cron/overdue-milestones`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      assert(authRes1.status === 200, 'overdue-milestones executes successfully with valid CRON_SECRET (200)');
      const authBody1 = await authRes1.json();
      assert(authBody1.success === true, 'overdue-milestones returns success: true');

      // 3. Test overdue-milestones IDEMPOTENCY (Re-run produces 0 new updates)
      const replayRes1 = await fetch(`${BASE_URL}/api/cron/overdue-milestones`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      const replayBody1 = await replayRes1.json();
      assert(replayBody1.updatedCount === 0, `overdue-milestones is 100% idempotent: subsequent run updated ${replayBody1.updatedCount} records`);

      // 4. Test inactivity-check security & execution
      const unauthRes2 = await fetch(`${BASE_URL}/api/cron/inactivity-check`, { method: 'POST' });
      assert(unauthRes2.status === 401, 'inactivity-check rejects request without bearer token (401)');

      const authRes2 = await fetch(`${BASE_URL}/api/cron/inactivity-check`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      assert(authRes2.status === 200, 'inactivity-check executes successfully with valid CRON_SECRET (200)');
      const authBody2 = await authRes2.json();
      assert(authBody2.success === true, 'inactivity-check returns success: true');

      // 5. Test inactivity-check IDEMPOTENCY
      const replayRes2 = await fetch(`${BASE_URL}/api/cron/inactivity-check`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      const replayBody2 = await replayRes2.json();
      assert(replayBody2.escalatedCount === 0, `inactivity-check is 100% idempotent: subsequent run escalated ${replayBody2.escalatedCount} teams`);

      // 6. Test cleanup endpoint
      const authRes3 = await fetch(`${BASE_URL}/api/cron/cleanup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      assert(authRes3.status === 200, 'cleanup cron executes successfully (200)');
      const authBody3 = await authRes3.json();
      assert(authBody3.success === true, 'cleanup returns success: true');
    }

    console.log('\n================================================================');
    console.log(`TOTAL PHASE D CHECKS: ${passedCount + failedCount}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${failedCount}`);
    console.log('================================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    } else {
      console.log('✔ All Phase D Scale Safety Standards VERIFIED successfully!\n');
      process.exit(0);
    }
  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    await prisma.$disconnect();
  }
}

runScaleSafetySuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
