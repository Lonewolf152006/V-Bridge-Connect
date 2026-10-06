// VBridgeConnect — Submission State Machine
// PRD Section 9: Submission lifecycle transitions.
// FR-052: Submitted versions are immutable; resubmission always creates a new version.
//
// States: draft → submitted → under_review → changes_requested / accepted / invalid → evaluated

import { SubmissionStatus } from '@prisma/client';

export type SubmissionTransition = {
  from: SubmissionStatus;
  to: SubmissionStatus;
  verb: string;
  description: string;
  allowedRoles: string[];
  requiresReason?: boolean;
};

// PRD §9 submission transitions
export const SUBMISSION_TRANSITIONS: SubmissionTransition[] = [
  {
    from: 'draft',
    to: 'submitted',
    verb: 'submit',
    description: 'Student submits',
    allowedRoles: ['student', 'coordinator', 'super_admin'],
  },
  {
    from: 'submitted',
    to: 'under_review',
    verb: 'open-review',
    description: 'Coordinator opens for review',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'under_review',
    to: 'changes_requested',
    verb: 'request-changes',
    description: 'Coordinator requests changes',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'under_review',
    to: 'accepted',
    verb: 'accept',
    description: 'Coordinator accepts',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'under_review',
    to: 'invalid',
    verb: 'reject-invalid',
    description: 'Coordinator rejects as invalid',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'accepted',
    to: 'evaluated',
    verb: 'evaluate',
    description: 'Rubric evaluation completes',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  // FR-052: Resubmission creates a NEW version (handled in service, not here).
  // The state machine entry below validates that the *current* submission
  // can trigger a resubmission (new row insertion).
  {
    from: 'changes_requested',
    to: 'submitted',
    verb: 'resubmit',
    description: 'Student resubmits (new version)',
    allowedRoles: ['student', 'coordinator', 'super_admin'],
  },
];

/**
 * Validate that a transition from `currentStatus` via `verb` is allowed.
 */
export function validateSubmissionTransition(
  currentStatus: SubmissionStatus,
  verb: string
): SubmissionTransition {
  const transition = SUBMISSION_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.verb === verb
  );

  if (!transition) {
    const allowedVerbs = SUBMISSION_TRANSITIONS
      .filter((t) => t.from === currentStatus)
      .map((t) => t.verb);

    throw new SubmissionTransitionError(
      `Invalid transition: cannot "${verb}" from status "${currentStatus}". ` +
        `Allowed actions: [${allowedVerbs.join(', ')}]`,
      currentStatus,
      verb,
      allowedVerbs
    );
  }

  return transition;
}

export function assertSubmissionTransitionRole(
  transition: SubmissionTransition,
  userRole: string
): void {
  if (!transition.allowedRoles.includes(userRole) && userRole !== 'super_admin') {
    throw new SubmissionTransitionError(
      `Role "${userRole}" is not authorized to perform "${transition.verb}"`,
      transition.from,
      transition.verb,
      []
    );
  }
}

export class SubmissionTransitionError extends Error {
  currentStatus: SubmissionStatus;
  attemptedVerb: string;
  allowedVerbs: string[];

  constructor(
    message: string,
    currentStatus: SubmissionStatus,
    attemptedVerb: string,
    allowedVerbs: string[]
  ) {
    super(message);
    this.name = 'SubmissionTransitionError';
    this.currentStatus = currentStatus;
    this.attemptedVerb = attemptedVerb;
    this.allowedVerbs = allowedVerbs;
  }
}
