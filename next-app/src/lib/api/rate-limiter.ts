// VBridgeConnect — Rate Limiter Utility
// Architecture.md §10: Rate limiting applied on API endpoints to prevent brute-force and DoS.

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale counters every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 2 * 60 * 1000);

export interface RateLimitOptions {
  limit?: number; // max requests per window (default: 60)
  windowMs?: number; // window size in ms (default: 60,000 = 1 minute)
}

/**
 * Checks rate limit for the given request.
 * Returns null if within limit, or a 429 NextResponse if rate limit is exceeded.
 */
export function checkRateLimit(
  request: NextRequest,
  identifier?: string,
  options: RateLimitOptions = {}
): NextResponse | null {
  const limit = options.limit ?? 60;
  const windowMs = options.windowMs ?? 60 * 1000;

  // Determine client identifier: explicit identifier, auth token, or IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const key = `rl:${identifier || ip}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }

  if (record.count >= limit) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetAt / 1000)),
        },
      }
    );
  }

  record.count += 1;
  return null;
}
