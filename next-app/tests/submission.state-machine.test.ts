// VBridgeConnect — Submission State Machine Tests
// rules.md §7: Every state machine gets positive + negative tests.

import { describe, it, expect } from 'vitest';
import {
  validateSubmissionTransition,
  assertSubmissionTransitionRole,
  SubmissionTransitionError,
} from '@/lib/modules/submission/submission.state-machine';

describe('Submission State Machine', () => {
  // ─── Positive Tests: Valid transitions ───────────────────────────────────

  it('draft → submitted via "submit"', () => {
    const transition = validateSubmissionTransition('draft', 'submit');
    expect(transition.to).toBe('submitted');
  });

  it('submitted → under_review via "open-review"', () => {
    const transition = validateSubmissionTransition('submitted', 'open-review');
    expect(transition.to).toBe('under_review');
  });

  it('under_review → changes_requested via "request-changes"', () => {
    const transition = validateSubmissionTransition('under_review', 'request-changes');
    expect(transition.to).toBe('changes_requested');
  });

  it('under_review → accepted via "accept"', () => {
    const transition = validateSubmissionTransition('under_review', 'accept');
    expect(transition.to).toBe('accepted');
  });

  it('under_review → invalid via "reject-invalid"', () => {
    const transition = validateSubmissionTransition('under_review', 'reject-invalid');
    expect(transition.to).toBe('invalid');
  });

  it('accepted → evaluated via "evaluate"', () => {
    const transition = validateSubmissionTransition('accepted', 'evaluate');
    expect(transition.to).toBe('evaluated');
  });

  // FR-052: Resubmission creates a new version
  it('changes_requested → submitted via "resubmit"', () => {
    const transition = validateSubmissionTransition('changes_requested', 'resubmit');
    expect(transition.to).toBe('submitted');
  });

  // ─── Negative Tests: Invalid transitions ─────────────────────────────────

  it('rejects "accept" from draft (must submit first)', () => {
    expect(() => validateSubmissionTransition('draft', 'accept')).toThrow(
      SubmissionTransitionError
    );
  });

  it('rejects "submit" from under_review (already submitted)', () => {
    expect(() => validateSubmissionTransition('under_review', 'submit')).toThrow(
      SubmissionTransitionError
    );
  });

  it('rejects "evaluate" from submitted (must accept first)', () => {
    expect(() => validateSubmissionTransition('submitted', 'evaluate')).toThrow(
      SubmissionTransitionError
    );
  });

  it('rejects "resubmit" from accepted (only from changes_requested)', () => {
    expect(() => validateSubmissionTransition('accepted', 'resubmit')).toThrow(
      SubmissionTransitionError
    );
  });

  it('rejects "open-review" from evaluated (terminal state for reviews)', () => {
    expect(() => validateSubmissionTransition('evaluated', 'open-review')).toThrow(
      SubmissionTransitionError
    );
  });

  it('rejects "request-changes" from invalid', () => {
    expect(() => validateSubmissionTransition('invalid', 'request-changes')).toThrow(
      SubmissionTransitionError
    );
  });

  it('rejects completely unknown verb', () => {
    expect(() => validateSubmissionTransition('draft', 'approve')).toThrow(
      SubmissionTransitionError
    );
  });

  // ─── Role Authorization Tests ────────────────────────────────────────────

  it('allows student to submit', () => {
    const transition = validateSubmissionTransition('draft', 'submit');
    expect(() => assertSubmissionTransitionRole(transition, 'student')).not.toThrow();
  });

  it('allows coordinator to accept', () => {
    const transition = validateSubmissionTransition('under_review', 'accept');
    expect(() => assertSubmissionTransitionRole(transition, 'coordinator')).not.toThrow();
  });

  it('rejects student from accepting (coordinator-only action)', () => {
    const transition = validateSubmissionTransition('under_review', 'accept');
    expect(() => assertSubmissionTransitionRole(transition, 'student')).toThrow(
      SubmissionTransitionError
    );
  });

  it('rejects industry_partner from any submission action', () => {
    const transition = validateSubmissionTransition('draft', 'submit');
    expect(() => assertSubmissionTransitionRole(transition, 'industry_partner')).toThrow(
      SubmissionTransitionError
    );
  });

  // ─── Error detail checks ─────────────────────────────────────────────────

  it('error includes allowed verbs for current status', () => {
    try {
      validateSubmissionTransition('draft', 'accept');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(SubmissionTransitionError);
      const err = error as SubmissionTransitionError;
      expect(err.currentStatus).toBe('draft');
      expect(err.attemptedVerb).toBe('accept');
      expect(err.allowedVerbs).toContain('submit');
    }
  });
});
