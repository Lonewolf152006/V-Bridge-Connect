// VBridgeConnect — Messaging Relationship Policy
// FR-122 & QA-08: 1:1 chat can be initiated ONLY between two users who share
// at least one common activity, team, or explicit relationship.
// FR-123 & QA-07: Participant window check for message visibility.

import prisma from '@/lib/db/prisma';

export class MessagingAuthorizationError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message);
    this.name = 'MessagingAuthorizationError';
  }
}

/**
 * Asserts that two users share at least one active activity, team, or coordinator relationship.
 * FR-122, QA-08.
 */
export async function assertCanInitiateDirectChat(
  userAId: string,
  userBId: string
): Promise<void> {
  if (userAId === userBId) {
    throw new MessagingAuthorizationError('Cannot initiate a 1:1 chat with yourself', 400);
  }

  // 1. Check if userA and userB are in any shared team
  const sharedTeam = await prisma.teamMembership.findFirst({
    where: {
      userId: userAId,
      removedAt: null,
      team: {
        members: {
          some: {
            userId: userBId,
            removedAt: null,
          },
        },
      },
    },
  });

  if (sharedTeam) return;

  // 2. Check if they share an activity (e.g. coordinator and student, or students in same activity)
  const sharedActivity = await prisma.activity.findFirst({
    where: {
      OR: [
        // One is the owner/coordinator and other has active application or team membership
        {
          ownerId: userAId,
          OR: [
            { applications: { some: { applicantId: userBId, status: { in: ['submitted', 'shortlisted', 'selected'] } } } },
            { teams: { some: { members: { some: { userId: userBId, removedAt: null } } } } },
          ],
        },
        {
          ownerId: userBId,
          OR: [
            { applications: { some: { applicantId: userAId, status: { in: ['submitted', 'shortlisted', 'selected'] } } } },
            { teams: { some: { members: { some: { userId: userAId, removedAt: null } } } } },
          ],
        },
        // Both are applicants/members in the same activity
        {
          applications: {
            some: { applicantId: userAId, status: { in: ['submitted', 'shortlisted', 'selected'] } },
          },
          teams: {
            some: { members: { some: { userId: userBId, removedAt: null } } },
          },
        },
      ],
    },
  });

  if (sharedActivity) return;

  // 3. Super admin can always initiate chat
  const userA = await prisma.user.findUnique({
    where: { id: userAId },
    select: { role: true },
  });
  if (userA?.role === 'super_admin') return;

  // No shared context found — QA-08 violation
  throw new MessagingAuthorizationError(
    'Direct 1:1 chat requires a shared activity or team relationship (FR-122, QA-08)',
    403
  );
}

/**
 * Filter messages according to participant membership window (FR-123, QA-07).
 * User can only see messages sent while they were an active participant:
 * message.createdAt >= participant.joinedAt AND (participant.removedAt == null OR message.createdAt <= participant.removedAt)
 */
export function isMessageVisibleToParticipant(
  messageCreatedAt: Date,
  joinedAt: Date,
  removedAt: Date | null
): boolean {
  if (messageCreatedAt < joinedAt) {
    return false;
  }
  if (removedAt !== null && messageCreatedAt > removedAt) {
    return false;
  }
  return true;
}
