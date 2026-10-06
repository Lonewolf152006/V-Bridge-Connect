// VBridgeConnect — Certificate State Machine Tests
// rules.md §7: Positive + negative tests for every state machine.

import { describe, it, expect } from 'vitest';
import {
  validateCertificateTransition,
  assertCertificateTransitionRole,
  CertificateTransitionError,
} from '@/lib/modules/certificate/certificate.state-machine';

describe('Certificate State Machine', () => {
  describe('Positive transitions', () => {
    it('allows not_eligible → eligible via "qualify"', () => {
      const t = validateCertificateTransition('not_eligible', 'qualify', 'platform_issued');
      expect(t.to).toBe('eligible');
      expect(() => assertCertificateTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows eligible → issued via "issue"', () => {
      const t = validateCertificateTransition('eligible', 'issue', 'platform_issued');
      expect(t.to).toBe('issued');
      expect(() => assertCertificateTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows issued → revoked via "revoke" requiring reason (FR-116)', () => {
      const t = validateCertificateTransition('issued', 'revoke', 'platform_issued');
      expect(t.to).toBe('revoked');
      expect(t.requiresReason).toBe(true);
      expect(() => assertCertificateTransitionRole(t, 'coordinator')).not.toThrow();
    });

    it('allows posted → removed via "remove" by student (FR-112)', () => {
      const t = validateCertificateTransition('posted', 'remove', 'self_reported');
      expect(t.to).toBe('removed');
      expect(() => assertCertificateTransitionRole(t, 'student')).not.toThrow();
    });

    it('super_admin is allowed on any transition', () => {
      const t = validateCertificateTransition('issued', 'revoke', 'platform_issued');
      expect(() => assertCertificateTransitionRole(t, 'super_admin')).not.toThrow();
    });
  });

  describe('Negative transitions', () => {
    it('rejects student attempting to issue platform certificate', () => {
      const t = validateCertificateTransition('eligible', 'issue', 'platform_issued');
      expect(() => assertCertificateTransitionRole(t, 'student')).toThrow(
        CertificateTransitionError
      );
    });

    it('rejects student attempting to revoke platform certificate', () => {
      const t = validateCertificateTransition('issued', 'revoke', 'platform_issued');
      expect(() => assertCertificateTransitionRole(t, 'student')).toThrow(
        CertificateTransitionError
      );
    });

    it('rejects invalid action from terminal revoked state', () => {
      expect(() =>
        validateCertificateTransition('revoked', 'issue', 'platform_issued')
      ).toThrow(CertificateTransitionError);
    });

    it('rejects applying platform transition to self_reported certificate', () => {
      expect(() =>
        validateCertificateTransition('not_eligible', 'qualify', 'self_reported')
      ).toThrow(CertificateTransitionError);
    });
  });
});
