// VBridgeConnect — Application State Machine
// PRD Section 9: Application lifecycle transitions.
// FR-015: Capacity checks and waitlist promotion update atomically (QA-10).
//
// States: draft → submitted → under_review → shortlisted / selected / waitlisted / rejected → withdrawn

import { ApplicationStatus } from '@prisma/client';

export type ApplicationTransition = {
  from: ApplicationStatus;
  to: ApplicationStatus;
  verb: string;
  description: string;
  allowedRoles: string[];
  requiresReason?: boolean;
};

// PRD §9 application transitions
export const APPLICATION_TRANSITIONS: ApplicationTransition[] = [
  {
    from: 'draft',
    to: 'submitted',
    verb: 'submit',
    description: 'Applicant submits',
    allowedRoles: ['student', 'coordinator', 'super_admin'],
  },
  {
    from: 'submitted',
    to: 'under_review',
    verb: 'open-review',
    description: 'Reviewer opens application',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'under_review',
    to: 'shortlisted',
    verb: 'shortlist',
    description: 'Reviewer shortlists',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'shortlisted',
    to: 'selected',
    verb: 'select',
    description: 'Reviewer selects (capacity-sensitive — QA-10)',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'under_review',
    to: 'waitlisted',
    verb: 'waitlist',
    description: 'Capacity reached, applicant qualifies',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'under_review',
    to: 'rejected',
    verb: 'reject',
    description: 'Reviewer rejects',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
  {
    from: 'shortlisted',
    to: 'rejected',
    verb: 'reject',
    description: 'Reviewer rejects from shortlist',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
  // Withdrawal — from multiple pre-decision states
  {
    from: 'draft',
    to: 'withdrawn',
    verb: 'withdraw',
    description: 'Applicant withdraws',
    allowedRoles: ['student', 'coordinator', 'super_admin'],
  },
  {
    from: 'submitted',
    to: 'withdrawn',
    verb: 'withdraw',
    description: 'Applicant withdraws',
    allowedRoles: ['student', 'coordinator', 'super_admin'],
  },
  {
    from: 'under_review',
    to: 'withdrawn',
    verb: 'withdraw',
    description: 'Applicant withdraws',
    allowedRoles: ['student', 'coordinator', 'super_admin'],
  },
  // Waitlist promotion
  {
    from: 'waitlisted',
    to: 'selected',
    verb: 'promote',
    description: 'Waitlisted applicant promoted when slot opens',
    allowedRoles: ['coordinator', 'super_admin'],
  },
];

export function validateApplicationTransition(
  currentStatus: ApplicationStatus,
  verb: string
): ApplicationTransition {
  const transition = APPLICATION_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.verb === verb
  );

  if (!transition) {
    const allowedVerbs = APPLICATION_TRANSITIONS
      .filter((t) => t.from === currentStatus)
      .map((t) => t.verb);

    throw new ApplicationTransitionError(
      `Invalid transition: cannot "${verb}" from status "${currentStatus}". ` +
        `Allowed actions: [${allowedVerbs.join(', ')}]`,
      currentStatus,
      verb,
      allowedVerbs
    );
  }

  return transition;
}

export function assertApplicationTransitionRole(
  transition: ApplicationTransition,
  userRole: string
): void {
  if (!transition.allowedRoles.includes(userRole) && userRole !== 'super_admin') {
    throw new ApplicationTransitionError(
      `Role "${userRole}" is not authorized to perform "${transition.verb}"`,
      transition.from,
      transition.verb,
      []
    );
  }
}

export class ApplicationTransitionError extends Error {
  currentStatus: ApplicationStatus;
  attemptedVerb: string;
  allowedVerbs: string[];

  constructor(
    message: string,
    currentStatus: ApplicationStatus,
    attemptedVerb: string,
    allowedVerbs: string[]
  ) {
    super(message);
    this.name = 'ApplicationTransitionError';
    this.currentStatus = currentStatus;
    this.attemptedVerb = attemptedVerb;
    this.allowedVerbs = allowedVerbs;
  }
}
