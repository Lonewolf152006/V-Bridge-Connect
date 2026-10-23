import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function bench() {
  console.log('Testing connection to Supabase ap-south-1 (Mumbai)...');
  const times = [];
  // warmup
  await prisma.$queryRaw`SELECT 1`;
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const elapsed = performance.now() - start;
    times.push(elapsed);
  }
  times.sort((a, b) => a - b);
  const min = times[0].toFixed(2);
  const max = times[times.length - 1].toFixed(2);
  const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
  const p95 = times[Math.floor(times.length * 0.95)].toFixed(2);

  console.log(`\n--- Supabase Mumbai Latency Benchmark (10 samples) ---`);
  console.log(`Min: ${min} ms`);
  console.log(`Max: ${max} ms`);
  console.log(`Avg: ${avg} ms`);
  console.log(`p95: ${p95} ms`);
  console.log(`Target: DB query p95 <= 50ms (or local to cloud roundtrip)`);
  await prisma.$disconnect();
}

bench().catch((err) => {
  console.error(err);
  process.exit(1);
});
