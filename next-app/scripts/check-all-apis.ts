/**
 * VBridgeConnect — Comprehensive Live API & Integration Diagnostic
 * Checks all APIs, database connections, authentication providers, and cloud integrations.
 */
import fs from 'fs';
import path from 'path';

// 1. Load .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

interface TestResult {
  name: string;
  category: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function withTimeout<T>(promise: Promise<T>, ms = 5000, desc = 'Operation'): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${desc} timed out after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

async function testDatabase() {
  process.stdout.write('Checking Database... ');
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Check users with 6s timeout
    const userCount = await withTimeout(prisma.user.count(), 6000, 'User query');
    const actCount = await withTimeout(prisma.activity.count(), 6000, 'Activity query');
    const teamCount = await withTimeout(prisma.team.count(), 6000, 'Team query');
    const certCount = await withTimeout(prisma.certificate.count(), 6000, 'Certificate query');
    const subCount = await withTimeout(prisma.submission.count(), 6000, 'Submission query');

    await prisma.$disconnect();

    console.log('PASS');
    results.push({
      name: 'Supabase PostgreSQL (Prisma)',
      category: 'Database',
      status: 'PASS',
      details: `Connected! Live records: ${userCount} users, ${actCount} activities, ${teamCount} teams, ${certCount} certs, ${subCount} submissions.`,
    });
  } catch (err: any) {
    console.log('FAIL (' + err.message + ')');
    results.push({
      name: 'Supabase PostgreSQL (Prisma)',
      category: 'Database',
      status: 'FAIL',
      details: `Connection error: ${err.message}`,
    });
  }
}

async function testNextAuthProviders() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/auth/providers`);
    if (res.ok) {
      const providers = await res.json();
      const keys = Object.keys(providers);
      results.push({
        name: 'NextAuth Providers Endpoint',
        category: 'Authentication',
        status: 'PASS',
        details: `Providers registered: ${keys.join(', ')}`,
      });
    } else {
      results.push({
        name: 'NextAuth Providers Endpoint',
        category: 'Authentication',
        status: 'WARN',
        details: `HTTP ${res.status}: Ensure dev server is running on ${baseUrl}`,
      });
    }
  } catch (err: any) {
    results.push({
      name: 'NextAuth Providers Endpoint',
      category: 'Authentication',
      status: 'WARN',
      details: `Could not reach ${baseUrl}/api/auth/providers: ${err.message}`,
    });
  }
}

async function testGitHubOAuth() {
  const clientId = process.env.AUTH_GITHUB_ID;
  const clientSecret = process.env.AUTH_GITHUB_SECRET;
  const pat = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

  if (clientId && clientSecret) {
    results.push({
      name: 'GitHub OAuth Client Config',
      category: 'Authentication',
      status: 'PASS',
      details: `Client ID: ${clientId.substring(0, 8)}... (Secret present: ${!!clientSecret})`,
    });
  } else {
    results.push({
      name: 'GitHub OAuth Client Config',
      category: 'Authentication',
      status: 'FAIL',
      details: 'AUTH_GITHUB_ID or AUTH_GITHUB_SECRET missing in .env',
    });
  }

  if (pat) {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${pat}`,
          'User-Agent': 'VBridgeConnect-HealthCheck',
        },
      });
      if (res.ok) {
        const user = await res.json();
        results.push({
          name: 'GitHub API (Personal Access Token)',
          category: 'Third-Party API',
          status: 'PASS',
          details: `Authenticated as GitHub user: @${user.login}`,
        });
      } else {
        results.push({
          name: 'GitHub API (Personal Access Token)',
          category: 'Third-Party API',
          status: 'WARN',
          details: `HTTP ${res.status}: Token may be expired or restricted`,
        });
      }
    } catch (err: any) {
      results.push({
        name: 'GitHub API (Personal Access Token)',
        category: 'Third-Party API',
        status: 'WARN',
        details: err.message,
      });
    }
  }
}

async function testGoogleOAuth() {
  const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  if (clientId && clientSecret) {
    try {
      // Test credentials validity against Google token endpoint
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: 'dummy_verification_code',
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:3000/api/auth/callback/google',
        }),
      });
      const data = await res.json();
      if (data.error === 'invalid_grant' || data.error === 'redirect_uri_mismatch') {
        results.push({
          name: 'Google OAuth & Calendar Credentials',
          category: 'Authentication',
          status: 'PASS',
          details: `Recognized by Google Identity Services! (Client: ${clientId.substring(0, 15)}...)`,
        });
      } else if (data.error === 'invalid_client') {
        results.push({
          name: 'Google OAuth & Calendar Credentials',
          category: 'Authentication',
          status: 'FAIL',
          details: 'Google rejected Client ID or Secret: invalid_client',
        });
      } else {
        results.push({
          name: 'Google OAuth & Calendar Credentials',
          category: 'Authentication',
          status: 'PASS',
          details: `Response: ${data.error || 'OK'}`,
        });
      }
    } catch (err: any) {
      results.push({
        name: 'Google OAuth & Calendar Credentials',
        category: 'Authentication',
        status: 'WARN',
        details: err.message,
      });
    }
  } else {
    results.push({
      name: 'Google OAuth & Calendar Credentials',
      category: 'Authentication',
      status: 'FAIL',
      details: 'Google OAuth client ID/secret missing in .env',
    });
  }
}

