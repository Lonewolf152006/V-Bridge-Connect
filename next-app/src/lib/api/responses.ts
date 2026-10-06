// VBridgeConnect — API Response Helpers
// Consistent response shape for all API routes.

import { NextResponse } from 'next/server';
import { AuthError } from '@/lib/auth/jwt';
import { registerAllSubscribers } from '@/lib/events/register';

// Ensure event subscribers are registered on first API call
registerAllSubscribers();

export function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json(
    { success: true, data, generatedAt: new Date().toISOString() },
    { status }
  );
}

export function listResponse(
  data: unknown[],
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    limit,
    generatedAt: new Date().toISOString(),
  });
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Standard error handler for API routes.
 * Maps known error types to appropriate HTTP status codes.
 */
export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return errorResponse(error.message, error.statusCode);
  }

  // State machine transition errors → 409 Conflict
  if (
    error instanceof Error &&
    (error.name === 'ActivityTransitionError' ||
      error.name === 'MilestoneTransitionError' ||
      error.name === 'SubmissionTransitionError' ||
      error.name === 'ApplicationTransitionError' ||
      error.name === 'CertificateTransitionError')
  ) {
    return NextResponse.json(
      {
        success: false,
        error: 'invalid_transition',
        message: error.message,
      },
      { status: 409 }
    );
  }

  console.error('[API Error]', error);
  return errorResponse(
    error instanceof Error ? error.message : 'Internal server error',
    500
  );
}
