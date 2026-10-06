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

/**
 * Get the current session or null (for optional auth).
 */
export async function getOptionalSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as SessionUser;
}
