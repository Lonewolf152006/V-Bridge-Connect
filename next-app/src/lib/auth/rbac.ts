// VBridgeConnect — RBAC (Role-Based Access Control)
// architecture.md §8 & rules.md §2: Server-side authorization on every request.
// Never trust a client-supplied role/scope claim.
//
// Roles: student, coordinator, industry_partner, super_admin
// (FACULTY_MENTOR and EXTERNAL_REVIEWER removed per project decision —
//  coordinator absorbs all mentor/review responsibilities)

import { type TokenPayload, AuthError } from './jwt';
import prisma from '@/lib/db/prisma';

export type Role = 'student' | 'coordinator' | 'industry_partner' | 'super_admin';

/**
 * Assert the user has one of the allowed roles.
 * Throws 403 if not.
 */
export function assertRole(user: TokenPayload, ...allowedRoles: Role[]): void {
  if (!allowedRoles.includes(user.role as Role)) {
    throw new AuthError(
      `Role "${user.role}" is not authorized for this action. Required: ${allowedRoles.join(', ')}`,
      403
    );
  }
}

/**
 * Assert the user has access to a specific activity's scope.
 * - super_admin: always allowed
 * - coordinator: must belong to the activity's department
 * - student: must have an active application/team membership for the activity
 * - industry_partner: must be explicitly shared on the activity
 *
 * rules.md §2: Never branch API behavior on a client-supplied role/scope claim
 * without re-checking it server-side.
 */
export async function assertActivityScope(
  user: TokenPayload,
  activityId: string
): Promise<void> {
  if (user.role === 'super_admin') return;

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { departmentId: true, ownerId: true },
  });

  if (!activity) {
    throw new AuthError('Activity not found', 404);
  }

  if (user.role === 'coordinator') {
    // Coordinator is scoped to their department
    if (user.departmentId && activity.departmentId === user.departmentId) return;
    throw new AuthError('Coordinator scope limited to own department', 403);
  }

  if (user.role === 'student') {
    // Student must have an application or team membership for this activity
    const hasAccess = await prisma.application.findFirst({
      where: {
        activityId,
        applicantId: user.userId,
        status: { in: ['submitted', 'under_review', 'shortlisted', 'selected'] },
      },
    });

    if (hasAccess) return;

    // Check team membership
    const teamMember = await prisma.teamMembership.findFirst({
      where: {
        userId: user.userId,
        removedAt: null,
        team: { activityId },
      },
    });

    if (teamMember) return;

    throw new AuthError('Student does not have access to this activity', 403);
  }

  if (user.role === 'industry_partner') {
    // FR-092: Partner access limited to explicitly shared workspace sections
    // For now, check if they're a participant in any conversation for this activity
    const hasSharedAccess = await prisma.conversationParticipant.findFirst({
      where: {
        userId: user.userId,
        removedAt: null,
        conversation: { activityId },
      },
    });

    if (hasSharedAccess) return;
    throw new AuthError('Industry partner does not have access to this activity', 403);
  }

  throw new AuthError('Unauthorized', 403);
}

/**
 * Assert the user has access to a specific team's scope.
 */
export async function assertTeamScope(
  user: TokenPayload,
  teamId: string
): Promise<void> {
  if (user.role === 'super_admin') return;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { activityId: true, activity: { select: { departmentId: true, ownerId: true } } },
  });

  if (!team) {
    throw new AuthError('Team not found', 404);
  }

  if (user.role === 'coordinator') {
    if (!user.departmentId || !team.activity.departmentId || team.activity.departmentId === user.departmentId || team.activity.ownerId === user.userId) return;
    throw new AuthError('Coordinator scope limited to own department', 403);
  }

  if (user.role === 'student') {
    const isMember = await prisma.teamMembership.findFirst({
      where: { teamId, userId: user.userId, removedAt: null },
    });
    if (isMember) return;
    throw new AuthError('Student is not a member of this team', 403);
  }

  if (user.role === 'industry_partner') {
    const hasSharedAccess = await prisma.conversationParticipant.findFirst({
      where: {
        userId: user.userId,
        removedAt: null,
        conversation: { teamId },
      },
    });
    if (hasSharedAccess) return;
    throw new AuthError('Industry partner does not have access to this team', 403);
  }

  throw new AuthError('Unauthorized', 403);
}

/**
 * Helper: extract user from request and assert role in one call.
 * Returns the verified user payload.
 */
export async function requireAuth(
  request: Request,
  ...allowedRoles: Role[]
): Promise<TokenPayload> {
  const { authenticateRequest } = await import('./jwt');
  const user = await authenticateRequest(request);
  if (allowedRoles.length > 0) {
    assertRole(user, ...allowedRoles);
  }
  return user;
}
