const http = require('http');

async function testRoute(path, cookie) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path,
        method: 'GET',
        headers: {
          Cookie: cookie || '',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            location: res.headers.location,
            body,
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const fakeDemoCookie =
    'vbridge_demo_user=' +
    Buffer.from(JSON.stringify({ id: 'user-admin-001', email: 'admin@vbridge.com', role: 'super_admin' })).toString('base64');

  console.log('[Security Audit] Testing demo cookie bypass with:', fakeDemoCookie);

  // Test 1: Page access to /dashboard with demo cookie
  const pageRes = await testRoute('/dashboard', fakeDemoCookie);
  console.log('GET /dashboard -> Status:', pageRes.statusCode, 'Location:', pageRes.location);
  if (pageRes.statusCode === 200 && !pageRes.body.includes('Sign in')) {
    console.error('❌ SECURITY FAILURE: Demo cookie granted access to /dashboard!');
    process.exit(1);
  }
  console.log('✔ Protected page /dashboard correctly denied access (redirected to login or unauthenticated).');

  // Test 2: Protected API /api/v1/teams with demo cookie
  const apiRes = await testRoute('/api/v1/teams', fakeDemoCookie);
  console.log('GET /api/v1/teams -> Status:', apiRes.statusCode);
  if (apiRes.statusCode === 200) {
    console.error('❌ SECURITY FAILURE: Demo cookie granted access to /api/v1/teams!');
    process.exit(1);
  }
  console.log('✔ Protected API /api/v1/teams correctly denied access with status:', apiRes.statusCode);

  console.log('\n✔ PHASE A SECURITY GATE PASSED: Demo cookie bypass grants zero access.');
}

run().catch((err) => {
  console.error('Test execution error:', err.message);
  process.exit(1);
});
