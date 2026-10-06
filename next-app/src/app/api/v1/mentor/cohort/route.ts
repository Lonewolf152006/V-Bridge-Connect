// GET /api/v1/mentor/cohort
// Retrieves the faculty guide's unique invite code and their assigned teams with roster claim progress.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';
import { rosterService } from '@/lib/modules/roster/roster.service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'coordinator', 'super_admin');
    const cohort = await rosterService.getFacultyCohortStatus(user.userId);

    return NextResponse.json({
      success: true,
      data: cohort,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve cohort status' },
      { status: 400 }
    );
  }
}
