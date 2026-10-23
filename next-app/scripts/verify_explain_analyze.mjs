import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runExplainAnalyze() {
  console.log('================================================================');
  console.log('   POSTGRESQL EXPLAIN (ANALYZE, BUFFERS) QUERY PERFORMANCE AUDIT');
  console.log('================================================================\n');

  const queries = [
    {
      name: 'Teams by Activity & Risk Status',
      sql: `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM teams WHERE "riskStatus" = 'on_track' LIMIT 20;`,
    },
    {
      name: 'Activities by Department & Status',
      sql: `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM activities WHERE status = 'active' LIMIT 20;`,
    },
    {
      name: 'Milestones by Status & Due Date',
      sql: `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM milestones WHERE status = 'not_started' ORDER BY "dueDate" ASC LIMIT 20;`,
    },
    {
      name: 'Messages by Conversation & CreatedAt',
      sql: `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM messages ORDER BY "createdAt" DESC LIMIT 50;`,
    },
    {
      name: 'Team Memberships Active by User',
      sql: `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM team_memberships WHERE "removedAt" IS NULL LIMIT 20;`,
    },
    {
      name: 'Audit Events by Entity & Timestamp',
      sql: `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM audit_events WHERE "entityType" = 'submission' LIMIT 20;`,
    },
  ];

  for (const q of queries) {
    console.log(`▶ Query: ${q.name}`);
    try {
      const start = performance.now();
      const plan = await prisma.$queryRawUnsafe(q.sql);
      const totalTime = (performance.now() - start).toFixed(2);
      
      const planLines = plan.map((p) => Object.values(p)[0]);
      const execTimeLine = planLines.find((l) => l.includes('Execution Time:'));
      const planningTimeLine = planLines.find((l) => l.includes('Planning Time:'));

      console.log(`  Plan:\n    ${planLines.slice(0, 3).join('\n    ')}`);
      if (planningTimeLine) console.log(`  ${planningTimeLine}`);
      if (execTimeLine) console.log(`  ${execTimeLine}`);
      console.log(`  Client-Observed Roundtrip: ${totalTime} ms\n`);
    } catch (err) {
      console.error(`  Error running explain: ${err.message}\n`);
    }
  }

  await prisma.$disconnect();
}

runExplainAnalyze().catch(console.error);
