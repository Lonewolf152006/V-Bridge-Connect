// VBridgeConnect — Activity State Machine
// PRD Section 9: Activity lifecycle transitions.
// rules.md §2: Every transition must be validated against the state machine.
//
// States: draft → awaiting_approval → published → applications_closed →
//         active → under_final_review → completed / cancelled → archived

import { ActivityStatus } from '@prisma/client';

export type ActivityTransition = {
  from: ActivityStatus;
  to: ActivityStatus;
  verb: string;            // kebab-case verb for the POST endpoint
  description: string;
  allowedRoles: string[];  // roles that can trigger this transition
  requiresReason?: boolean;
};

// FR-005: Activity supports these state transitions (PRD §9)
export const ACTIVITY_TRANSITIONS: ActivityTransition[] = [
  {
    from: 'draft',
    to: 'awaiting_approval',
    verb: 'submit-for-approval',
    description: 'Owner submits for approval',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'awaiting_approval',
    to: 'published',
    verb: 'approve',
    description: 'Coordinator approves',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'awaiting_approval',
    to: 'draft',
    verb: 'request-changes',
    description: 'Coordinator requests changes',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'published',
    to: 'applications_closed',
    verb: 'close-applications',
    description: 'Owner pauses applications',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'applications_closed',
    to: 'active',
    verb: 'activate',
    description: 'Enrolment completes / owner starts work',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'active',
    to: 'under_final_review',
    verb: 'mark-final-review',
    description: 'Owner marks final review',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'under_final_review',
    to: 'completed',
    verb: 'complete',
    description: 'Coordinator closes activity',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  // Cancellation — from multiple states (reason required)
  {
    from: 'draft',
    to: 'cancelled',
    verb: 'cancel',
    description: 'Owner or coordinator cancels (reason required)',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
  {
    from: 'published',
    to: 'cancelled',
    verb: 'cancel',
    description: 'Owner or coordinator cancels (reason required)',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
  {
    from: 'active',
    to: 'cancelled',
    verb: 'cancel',
    description: 'Owner or coordinator cancels (reason required)',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
  // Archiving
  {
    from: 'completed',
    to: 'archived',
    verb: 'archive',
    description: 'Admin archives',
    allowedRoles: ['super_admin'],
  },
  {
    from: 'cancelled',
    to: 'archived',
    verb: 'archive',
    description: 'Admin archives',
    allowedRoles: ['super_admin'],
  },
];

/**
 * Validate that a transition from `currentStatus` via `verb` is allowed.
 * Returns the transition definition if valid, throws if not.
 * rules.md §2: reject anything not an explicit from→to pair.
 */
export function validateActivityTransition(
  currentStatus: ActivityStatus,
  verb: string
): ActivityTransition {
  const transition = ACTIVITY_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.verb === verb
  );

  if (!transition) {
    const allowedVerbs = ACTIVITY_TRANSITIONS
      .filter((t) => t.from === currentStatus)
      .map((t) => t.verb);

    throw new ActivityTransitionError(
      `Invalid transition: cannot "${verb}" from status "${currentStatus}". ` +
        `Allowed actions from "${currentStatus}": [${allowedVerbs.join(', ')}]`,
      currentStatus,
      verb,
      allowedVerbs
    );
  }

  return transition;
}

/**
 * Check if a role is authorized to perform a specific transition.
 */
export function assertTransitionRole(
  transition: ActivityTransition,
  userRole: string
): void {
  if (!transition.allowedRoles.includes(userRole) && userRole !== 'super_admin') {
    throw new ActivityTransitionError(
      `Role "${userRole}" is not authorized to perform "${transition.verb}". ` +
        `Allowed roles: [${transition.allowedRoles.join(', ')}]`,
      transition.from,
      transition.verb,
      []
    );
  }
}

export class ActivityTransitionError extends Error {
  currentStatus: ActivityStatus;
  attemptedVerb: string;
  allowedVerbs: string[];

  constructor(
    message: string,
    currentStatus: ActivityStatus,
    attemptedVerb: string,
    allowedVerbs: string[]
  ) {
    super(message);
    this.name = 'ActivityTransitionError';
    this.currentStatus = currentStatus;
    this.attemptedVerb = attemptedVerb;
    this.allowedVerbs = allowedVerbs;
  }
}
