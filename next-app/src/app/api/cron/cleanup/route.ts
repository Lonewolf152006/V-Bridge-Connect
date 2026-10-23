// POST/GET /api/cron/cleanup — Prunes expired idempotency and rate limit database rows
// Architecture: Maintenance and hygiene for stateless storage tables
// Secured by CRON_SECRET bearer token. Fully idempotent.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { validateCronSecret } from '@/lib/api/cron-auth';

export async function GET(request: NextRequest) {
  return handleCleanup(request);
}

export async function POST(request: NextRequest) {
  return handleCleanup(request);
}

async function handleCleanup(request: NextRequest): Promise<NextResponse> {
  const authError = validateCronSecret(request);
  if (authError) return authError;

  const now = new Date();
  const startTime = performance.now();
  const rateLimitRetentionLimit = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

  try {
    // 1. Delete expired idempotency records
    const idempotencyDeleteResult = await prisma.idempotencyRecord.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    // 2. Delete expired rate limit records older than retention limit
    const rateLimitDeleteResult = await prisma.rateLimitRecord.deleteMany({
      where: { resetAt: { lt: rateLimitRetentionLimit } },
    });

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return NextResponse.json({
      success: true,
      job: 'cleanup',
      deletedIdempotencyRecords: idempotencyDeleteResult.count,
      deletedRateLimitRecords: rateLimitDeleteResult.count,
      timestamp: now.toISOString(),
      durationMs,
    });
  } catch (error: any) {
    console.error('[Cron:Cleanup] Execution error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to complete cleanup cron sweep.',
          details: [{ message: error.message || 'Unknown database error' }],
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}
