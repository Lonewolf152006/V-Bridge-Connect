// POST /api/v1/mentor/join-code
// Enables Industry Mentors to enter a Faculty Invite Code and immediately join all
// student teams mentored by that faculty member.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';
import { rosterService } from '@/lib/modules/roster/roster.service';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(
      request,
      'industry_partner',
      'coordinator',
      'super_admin'
    );

    const body = await request.json();
    const code = body.code || body.facultyCode;

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'A valid faculty invite code is required.' },
        { status: 400 }
      );
    }

    const result = await rosterService.joinCohortWithFacultyCode(
      user.userId,
      code.trim()
    );

    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${result.teamsJoined.length} project teams guided by ${result.facultyName}.`,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to join cohort with code.' },
      { status: 400 }
    );
  }
}
