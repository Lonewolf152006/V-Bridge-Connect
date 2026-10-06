// DEPRECATED / DECOMMISSIONED (Finding C-1)
// Mock auth endpoint removed for security compliance.
// Production authentication uses NextAuth via /api/auth/[...nextauth].

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Mock auth endpoint has been decommissioned. Please authenticate via /api/auth/[...nextauth].',
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Mock auth endpoint has been decommissioned.',
    },
    { status: 410 }
  );
}

