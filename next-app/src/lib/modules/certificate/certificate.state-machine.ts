// VBridgeConnect — Certificate State Machine
// PRD Section 9 & FR-110 to FR-117.
// Platform-issued: not_eligible → eligible → issued → revoked.
// Self-reported: posted → removed.

import { CertificateStatus, CertificateType } from '@prisma/client';

export type CertificateTransition = {
  from: CertificateStatus;
  to: CertificateStatus;
  verb: string;
  type: CertificateType;
  description: string;
  allowedRoles: string[];
  requiresReason?: boolean;
};

export const CERTIFICATE_TRANSITIONS: CertificateTransition[] = [
  // Platform-issued transitions
  {
    from: 'not_eligible',
    to: 'eligible',
    verb: 'qualify',
    type: 'platform_issued',
    description: 'Student meets activity completion and certificate rules',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'eligible',
    to: 'issued',
    verb: 'issue',
    type: 'platform_issued',
    description: 'System or coordinator issues official certificate with SHA-256 hash',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'issued',
    to: 'revoked',
    verb: 'revoke',
    type: 'platform_issued',
    description: 'Coordinator or admin revokes certificate (reason required — FR-116)',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
  // Self-reported transitions (FR-112, FR-113)
  {
    from: 'posted',
    to: 'removed',
    verb: 'remove',
    type: 'self_reported',
    description: 'Student removes self-reported certificate',
    allowedRoles: ['student', 'super_admin'],
  },
];

export class CertificateTransitionError extends Error {
  constructor(
    message: string,
    public currentStatus: CertificateStatus,
    public attemptedVerb: string,
    public allowedVerbs: string[]
  ) {
    super(message);
    this.name = 'CertificateTransitionError';
  }
}

export function validateCertificateTransition(
  currentStatus: CertificateStatus,
  verb: string,
  type: CertificateType
): CertificateTransition {
  const transition = CERTIFICATE_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.verb === verb && t.type === type
  );

  if (!transition) {
    const allowedVerbs = CERTIFICATE_TRANSITIONS
      .filter((t) => t.from === currentStatus && t.type === type)
      .map((t) => t.verb);

    throw new CertificateTransitionError(
      `Invalid certificate transition: cannot "${verb}" from status "${currentStatus}" for ${type}. ` +
        `Allowed actions: [${allowedVerbs.join(', ')}]`,
      currentStatus,
      verb,
      allowedVerbs
    );
  }

  return transition;
}

export function assertCertificateTransitionRole(
  transition: CertificateTransition,
  userRole: string
): void {
  if (!transition.allowedRoles.includes(userRole) && userRole !== 'super_admin') {
    throw new CertificateTransitionError(
      `Role "${userRole}" is not authorized to perform "${transition.verb}"`,
      transition.from,
      transition.verb,
      []
    );
  }
}
