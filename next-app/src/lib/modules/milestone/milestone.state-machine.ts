// VBridgeConnect — Milestone State Machine
// PRD Section 9: Milestone lifecycle transitions.
// States: not_started → in_progress → blocked / submitted → changes_requested / accepted
// Overdue and Waived are system/authorised states.

import { MilestoneStatus } from '@prisma/client';

export type MilestoneTransition = {
  from: MilestoneStatus;
  to: MilestoneStatus;
  verb: string;
  description: string;
  allowedRoles: string[];
  requiresReason?: boolean;
  systemOnly?: boolean;  // true = only triggered by scheduled job, never by API
};

// PRD §9 milestone transitions
export const MILESTONE_TRANSITIONS: MilestoneTransition[] = [
  {
    from: 'not_started',
    to: 'in_progress',
    verb: 'start',
    description: 'Student or team begins work',
    allowedRoles: ['student', 'coordinator', 'super_admin'],
  },
  {
    from: 'in_progress',
    to: 'blocked',
    verb: 'block',
    description: 'Student marks blocked (category + reason required)',
    allowedRoles: ['student', 'coordinator', 'super_admin'],
    requiresReason: true,
  },
  {
    from: 'blocked',
    to: 'in_progress',
    verb: 'unblock',
    description: 'Blocker resolved, work resumes',
    allowedRoles: ['student', 'coordinator', 'super_admin'],
  },
  {
    from: 'in_progress',
    to: 'submitted',
    verb: 'submit',
    description: 'Student submits evidence',
    allowedRoles: ['student', 'coordinator', 'super_admin'],
  },
  {
    from: 'submitted',
    to: 'changes_requested',
    verb: 'request-changes',
    description: 'Coordinator requests changes',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'submitted',
    to: 'accepted',
    verb: 'accept',
    description: 'Coordinator accepts',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'changes_requested',
    to: 'submitted',
    verb: 'resubmit',
    description: 'Student resubmits',
    allowedRoles: ['student', 'coordinator', 'super_admin'],
  },
  // Overdue — system-derived only (architecture.md §6)
  // These transitions are triggered by the overdue sweep job, never by a user action.
  {
    from: 'not_started',
    to: 'overdue',
    verb: 'mark-overdue',
    description: 'Due date passes with no accepted submission',
    allowedRoles: [],
    systemOnly: true,
  },
  {
    from: 'in_progress',
    to: 'overdue',
    verb: 'mark-overdue',
    description: 'Due date passes with no accepted submission',
    allowedRoles: [],
    systemOnly: true,
  },
  {
    from: 'blocked',
    to: 'overdue',
    verb: 'mark-overdue',
    description: 'Due date passes with no accepted submission',
    allowedRoles: [],
    systemOnly: true,
  },
  {
    from: 'submitted',
    to: 'overdue',
    verb: 'mark-overdue',
    description: 'Due date passes with no accepted submission',
    allowedRoles: [],
    systemOnly: true,
  },
  {
    from: 'changes_requested',
    to: 'overdue',
    verb: 'mark-overdue',
    description: 'Due date passes with no accepted submission',
    allowedRoles: [],
    systemOnly: true,
  },
  // Waive — coordinator/admin only with reason
  {
    from: 'not_started',
    to: 'waived',
    verb: 'waive',
    description: 'Coordinator waives (reason required)',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
  {
    from: 'in_progress',
    to: 'waived',
    verb: 'waive',
    description: 'Coordinator waives (reason required)',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
  {
    from: 'blocked',
    to: 'waived',
    verb: 'waive',
    description: 'Coordinator waives (reason required)',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
  {
    from: 'overdue',
    to: 'waived',
    verb: 'waive',
    description: 'Coordinator waives overdue milestone (reason required)',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
];

/**
 * Validate that a transition from `currentStatus` via `verb` is allowed.
 * Returns the transition definition if valid, throws if not.
 */
export function validateMilestoneTransition(
  currentStatus: MilestoneStatus,
  verb: string,
  isSystemAction: boolean = false
): MilestoneTransition {
  const transition = MILESTONE_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.verb === verb
  );

  if (!transition) {
    const allowedVerbs = MILESTONE_TRANSITIONS
      .filter((t) => t.from === currentStatus && !t.systemOnly)
      .map((t) => t.verb);

    throw new MilestoneTransitionError(
      `Invalid transition: cannot "${verb}" from status "${currentStatus}". ` +
        `Allowed actions: [${allowedVerbs.join(', ')}]`,
      currentStatus,
      verb,
      allowedVerbs
    );
  }

  // System-only transitions can't be triggered by API
  if (transition.systemOnly && !isSystemAction) {
    throw new MilestoneTransitionError(
      `Transition "${verb}" is system-derived and cannot be triggered manually`,
      currentStatus,
      verb,
      []
    );
  }

  return transition;
}

export function assertMilestoneTransitionRole(
  transition: MilestoneTransition,
  userRole: string
): void {
  if (transition.systemOnly) return; // system actions bypass role checks
  if (!transition.allowedRoles.includes(userRole) && userRole !== 'super_admin') {
    throw new MilestoneTransitionError(
      `Role "${userRole}" is not authorized to perform "${transition.verb}"`,
      transition.from,
      transition.verb,
      []
    );
  }
}

export class MilestoneTransitionError extends Error {
  currentStatus: MilestoneStatus;
  attemptedVerb: string;
  allowedVerbs: string[];

  constructor(
    message: string,
    currentStatus: MilestoneStatus,
    attemptedVerb: string,
    allowedVerbs: string[]
  ) {
    super(message);
    this.name = 'MilestoneTransitionError';
    this.currentStatus = currentStatus;
    this.attemptedVerb = attemptedVerb;
    this.allowedVerbs = allowedVerbs;
  }
}
