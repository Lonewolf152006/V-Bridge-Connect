import { NextResponse } from 'next/server';
import { MOCK_USERS } from '@/services/mockData';
import type { UserRole } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role: UserRole = body.role || 'STUDENT';
    const user = MOCK_USERS[role] || MOCK_USERS['STUDENT'];

    return NextResponse.json({
      success: true,
      user,
      token: `jwt_simulated_${role.toLowerCase()}_${Date.now()}`,
      issuedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid authentication request' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    authEndpoints: ['/api/auth (POST)'],
    availableRoles: Object.keys(MOCK_USERS),
  });
}
