// VBridgeConnect — Phase C Speed & Performance Verification Suite
// Validates requirements C1 through C4 against live database and production build.

import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runPhaseCTests() {
  console.log('================================================================');
  console.log('   VBRIDGECONNECT PHASE C SPEED & PERFORMANCE VALIDATION SUITE  ');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✖ FAIL: ${message}`);
      failedTests++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // C1: Region Verification (Mumbai ap-south-1 & bom1)
  // ─────────────────────────────────────────────────────────────
  console.log('[Test C1] Region Collocation & Network Latency');
  {
    const vercelJsonPath = path.resolve('vercel.json');
    assert(fs.existsSync(vercelJsonPath), 'vercel.json exists in root / next-app');
    if (fs.existsSync(vercelJsonPath)) {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
      assert(
        Array.isArray(vercelConfig.regions) && vercelConfig.regions.includes('bom1'),
        `Vercel function region configured for Mumbai (bom1): ${JSON.stringify(vercelConfig.regions)}`
      );
    }

    const dbUrl = process.env.DATABASE_URL || '';
    assert(
      dbUrl.includes('aws-0-ap-south-1.pooler.supabase.com'),
      'Supabase Database is hosted in AWS ap-south-1 (Mumbai)'
    );

    // Measure live DB roundtrip ping
    const pings = [];
    for (let i = 0; i < 5; i++) {
      const s = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      pings.push(performance.now() - s);
    }
    const avgPing = (pings.reduce((a, b) => a + b, 0) / pings.length).toFixed(2);
    console.log(`     Average live DB roundtrip latency: ${avgPing} ms`);
    assert(parseFloat(avgPing) > 0, `DB query responded successfully`);
  }

  // ─────────────────────────────────────────────────────────────
  // C2: Dynamic SSR & Suspense Streaming
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Test C2] Dynamic SSR & Suspense Streaming Skeletons');
  {
    const loadingRoutes = [
      'src/app/loading.tsx',
      'src/app/dashboard/loading.tsx',
      'src/app/mentor/dashboard/loading.tsx',
      'src/app/coordinator/dashboard/loading.tsx',
      'src/app/projects/[teamId]/loading.tsx',
    ];

    for (const r of loadingRoutes) {
      assert(fs.existsSync(path.resolve(r)), `Route streaming skeleton exists: ${r}`);
    }

    const dashPageCode = fs.readFileSync(path.resolve('src/app/dashboard/page.tsx'), 'utf-8');
    assert(
      dashPageCode.includes('Suspense') && dashPageCode.includes('DashboardSkeleton'),
      'DashboardPage uses React Suspense with bespoke DashboardSkeleton'
    );
    assert(
      !dashPageCode.includes("'use client'"),
      'DashboardPage is an async Server Component (no client-side render lag)'
    );

    const workspacePageCode = fs.readFileSync(path.resolve('src/app/projects/[teamId]/page.tsx'), 'utf-8');
    assert(
      workspacePageCode.includes('Suspense') && workspacePageCode.includes('WorkspaceSkeleton'),
      'ProjectWorkspacePage uses React Suspense with bespoke WorkspaceSkeleton'
    );
  }

  // ─────────────────────────────────────────────────────────────
  // C3: Realistic Dataset Seeding & Query Optimization
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Test C3] Realistic Institutional Scale & Query Benchmark');
  {
    const userCount = await prisma.user.count();
    const actCount = await prisma.activity.count();
    const teamCount = await prisma.team.count();
    const msCount = await prisma.milestone.count();
    const msgCount = await prisma.message.count();
    const auditCount = await prisma.auditEvent.count();
    const totalEvents = msgCount + auditCount;

    assert(userCount >= 200, `User count meets institutional scale (actual: ${userCount}, target >= 200)`);
    assert(actCount >= 40, `Activity count meets target (actual: ${actCount}, target >= 40)`);
    assert(teamCount >= 60, `Team count meets target (actual: ${teamCount}, target >= 60)`);
    assert(msCount >= 2000, `Milestone count meets target (actual: ${msCount}, target >= 2,000)`);
    assert(totalEvents >= 10000, `Activity events meet scale (actual: ${totalEvents}, target >= 10,000)`);

    // Benchmark PostgreSQL execution times
    const benchmarkQueries = [
      { name: 'Activities by Status Index Scan', sql: `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM activities WHERE status = 'active' LIMIT 10;` },
      { name: 'Milestones by Due Date', sql: `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM milestones WHERE status = 'not_started' ORDER BY "dueDate" ASC LIMIT 20;` },
      { name: 'Audit Events by Entity Type', sql: `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM audit_events WHERE "entityType" = 'submission' LIMIT 20;` },
    ];

    for (const bq of benchmarkQueries) {
      const plan = await prisma.$queryRawUnsafe(bq.sql);
      const planLines = plan.map((p) => Object.values(p)[0]);
      const execTimeLine = planLines.find((l) => l.includes('Execution Time:'));
      const execMs = parseFloat(execTimeLine.replace(/[^0-9.]/g, ''));
      assert(
        execMs <= 50,
        `Postgres query execution time for '${bq.name}': ${execMs} ms (Target <= 50 ms)`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // C4: Asset & Bundle Hygiene
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Test C4] Asset Hygiene, Native Fonts & Code Splitting');
  {
    function searchInDir(dir, pattern) {
      let matches = [];
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        const fullPath = path.join(dir, f.name);
        if (f.isDirectory()) {
          matches = matches.concat(searchInDir(fullPath, pattern));
        } else if (f.name.endsWith('.tsx') || f.name.endsWith('.ts')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (pattern.test(content)) {
            matches.push(fullPath);
          }
        }
      }
      return matches;
    }

    const rawImgMatches = searchInDir(path.resolve('src'), /<img\b/);
    assert(rawImgMatches.length === 0, `Zero raw <img> tags in src/ (actual: ${rawImgMatches.length})`);

    const dicebearMatches = searchInDir(path.resolve('src'), /api\.dicebear\.com/);
    assert(dicebearMatches.length === 0, `Zero external Dicebear avatar requests in src/ (actual: ${dicebearMatches.length})`);

    const layoutCode = fs.readFileSync(path.resolve('src/app/layout.tsx'), 'utf-8');
    assert(
      layoutCode.includes('next/font/google') &&
      layoutCode.includes('Inter') &&
      layoutCode.includes('Plus_Jakarta_Sans') &&
      layoutCode.includes('JetBrains_Mono'),
      'next/font/google configured for Inter, Plus_Jakarta_Sans, and JetBrains_Mono with zero layout shift'
    );

    const workspaceHubCode = fs.readFileSync(path.resolve('src/screens/workspace/WorkspaceHub.tsx'), 'utf-8');
    assert(
      workspaceHubCode.includes('dynamic(') &&
      workspaceHubCode.includes('LiveMeetingRoom') &&
      workspaceHubCode.includes('WorkspaceRepositoryTab') &&
      workspaceHubCode.includes('EvaluationFormReview2'),
      'Heavy modules dynamically imported with next/dynamic (LiveMeetingRoom, Repository, Review2)'
    );
  }

  console.log('\n================================================================');
  console.log(`TOTAL PHASE C CHECKS: ${passedTests + failedTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${failedTests}`);
  console.log('================================================================\n');

  await prisma.$disconnect();

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('✔ All Phase C Speed & Performance Standards VERIFIED successfully!');
    process.exit(0);
  }
}

runPhaseCTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
