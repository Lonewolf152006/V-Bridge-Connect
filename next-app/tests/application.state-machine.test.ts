// VBridgeConnect — Application State Machine Tests
// rules.md §7: Every state machine gets positive + negative tests.

import { describe, it, expect } from 'vitest';
import {
  validateApplicationTransition,
  assertApplicationTransitionRole,
  ApplicationTransitionError,
  APPLICATION_TRANSITIONS,
} from '@/lib/modules/application/application.state-machine';

describe('Application State Machine', () => {
  describe('Positive transitions', () => {
    it('allows draft → submitted via "submit" by student', () => {
      const t = validateApplicationTransition('draft', 'submit');
      expect(t.to).toBe('submitted');
      expect(() => assertApplicationTransitionRole(t, 'student')).not.toThrow();
    });

    it('allows submitted → under_review via "open-review" by coordinator', () => {
      const t = validateApplicationTransition('submitted', 'open-review');
      expect(t.to).toBe('under_review');
      expect(() => assertApplicationTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows under_review → shortlisted via "shortlist" by coordinator', () => {
      const t = validateApplicationTransition('under_review', 'shortlist');
      expect(t.to).toBe('shortlisted');
      expect(() => assertApplicationTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows shortlisted → selected via "select" by coordinator', () => {
      const t = validateApplicationTransition('shortlisted', 'select');
      expect(t.to).toBe('selected');
      expect(() => assertApplicationTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows under_review → waitlisted via "waitlist" by coordinator', () => {
      const t = validateApplicationTransition('under_review', 'waitlist');
      expect(t.to).toBe('waitlisted');
      expect(() => assertApplicationTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows waitlisted → selected via "promote" by coordinator', () => {
      const t = validateApplicationTransition('waitlisted', 'promote');
      expect(t.to).toBe('selected');
      expect(() => assertApplicationTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows under_review → rejected via "reject" by coordinator with reason required', () => {
      const t = validateApplicationTransition('under_review', 'reject');
      expect(t.to).toBe('rejected');
      expect(t.requiresReason).toBe(true);
      expect(() => assertApplicationTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows shortlisted → rejected via "reject" by coordinator with reason required', () => {
      const t = validateApplicationTransition('shortlisted', 'reject');
      expect(t.to).toBe('rejected');
      expect(t.requiresReason).toBe(true);
      expect(() => assertApplicationTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows withdrawal from draft, submitted, and under_review by student', () => {
      const tDraft = validateApplicationTransition('draft', 'withdraw');
      expect(tDraft.to).toBe('withdrawn');
      expect(() => assertApplicationTransitionRole(tDraft, 'student')).not.toThrow();

      const tSubmitted = validateApplicationTransition('submitted', 'withdraw');
      expect(tSubmitted.to).toBe('withdrawn');
      expect(() => assertApplicationTransitionRole(tSubmitted, 'student')).not.toThrow();

      const tUnderReview = validateApplicationTransition('under_review', 'withdraw');
      expect(tUnderReview.to).toBe('withdrawn');
      expect(() => assertApplicationTransitionRole(tUnderReview, 'student')).not.toThrow();
    });

    it('super_admin is allowed on any transition', () => {
      for (const t of APPLICATION_TRANSITIONS) {
        expect(() => assertApplicationTransitionRole(t, 'super_admin')).not.toThrow();
      }
    });
  });

  describe('Negative transitions (disallowed transitions)', () => {
    it('rejects invalid action from draft', () => {
      expect(() => validateApplicationTransition('draft', 'select')).toThrow(
        ApplicationTransitionError
      );
      expect(() => validateApplicationTransition('draft', 'shortlist')).toThrow(
        ApplicationTransitionError
      );
    });

    it('rejects direct draft → selected (skipping review)', () => {
      expect(() => validateApplicationTransition('draft', 'select')).toThrow();
    });

    it('rejects transition from terminal state selected', () => {
      expect(() => validateApplicationTransition('selected', 'withdraw')).toThrow(
        ApplicationTransitionError
      );
      expect(() => validateApplicationTransition('selected', 'reject')).toThrow(
        ApplicationTransitionError
      );
    });

    it('rejects transition from terminal state rejected', () => {
      expect(() => validateApplicationTransition('rejected', 'select')).toThrow(
        ApplicationTransitionError
      );
      expect(() => validateApplicationTransition('rejected', 'reopen')).toThrow(
        ApplicationTransitionError
      );
    });

    it('rejects transition from terminal state withdrawn', () => {
      expect(() => validateApplicationTransition('withdrawn', 'submit')).toThrow(
        ApplicationTransitionError
      );
    });

    it('rejects unauthorized roles for coordinator actions', () => {
      const t = validateApplicationTransition('under_review', 'shortlist');
      expect(() => assertApplicationTransitionRole(t, 'student')).toThrow(
        ApplicationTransitionError
      );
      expect(() => assertApplicationTransitionRole(t, 'industry_partner')).toThrow(
        ApplicationTransitionError
      );
    });
  });
});
