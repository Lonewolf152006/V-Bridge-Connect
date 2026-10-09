// VBridgeConnect — Session Helpers
// Convenience wrappers around NextAuth's auth() for use in Server Components
// and Server Actions.

import { auth } from './auth';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import type { UserRole } from '@prisma/client';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string | null;
  institutionalId?: string | null;
  avatarUrl?: string | null;
};

/**
 * Get the current session user, or throw UnauthorizedError.
 * Use in Server Components and Server Actions.
 */
export async function getRequiredSession(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError('You must be signed in to access this resource');
  }
  return session.user as SessionUser;
}

/**
 * Get the current session user and assert they have one of the allowed roles.
 * Throws ForbiddenError if the role doesn't match.
 */
export async function getRequiredSessionWithRole(
  ...allowedRoles: UserRole[]
): Promise<SessionUser> {
  const user = await getRequiredSession();
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(
      `Role "${user.role}" is not authorized. Required: ${allowedRoles.join(', ')}`
    );
  }
  return user;
}

import { cookies } from 'next/headers';

/**
 * Get the current session or null (for optional auth).
 */
export async function getOptionalSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (session?.user?.id) return session.user as SessionUser;

  // Fallback: check demo user cookie
  try {
    const cookieStore = await cookies();
    const demoCookie = cookieStore.get('vbridge_demo_user');
    if (demoCookie?.value) {
      const parsed = JSON.parse(decodeURIComponent(demoCookie.value));
      const cleanEmail = (parsed.email || 'student@vit.edu.in').toLowerCase();
      const parts = cleanEmail.split('@');
      const cleanName = (parts[0] || 'User')
        .split('.')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return {
        id: `user-${parts[0].replace(/[^a-zA-Z0-9]/g, '-')}`,
        email: cleanEmail,
        name: cleanName,
        role: (parsed.role || 'student').toLowerCase() as UserRole,
        departmentId: null,
        institutionalId: 'INST-2026',
        avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
      };
    }
  } catch {}

  return null;
}
