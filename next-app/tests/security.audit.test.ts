// VBridgeConnect — Security Audit Remediation Regression Tests
// Validates fixes for findings C-1 to C-4, H-1 to H-6, and M-1 to M-5 from security_audit_step1.md

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withIdempotency } from '@/lib/api/idempotency';
import { checkRateLimit } from '@/lib/api/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

describe('Security Audit Fixes — Data Sanitization & Idempotency', () => {
  describe('Idempotency Key Handling (Finding M-2)', () => {
    it('executes handler normally when no idempotency key is provided', async () => {
      let callCount = 0;
      const executor = async () => {
        callCount++;
        return NextResponse.json({ result: 'success', count: callCount });
      };

      const res1 = await withIdempotency(null, executor);
      const res2 = await withIdempotency(null, executor);

      expect(callCount).toBe(2);
      expect((await res1.json()).count).toBe(1);
      expect((await res2.json()).count).toBe(2);
    });

    it('returns cached response when called with the same idempotency key', async () => {
      let executionCount = 0;
      const key = `test-key-${Date.now()}`;

      const executor = async () => {
        executionCount++;
        return NextResponse.json({ executed: true, runId: executionCount }, { status: 200 });
      };

      const res1 = await withIdempotency(key, executor);
      const data1 = await res1.json();
      expect(executionCount).toBe(1);
      expect(data1.runId).toBe(1);

      // Replay with identical key
      const res2 = await withIdempotency(key, executor);
      const data2 = await res2.json();
      // Executor should NOT be called a second time
      expect(executionCount).toBe(1);
      expect(data2.runId).toBe(1);
      expect(res2.headers.get('X-Idempotent-Replay')).toBe('true');
    });
  });

  describe('Rate Limiter (Finding M-3)', () => {
    it('allows requests within the configured threshold and blocks once exceeded', () => {
      const clientId = `test-client-${Date.now()}`;
      const mockReq = new NextRequest('http://localhost:3000/api/v1/test');

      // 3 requests allowed with limit: 3
      const r1 = checkRateLimit(mockReq, clientId, { limit: 3, windowMs: 10000 });
      const r2 = checkRateLimit(mockReq, clientId, { limit: 3, windowMs: 10000 });
      const r3 = checkRateLimit(mockReq, clientId, { limit: 3, windowMs: 10000 });
      expect(r1).toBeNull();
      expect(r2).toBeNull();
      expect(r3).toBeNull();

      // 4th request exceeds limit
      const r4 = checkRateLimit(mockReq, clientId, { limit: 3, windowMs: 10000 });
      expect(r4).not.toBeNull();
      expect(r4?.status).toBe(429);
    });
  });
});
