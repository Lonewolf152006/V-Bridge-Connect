// VBridgeConnect — Scheduled Background Job Authentication
// Validates CRON_SECRET bearer token for Vercel Cron or external schedulers.
// Architecture.md §10: Secured background endpoints.

import { NextRequest, NextResponse } from 'next/server';

export function validateCronSecret(request: NextRequest): NextResponse | null {
  const configuredSecret = process.env.CRON_SECRET;
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!configuredSecret || !token || token !== configuredSecret) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing cron authorization secret.',
          details: [],
          requestId,
        },
      },
      {
        status: 401,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      }
    );
  }

  return null;
}
