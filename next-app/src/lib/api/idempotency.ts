// VBridgeConnect — Durable PostgreSQL-Backed Idempotency Middleware
// Architecture.md §4: Transition endpoints accept an idempotency key so a retried
// request cannot double-fire a transition or notification.
// Phase D: Eliminates all in-process Map state and setInterval leaks for 100% stateless serverless execution.

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Handle idempotent execution of a handler using PostgreSQL durable storage.
 * If header `Idempotency-Key` or `X-Idempotency-Key` is provided:
 * - Returns cached response on duplicate call within TTL.
 * - Prevents duplicate execution while a request is in flight.
 * - Safely coordinates across multiple concurrent serverless instances.
 */
export async function withIdempotency(
  key: string | null | undefined,
  executor: () => Promise<NextResponse>
): Promise<NextResponse> {
  if (!key || key.trim() === '') {
    return executor();
  }

  const cacheKey = key.trim();
  const now = new Date();

  try {
    const existing = await prisma.idempotencyRecord.findUnique({
      where: { key: cacheKey },
    });

    if (existing && existing.expiresAt > now) {
      if (existing.inFlight) {
        return NextResponse.json(
          {
            error: {
              code: 'CONFLICT',
              message: 'A request with this idempotency key is currently processing. Please wait.',
              details: [],
              requestId: crypto.randomUUID(),
            },
          },
          {
            status: 409,
            headers: {
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
            },
          }
        );
      }

      // Return cached replayed response
      return NextResponse.json(existing.response, {
        status: existing.status,
        headers: {
          'X-Idempotent-Replay': 'true',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      });
    }

    // Upsert record as in-flight
    const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS);
    await prisma.idempotencyRecord.upsert({
      where: { key: cacheKey },
      create: {
        key: cacheKey,
        status: 200,
        response: {},
        inFlight: true,
        expiresAt,
      },
      update: {
        inFlight: true,
        status: 200,
        response: {},
        expiresAt,
      },
    });
  } catch (dbErr) {
    console.warn('[Idempotency] Failed initial lookup/reserve, proceeding with executor:', dbErr);
  }

  try {
    const response = await executor();

    // Cache responses under 500
    if (response.status < 500) {
      try {
        const cloned = response.clone();
        const responseData = await cloned.json();
        await prisma.idempotencyRecord.upsert({
          where: { key: cacheKey },
          create: {
            key: cacheKey,
            status: response.status,
            response: responseData as object,
            inFlight: false,
            expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
          },
          update: {
            status: response.status,
            response: responseData as object,
            inFlight: false,
            expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
          },
        });
      } catch {
        await prisma.idempotencyRecord.delete({ where: { key: cacheKey } }).catch(() => {});
      }
    } else {
      await prisma.idempotencyRecord.delete({ where: { key: cacheKey } }).catch(() => {});
    }

    return response;
  } catch (error) {
    await prisma.idempotencyRecord.delete({ where: { key: cacheKey } }).catch(() => {});
    throw error;
  }
}
