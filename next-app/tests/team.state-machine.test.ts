// VBridgeConnect — Team Risk State Machine Tests
// rules.md §7: Positive + negative tests for every state machine.

import { describe, it, expect } from 'vitest';
import {
  validateTeamRiskTransition,
  assertTeamRiskTransitionRole,
  TeamRiskTransitionError,
} from '@/lib/modules/team/team.state-machine';

describe('Team Risk State Machine', () => {
  describe('Positive transitions', () => {
    it('allows on_track → watch via "flag-watch"', () => {
      const t = validateTeamRiskTransition('on_track', 'flag-watch');
      expect(t.to).toBe('watch');
      expect(() => assertTeamRiskTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows watch → at_risk via "flag-risk" requiring reason', () => {
      const t = validateTeamRiskTransition('watch', 'flag-risk');
      expect(t.to).toBe('at_risk');
      expect(t.requiresReason).toBe(true);
      expect(() => assertTeamRiskTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows at_risk → blocked via "flag-blocked" requiring reason', () => {
      const t = validateTeamRiskTransition('at_risk', 'flag-blocked');
      expect(t.to).toBe('blocked');
      expect(t.requiresReason).toBe(true);
      expect(() => assertTeamRiskTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows recovery to on_track from watch, at_risk, and blocked via "resolve-risk"', () => {
      const tWatch = validateTeamRiskTransition('watch', 'resolve-risk');
      expect(tWatch.to).toBe('on_track');

      const tAtRisk = validateTeamRiskTransition('at_risk', 'resolve-risk');
      expect(tAtRisk.to).toBe('on_track');

      const tBlocked = validateTeamRiskTransition('blocked', 'resolve-risk');
      expect(tBlocked.to).toBe('on_track');
    });

    it('allows blocked → at_risk via "downgrade-risk"', () => {
      const t = validateTeamRiskTransition('blocked', 'downgrade-risk');
      expect(t.to).toBe('at_risk');
    });

    it('super_admin is allowed on any transition', () => {
      const t = validateTeamRiskTransition('watch', 'flag-risk');
      expect(() => assertTeamRiskTransitionRole(t, 'super_admin')).not.toThrow();
    });
  });

  describe('Negative transitions', () => {
    it('rejects invalid action from on_track (e.g. resolve-risk when already on_track)', () => {
      expect(() => validateTeamRiskTransition('on_track', 'resolve-risk')).toThrow(
        TeamRiskTransitionError
      );
    });

    it('rejects unauthorized role (e.g. student)', () => {
      const t = validateTeamRiskTransition('on_track', 'flag-watch');
      expect(() => assertTeamRiskTransitionRole(t, 'student')).toThrow(
        TeamRiskTransitionError
      );
    });
  });
});
