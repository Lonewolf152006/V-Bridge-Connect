// VBridgeConnect — Prisma Client Singleton & Connection Pool Manager
// Prevents multiple Prisma Client instances across warm serverless invocations (Vercel)
// and development hot-reloads, protecting Supabase PgBouncer/Supavisor limits.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Guarantee global client reuse across warm serverless invocations and dev reloads
globalForPrisma.prisma = prisma;

/**
 * Health check to verify pooled database connectivity and latency.
 */
export async function checkDatabasePoolHealth(): Promise<{
  ok: boolean;
  latencyMs: number;
  serverTime: string;
  isPooled: boolean;
}> {
  const start = performance.now();
  const result = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now`;
  const latencyMs = Number((performance.now() - start).toFixed(2));
  const isPooled = (process.env.DATABASE_URL || '').includes(':6543');

  return {
    ok: true,
    latencyMs,
    serverTime: result[0]?.now?.toISOString() || new Date().toISOString(),
    isPooled,
  };
}

export default prisma;
