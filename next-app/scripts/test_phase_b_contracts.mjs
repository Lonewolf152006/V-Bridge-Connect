// VBridgeConnect — Phase B Contract & REST Standard Validation Test Suite
// Rigorously tests requirements B1 through B8 against live production build.

import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { SignJWT } from 'jose';

// Load .env if not already loaded
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w_]+)\s*=\s*"?([^"\r\n]+)"?/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

const PORT = 3008;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vbridgeconnect-dev-secret-change-in-prod'
);

async function createToken(userId, role, email) {
  return new SignJWT({ userId, role, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .setIssuer('vbridgeconnect')
    .sign(JWT_SECRET);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${url}/api/activities`);
      if (res.status < 500) return true;
    } catch {
      await wait(500);
    }
  }
  throw new Error(`Server failed to start at ${url} within timeout`);
}

async function runTests() {
  console.log('====================================================');
  console.log('   VBRIDGECONNECT PHASE B CONTRACT VALIDATION TESTS  ');
  console.log('====================================================\n');

  let serverProcess = null;

  try {
    // Check if server is already running on port 3004
    let serverRunning = false;
    try {
      const ping = await fetch(`${BASE_URL}/api/activities`);
      if (ping.status < 500) {
        serverRunning = true;
        console.log(`[Setup] Reusing existing server running on port ${PORT}`);
      }
    } catch {}

    if (!serverRunning) {
      console.log(`[Setup] Starting Next.js production server on port ${PORT}...`);
      serverProcess = spawn('npx', ['next', 'start', '-p', String(PORT)], {
        cwd: process.cwd(),
        shell: true,
        stdio: 'pipe',
      });

      serverProcess.stderr.on('data', (data) => {
        const err = data.toString();
        if (err.includes('Error')) console.error(`[Server Error]: ${err}`);
      });

      await waitForServer(BASE_URL);
      console.log(`[Setup] Server successfully running at ${BASE_URL}\n`);
    }

    const studentToken = await createToken('stu-uuid-001', 'student', 'student.test@vit.edu.in');
    const coordToken = await createToken('coord-uuid-001', 'coordinator', 'sheetal.patil@vit.edu.in');

    // Fetch a real active activity from DB for mutating contract tests
    const actRes = await fetch(`${BASE_URL}/api/activities`);
    const actJson = await actRes.json();
    const realActivityId = actJson.data?.[0]?.id || '00000000-0000-0000-0000-000000000001';

    let passedTests = 0;
    let failedTests = 0;

    function assert(condition, message) {
      if (condition) {
        console.log(`  ✔ PASS: ${message}`);
        passedTests++;
      } else {
        console.error(`  ✖ FAIL: ${message}`);
        failedTests++;
      }
    }

    // ---------------------------------------------------------
    // TEST 1: Strict Zod Validation & Unified Error Envelope (B1)
    // ---------------------------------------------------------
    console.log('[Test 1] B1: Strict Zod Schema & Unified Error Envelope');
    {
      const res = await fetch(`${BASE_URL}/api/v1/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          activityId: '00000000-0000-0000-0000-000000000001',
          name: 'Valid Name',
          maliciousExtraProperty: 'forbidden_payload',
        }),
      });

      const body = await res.json();
      assert(res.status === 422, `Expected status 422 for unrecognized key, got ${res.status}`);
      assert(body.error && body.error.code === 'VALIDATION_ERROR', `Error code must be 'VALIDATION_ERROR', got '${body.error?.code}'`);
      assert(typeof body.error?.message === 'string', 'Error envelope contains descriptive message');
      assert(Array.isArray(body.error?.details) && body.error.details.length > 0, 'Details contains list of validation issues');
      assert(typeof body.error?.requestId === 'string' && body.error.requestId.length > 0, `requestId is populated: ${body.error?.requestId}`);
    }

    // ---------------------------------------------------------
    // TEST 2: Deny-by-default Auth on Protected Endpoints (B4)
    // ---------------------------------------------------------
    console.log('\n[Test 2] B4: Deny-by-default Auth (Missing Token)');
    {
      const res = await fetch(`${BASE_URL}/api/v1/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: '00000000-0000-0000-0000-000000000001',
          name: 'Should Reject Team',
        }),
      });

      const body = await res.json();
      assert(res.status === 401, `Expected status 401 for unauthenticated request, got ${res.status}`);
      assert(body.error && body.error.code === 'UNAUTHORIZED', `Error code must be 'UNAUTHORIZED', got '${body.error?.code}'`);
      assert(body.error?.requestId, '401 response contains requestId');
    }

    // ---------------------------------------------------------
    // TEST 3: RBAC Role Matrix Enforcement (B4)
    // ---------------------------------------------------------
    console.log('\n[Test 3] B4: RBAC Role Matrix (Student denied access to Admin endpoint)');
    {
      const res = await fetch(`${BASE_URL}/api/v1/admin/users`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
      });

      const body = await res.json();
      assert(res.status === 403, `Expected status 403 for unauthorized role, got ${res.status}`);
      assert(body.error && body.error.code === 'FORBIDDEN', `Error code must be 'FORBIDDEN', got '${body.error?.code}'`);
    }

    // ---------------------------------------------------------
    // TEST 4: Clamped Cursor Pagination (B2)
    // ---------------------------------------------------------
    console.log('\n[Test 4] B2: Cursor Pagination Limit Clamped to 50');
    {
      const res = await fetch(`${BASE_URL}/api/v1/teams?limit=250`, {
        headers: {
          Authorization: `Bearer ${coordToken}`,
        },
      });

      const body = await res.json();
      assert(res.status === 200, `Expected status 200 for valid list query, got ${res.status}`);
      assert(body.pagination !== undefined, 'Response includes pagination metadata');
      assert(body.pagination.limit === 50, `Requested limit=250 was clamped to 50, actual: ${body.pagination?.limit}`);
      assert(typeof body.pagination.hasMore === 'boolean', 'pagination.hasMore is a boolean');
    }

    // ---------------------------------------------------------
    // TEST 5: Whitelisted Filter & Sort Parameters (B3)
    // ---------------------------------------------------------
    console.log('\n[Test 5] B3: Whitelisted Sort Parameters (Reject Malicious Sort)');
    {
      const res = await fetch(`${BASE_URL}/api/v1/teams?sortBy=malicious_sql_column`, {
        headers: {
          Authorization: `Bearer ${coordToken}`,
        },
      });

      const body = await res.json();
      assert(res.status === 422, `Expected status 422 for invalid sort field, got ${res.status}`);
      assert(body.error && body.error.code === 'VALIDATION_ERROR', `Error code must be 'VALIDATION_ERROR', got '${body.error?.code}'`);
    }

    // ---------------------------------------------------------
    // TEST 6: Mutating Idempotency Key Deduplication (B5)
    // ---------------------------------------------------------
    console.log('\n[Test 6] B5: Mutating Idempotency Key Replay Detection');
    {
      const testKey = `idemp-contract-test-${Date.now()}`;
      
      // Call 1
      const res1 = await fetch(`${BASE_URL}/api/v1/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${coordToken}`,
          'Idempotency-Key': testKey,
        },
        body: JSON.stringify({
          activityId: realActivityId,
          name: `Idempotency Team ${Date.now()}`,
        }),
      });

      const body1 = await res1.json();
      const status1 = res1.status;

      // Call 2 with identical Idempotency-Key
      const res2 = await fetch(`${BASE_URL}/api/v1/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${coordToken}`,
          'Idempotency-Key': testKey,
        },
        body: JSON.stringify({
          activityId: realActivityId,
          name: `Idempotency Team ${Date.now()}`,
        }),
      });

      const body2 = await res2.json();
      assert(res2.headers.get('x-idempotent-replay') === 'true', 'Second request includes X-Idempotent-Replay: true header');
      assert(res2.status === status1, `Replayed response status matches original status (${status1})`);
      
      const sortKeys = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(sortKeys);
        return Object.keys(obj).sort().reduce((acc, k) => { acc[k] = sortKeys(obj[k]); return acc; }, {});
      };

      assert(JSON.stringify(sortKeys(body1)) === JSON.stringify(sortKeys(body2)), 'Replayed response body matches cached response exactly');
    }

    // ---------------------------------------------------------
    // TEST 7: Rate Limiting with 429 & Retry-After (B6)
    // ---------------------------------------------------------
    console.log('\n[Test 7] B6: Rate Limiting & Retry-After Headers');
    {
      // Rapid burst of 40 mutation requests to trigger 30 req/min limit
      let hit429 = false;
      let retryAfterHeader = null;

      for (let i = 0; i < 40; i++) {
        const res = await fetch(`${BASE_URL}/api/v1/teams`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${studentToken}`,
          },
          body: JSON.stringify({
            activityId: realActivityId,
            name: `Rate Test ${i}`,
          }),
        });

        if (res.status === 429) {
          hit429 = true;
          retryAfterHeader = res.headers.get('Retry-After');
          const body = await res.json();
          assert(body.error && body.error.code === 'RATE_LIMITED', `429 body has code 'RATE_LIMITED', got '${body.error?.code}'`);
          break;
        }
      }

      assert(hit429, 'Rate limiter triggered 429 status on burst');
      assert(retryAfterHeader !== null && parseInt(retryAfterHeader, 10) > 0, `Retry-After header is present with positive seconds: ${retryAfterHeader}s`);
    }

    // ---------------------------------------------------------
    // TEST 8: Locked CORS & Security Headers (B7)
    // ---------------------------------------------------------
    console.log('\n[Test 8] B7: Security Headers & Locked CORS');
    {
      const res = await fetch(`${BASE_URL}/api/activities`);

      const nosniff = res.headers.get('x-content-type-options');
      const frameOptions = res.headers.get('x-frame-options');
      const requestId = res.headers.get('x-request-id');

      assert(nosniff === 'nosniff', `X-Content-Type-Options is nosniff: ${nosniff}`);
      assert(frameOptions === 'DENY', `X-Frame-Options is DENY: ${frameOptions}`);
      assert(requestId !== null && requestId.length > 0, `X-Request-Id header is present: ${requestId}`);

      // Test CORS preflight
      const corsRes = await fetch(`${BASE_URL}/api/v1/teams`, {
        method: 'OPTIONS',
      });
      const allowMethods = corsRes.headers.get('access-control-allow-methods');
      assert(allowMethods !== null && allowMethods.includes('POST'), `CORS preflight specifies allowed methods: ${allowMethods}`);
    }

    console.log('\n====================================================');
    console.log(`TOTAL TESTS: ${passedTests + failedTests}`);
    console.log(`PASSED: ${passedTests}`);
    console.log(`FAILED: ${failedTests}`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      console.log('✔ All Phase B Contract Standards VERIFIED successfully!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during contract tests:', err);
    process.exit(1);
  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }
}

runTests();