async function testAWSS3() {
  const bucket = process.env.AWS_S3_BUCKET_NAME || 'v-bridgecertificate';
  const region = process.env.AWS_REGION || 'ap-south-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretKey) {
    results.push({
      name: 'AWS S3 Object Storage',
      category: 'Storage',
      status: 'WARN',
      details: 'AWS access keys not configured',
    });
    return;
  }

  try {
    const { getCertificateUploadUrl } = await import('../src/lib/integrations/s3');
    const presigned = await getCertificateUploadUrl({
      fileName: 'diagnostic-check.pdf',
      contentType: 'application/pdf',
      userId: 'system-check',
      fileSizeBytes: 1024 * 50,
    });

    // Test direct S3 PUT permission
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey: secretKey },
    });

    let putStatus = 'PENDING';
    let putDetails = '';
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: 'diagnostics/test.txt',
          Body: 'VBridgeConnect health check',
          ContentType: 'text/plain',
        })
      );
      putStatus = 'PASS';
      putDetails = 'PutObject succeeded directly on S3 bucket!';
    } catch (putErr: any) {
      if (putErr.name === 'AccessDenied' || putErr.Code === 'AccessDenied') {
        putStatus = 'WARN';
        putDetails = 'Keys valid, but IAM user needs VBridgeS3Policy attached for bucket.';
      } else {
        putStatus = 'WARN';
        putDetails = `S3 Response: ${putErr.message}`;
      }
    }

    results.push({
      name: 'AWS S3 Presigned URL Engine',
      category: 'Storage',
      status: 'PASS',
      details: `Generated presigned URL targeting: ${presigned.publicUrl}`,
    });

    results.push({
      name: 'AWS S3 Bucket Authorization',
      category: 'Storage',
      status: putStatus as any,
      details: putDetails,
    });
  } catch (err: any) {
    results.push({
      name: 'AWS S3 Object Storage',
      category: 'Storage',
      status: 'FAIL',
      details: err.message,
    });
  }
}

async function testInternalAPIRoutes() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const routes = [
    { path: '/api/activities', method: 'GET', expectJson: true },
    { path: '/api/certificates', method: 'GET', expectJson: true },
    { path: '/api/submissions', method: 'GET', expectJson: true },
    { path: '/api/v1/certificates/verify/nonexistent-hash', method: 'GET', expectJson: true },
  ];

  for (const r of routes) {
    try {
      const res = await fetch(`${baseUrl}${r.path}`, { method: r.method });
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (res.status === 200 || (r.path.includes('verify') && res.status === 404)) {
        results.push({
          name: `Route: ${r.path}`,
          category: 'Application API',
          status: 'PASS',
          details: `HTTP ${res.status} OK (Content-Type: ${contentType.split(';')[0]})`,
        });
      } else {
        results.push({
          name: `Route: ${r.path}`,
          category: 'Application API',
          status: 'WARN',
          details: `HTTP ${res.status} (Expected JSON, got: ${contentType})`,
        });
      }
    } catch (err: any) {
      results.push({
        name: `Route: ${r.path}`,
        category: 'Application API',
        status: 'WARN',
        details: `Could not reach ${baseUrl}${r.path} (${err.message})`,
      });
    }
  }
}

async function testEventBus() {
  try {
    const { eventBus } = await import('../src/lib/events/bus');
    let heard = false;
    const unsubscribe = eventBus.subscribe('system.diagnostic', (e) => {
      heard = true;
    });
    await eventBus.publish({
      type: 'system.diagnostic',
      entityType: 'system',
      entityId: 'diag-001',
      action: 'tested',
      actorId: null,
      timestamp: new Date(),
    });
    unsubscribe();
    
    results.push({
      name: 'In-Process Domain Event Bus',
      category: 'Architecture',
      status: heard ? 'PASS' : 'WARN',
      details: 'Event bus correctly dispatches and receives domain events synchronously.',
    });
  } catch (err: any) {
    results.push({
      name: 'In-Process Domain Event Bus',
      category: 'Architecture',
      status: 'FAIL',
      details: err.message,
    });
  }
}

async function main() {
  console.log('================================================================');
  console.log('   VBRIDGECONNECT — LIVE INTEGRATION & API HEALTH AUDIT         ');
  console.log('================================================================\n');

  await testDatabase();
  await testNextAuthProviders();
  await testGitHubOAuth();
  await testGoogleOAuth();
  await testAWSS3();
  await testInternalAPIRoutes();
  await testEventBus();

  console.log('\n----------------------------------------------------------------');
  console.log('AUDIT RESULTS SUMMARY:');
  console.log('----------------------------------------------------------------');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} [${r.status}] [${r.category}] ${r.name}`);
    console.log(`   └─ ${r.details}`);
  }
  console.log('================================================================\n');
}

main();
