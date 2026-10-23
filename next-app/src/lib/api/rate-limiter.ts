// VBridgeConnect — Durable PostgreSQL-Backed Rate Limiter Utility
// Architecture.md §10: Rate limiting applied on API endpoints to prevent brute-force and DoS.
// Phase D: Eliminates all in-process Map state and setInterval leaks for 100% stateless serverless execution.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export interface RateLimitOptions {
  limit?: number; // max requests per window (default: 60)
  windowMs?: number; // window size in ms (default: 60,000 = 1 minute)
}

/**
 * Checks rate limit for the given request using atomic PostgreSQL storage.
 * Works seamlessly across multi-region and serverless lambdas.
 * Returns null if within limit, or a 429 NextResponse if rate limit is exceeded.
 */
export async function checkRateLimit(
  request: NextRequest,
  identifier?: string,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const limit = options.limit ?? 60;
  const windowMs = options.windowMs ?? 60 * 1000;

  // Determine client identifier: explicit identifier, auth token, or IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const key = `rl:${identifier || ip}`;
  const resetAt = new Date(Date.now() + windowMs);

  try {
    const rows = await prisma.$queryRaw<Array<{ count: number; reset_at: Date }>>`
      INSERT INTO rate_limit_records (key, count, reset_at, created_at, updated_at)
      VALUES (${key}, 1, ${resetAt}, NOW(), NOW())
      ON CONFLICT (key) DO UPDATE
      SET 
        count = CASE 
          WHEN rate_limit_records.reset_at <= NOW() THEN 1 
          ELSE rate_limit_records.count + 1 
        END,
        reset_at = CASE 
          WHEN rate_limit_records.reset_at <= NOW() THEN ${resetAt}
          ELSE rate_limit_records.reset_at 
        END,
        updated_at = NOW()
      RETURNING count, reset_at;
    `;

    const record = rows[0];
    if (!record) return null;

    if (record.count > limit) {
      const resetTime = new Date(record.reset_at).getTime();
      const retryAfterSec = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));

      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Rate limit exceeded. Please back off before retrying.',
            details: [{ message: `Retry after ${retryAfterSec} seconds` }],
            requestId: crypto.randomUUID(),
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
    }

    return null;
  } catch (error) {
    console.warn('[RateLimiter] Database counter error, failing open:', error);
    return null;
  }
}
