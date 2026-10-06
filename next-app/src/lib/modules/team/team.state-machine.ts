// VBridgeConnect — Team Risk State Machine
// PRD Section 9: Team Risk Lifecycle & FR-034: Reason required for at_risk / blocked.
// Roles: coordinator, super_admin (mentor responsibilities absorbed by coordinator)
//
// States: on_track ⇄ watch ⇄ at_risk ⇄ blocked

import { TeamRiskStatus } from '@prisma/client';

export type TeamRiskTransition = {
  from: TeamRiskStatus;
  to: TeamRiskStatus;
  verb: string;
  description: string;
  allowedRoles: string[];
  requiresReason?: boolean;
};

export const TEAM_RISK_TRANSITIONS: TeamRiskTransition[] = [
  {
    from: 'on_track',
    to: 'watch',
    verb: 'flag-watch',
    description: 'Inactivity window elapses with no update or mentor flags watch',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'watch',
    to: 'at_risk',
    verb: 'flag-risk',
    description: 'Milestone goes overdue or critical blocker logged',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
  {
    from: 'on_track',
    to: 'at_risk',
    verb: 'flag-risk',
    description: 'Direct escalation to at risk',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
  {
    from: 'at_risk',
    to: 'blocked',
    verb: 'flag-blocked',
    description: 'Blocker unresolved past threshold',
    allowedRoles: ['coordinator', 'super_admin'],
    requiresReason: true,
  },
  {
    from: 'watch',
    to: 'on_track',
    verb: 'resolve-risk',
    description: 'Coordinator resolves risk, confirms team is back on track',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'at_risk',
    to: 'on_track',
    verb: 'resolve-risk',
    description: 'Coordinator resolves risk, confirms team is back on track',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'blocked',
    to: 'on_track',
    verb: 'resolve-risk',
    description: 'Coordinator resolves risk, confirms team is back on track',
    allowedRoles: ['coordinator', 'super_admin'],
  },
  {
    from: 'blocked',
    to: 'at_risk',
    verb: 'downgrade-risk',
    description: 'Unblock team but retain at-risk status',
    allowedRoles: ['coordinator', 'super_admin'],
  },
];

export class TeamRiskTransitionError extends Error {
  constructor(
    message: string,
    public currentStatus: TeamRiskStatus,
    public attemptedVerb: string,
    public allowedVerbs: string[]
  ) {
    super(message);
    this.name = 'TeamRiskTransitionError';
  }
}

export function validateTeamRiskTransition(
  currentStatus: TeamRiskStatus,
  verb: string
): TeamRiskTransition {
  const transition = TEAM_RISK_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.verb === verb
  );

  if (!transition) {
    const allowedVerbs = TEAM_RISK_TRANSITIONS
      .filter((t) => t.from === currentStatus)
      .map((t) => t.verb);

    throw new TeamRiskTransitionError(
      `Invalid transition: cannot "${verb}" from status "${currentStatus}". ` +
        `Allowed actions: [${allowedVerbs.join(', ')}]`,
      currentStatus,
      verb,
      allowedVerbs
    );
  }

  return transition;
}

export function assertTeamRiskTransitionRole(
  transition: TeamRiskTransition,
  userRole: string
): void {
  if (!transition.allowedRoles.includes(userRole) && userRole !== 'super_admin') {
    throw new TeamRiskTransitionError(
      `Role "${userRole}" is not authorized to perform "${transition.verb}"`,
      transition.from,
      transition.verb,
      []
    );
  }
}
