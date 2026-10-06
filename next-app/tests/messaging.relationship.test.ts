// VBridgeConnect — Messaging Policy Tests
// FR-122, FR-123, QA-07, QA-08

import { describe, it, expect } from 'vitest';
import { isMessageVisibleToParticipant } from '@/lib/modules/messaging/messaging.relationship';

describe('Messaging Participant Window Filtering (FR-123, QA-07)', () => {
  const joinDate = new Date('2026-09-01T10:00:00Z');
  const removeDate = new Date('2026-09-15T18:00:00Z');

  it('allows viewing message sent while participant was active', () => {
    const messageDate = new Date('2026-09-05T12:00:00Z');
    expect(isMessageVisibleToParticipant(messageDate, joinDate, removeDate)).toBe(true);
  });

  it('allows viewing message if participant was never removed', () => {
    const messageDate = new Date('2026-09-20T12:00:00Z');
    expect(isMessageVisibleToParticipant(messageDate, joinDate, null)).toBe(true);
  });

  it('blocks viewing message sent BEFORE participant joined (QA-07)', () => {
    const messageDate = new Date('2026-08-31T23:59:59Z');
    expect(isMessageVisibleToParticipant(messageDate, joinDate, removeDate)).toBe(false);
  });

  it('blocks viewing message sent AFTER participant was removed (QA-07)', () => {
    const messageDate = new Date('2026-09-16T09:00:00Z');
    expect(isMessageVisibleToParticipant(messageDate, joinDate, removeDate)).toBe(false);
  });
});
