// VBridgeConnect — Idempotency Key Middleware Utility
// Architecture.md §4: Transition endpoints accept an idempotency key so a retried
// request cannot double-fire a transition or notification.

import { NextResponse } from 'next/server';

interface CachedResponse {
  status: number;
  data: unknown;
  timestamp: number;
  inFlight?: boolean;
}

const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000; // 5 minutes
const idempotencyStore = new Map<string, CachedResponse>();

// Periodic cleanup of stale keys
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (now - record.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 1000);

/**
 * Handle idempotent execution of a handler.
 * If header `Idempotency-Key` or `X-Idempotency-Key` is provided:
 * - Returns cached response on duplicate call within TTL.
 * - Prevents duplicate execution while a request is in flight.
 */
export async function withIdempotency(
  key: string | null | undefined,
  executor: () => Promise<NextResponse>
): Promise<NextResponse> {
  if (!key || key.trim() === '') {
    return executor();
  }

  const cacheKey = `idemp:${key.trim()}`;
  const existing = idempotencyStore.get(cacheKey);

  if (existing) {
    if (existing.inFlight) {
      return NextResponse.json(
        {
          success: false,
          error: 'A request with this idempotency key is currently processing. Please wait.',
        },
        { status: 409 }
      );
    }

    // Return cached response
    return NextResponse.json(existing.data, {
      status: existing.status,
      headers: {
        'X-Idempotent-Replay': 'true',
      },
    });
  }

  // Mark as in-flight
  idempotencyStore.set(cacheKey, {
    status: 200,
    data: null,
    timestamp: Date.now(),
    inFlight: true,
  });

  try {
    const response = await executor();
    
    // Only cache successful or client error responses (don't cache 5xx)
    if (response.status < 500) {
      try {
        const cloned = response.clone();
        const responseData = await cloned.json();
        idempotencyStore.set(cacheKey, {
          status: response.status,
          data: responseData,
          timestamp: Date.now(),
          inFlight: false,
        });
      } catch {
        idempotencyStore.delete(cacheKey);
      }
    } else {
      idempotencyStore.delete(cacheKey);
    }

    return response;
  } catch (error) {
    idempotencyStore.delete(cacheKey);
    throw error;
  }
}
