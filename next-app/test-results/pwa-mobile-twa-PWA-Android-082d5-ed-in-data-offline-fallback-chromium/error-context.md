# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pwa-mobile-twa.spec.ts >> PWA & Android TWA Verification Suite >> 2. Service Worker strict no-cache for logged-in data & offline fallback
- Location: tests\pwa-mobile-twa.spec.ts:77:7

# Error details

```
PrismaClientInitializationError: 
Invalid `prisma.user.findFirst()` invocation in
C:\Users\Vedant\Downloads\V - Bridge connect\next-app\tests\pwa-mobile-twa.spec.ts:97:36

  94 expect(offlineHtml).toMatch(/You(&#x27;|')re Offline/);
  95 
  96 // C. Database mutation proof: Logged-in page NEVER served from stale cache
→ 97 const user = await prisma.user.findFirst(
Can't reach database server at `aws-0-ap-south-1.pooler.supabase.com:6543`

Please make sure your database server is running at `aws-0-ap-south-1.pooler.supabase.com:6543`.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import prisma from '../src/lib/db/prisma';
  3   | import fs from 'fs';
  4   | import path from 'path';
  5   | 
  6   | /**
  7   |  * ============================================================================
  8   |  * VBridgeConnect PWA & Android TWA Verification Suite
  9   |  * ============================================================================
  10  |  * Validates:
  11  |  * 1. PWA Manifest (start_url "/", maskable icon, theme colors, standalone)
  12  |  * 2. Service Worker non-caching (database mutation + refresh proof, offline page)
  13  |  * 3. Install UX (beforeinstallprompt, iOS Safari card, standalone suppression)
  14  |  * 4. Web Push VAPID endpoints & anti-spam PRD rules
  15  |  * 5. Mobile UI audit at 360x800 and 390x844 across all roles (zero horizontal scroll, 44px tap targets, table scroll containers)
  16  |  * 6. LiveKit on mobile (screen-share hidden on mobile platforms, orientation change)
  17  |  * 7. Android TWA Digital Asset Links (/.well-known/assetlinks.json)
  18  |  * 8. Standalone authentication flow verification
  19  |  * ============================================================================
  20  |  */
  21  | 
  22  | test.describe('PWA & Android TWA Verification Suite', () => {
  23  |   const screenshotsDir = path.resolve(process.cwd(), 'test-results/mobile-audit');
  24  | 
  25  |   test.beforeAll(() => {
  26  |     if (!fs.existsSync(screenshotsDir)) {
  27  |       fs.mkdirSync(screenshotsDir, { recursive: true });
  28  |     }
  29  |   });
  30  | 
  31  |   // --------------------------------------------------------------------------
  32  |   // 1. PWA Manifest & TWA Asset Links
  33  |   // --------------------------------------------------------------------------
  34  |   test('1. Manifest & Digital Asset Links Verification', async ({ request }) => {
  35  |     // A. Verify Manifest
  36  |     const manifestRes = await request.get('/manifest.webmanifest');
  37  |     expect(manifestRes.status()).toBe(200);
  38  |     const manifest = await manifestRes.json();
  39  | 
  40  |     expect(manifest.name).toContain('VBridgeConnect');
  41  |     expect(manifest.short_name).toBe('VBridge');
  42  |     expect(manifest.start_url).toBe('/');
  43  |     expect(manifest.display).toBe('standalone');
  44  |     expect(manifest.theme_color).toBe('#4F46E5');
  45  |     expect(manifest.background_color).toBe('#0F172A');
  46  | 
  47  |     // Verify icons: 192, 512, and maskable
  48  |     const icon192 = manifest.icons.find((i: any) => i.sizes === '192x192');
  49  |     const icon512 = manifest.icons.find((i: any) => i.sizes === '512x512' && i.purpose !== 'maskable');
  50  |     const iconMaskable = manifest.icons.find((i: any) => i.purpose === 'maskable');
  51  | 
  52  |     expect(icon192, '192x192 icon must be present').toBeDefined();
  53  |     expect(icon512, '512x512 icon must be present').toBeDefined();
  54  |     expect(iconMaskable, 'Maskable icon must be present for Android TWA').toBeDefined();
  55  |     expect(iconMaskable.src).toBe('/icon-maskable-512x512.png');
  56  | 
  57  |     // Verify icon physical availability
  58  |     const maskableIconRes = await request.get('/icon-maskable-512x512.png');
  59  |     expect(maskableIconRes.status()).toBe(200);
  60  | 
  61  |     // B. Verify /.well-known/assetlinks.json
  62  |     const assetlinksRes = await request.get('/.well-known/assetlinks.json');
  63  |     expect(assetlinksRes.status()).toBe(200);
  64  |     expect(assetlinksRes.headers()['content-type']).toContain('application/json');
  65  | 
  66  |     const assetlinks = await assetlinksRes.json();
  67  |     expect(Array.isArray(assetlinks)).toBe(true);
  68  |     expect(assetlinks[0].relation).toContain('delegate_permission/common.handle_all_urls');
  69  |     expect(assetlinks[0].target.namespace).toBe('android_app');
  70  |     expect(assetlinks[0].target.package_name).toBe(process.env.TWA_PACKAGE_NAME || 'in.edu.vit.vbridgeconnect');
  71  |     expect(assetlinks[0].target.sha256_cert_fingerprints.length).toBeGreaterThan(0);
  72  |   });
  73  | 
  74  |   // --------------------------------------------------------------------------
  75  |   // 2. Service Worker Strict No-Cache & Immutability Verification
  76  |   // --------------------------------------------------------------------------
  77  |   test('2. Service Worker strict no-cache for logged-in data & offline fallback', async ({
  78  |     page,
  79  |     request,
  80  |     context,
  81  |   }) => {
  82  |     // A. Verify sw.js is accessible
  83  |     const swRes = await request.get('/sw.js');
  84  |     expect(swRes.status()).toBe(200);
  85  |     const swContent = await swRes.text();
  86  |     expect(swContent).toContain('vbridge-static-v1');
  87  |     expect(swContent).toContain('SKIP_WAITING');
  88  |     expect(swContent).toContain('/offline');
  89  | 
  90  |     // B. Verify offline fallback page
  91  |     const offlineRes = await request.get('/offline');
  92  |     expect(offlineRes.status()).toBe(200);
  93  |     const offlineHtml = await offlineRes.text();
  94  |     expect(offlineHtml).toMatch(/You(&#x27;|')re Offline/);
  95  | 
  96  |     // C. Database mutation proof: Logged-in page NEVER served from stale cache
> 97  |     const user = await prisma.user.findFirst({ where: { email: 'vedant.nikumbh@vit.edu.in' } });
      |                                    ^ PrismaClientInitializationError: 
  98  |     const membership = await prisma.teamMembership.findFirst({
  99  |       where: { userId: user!.id },
  100 |       include: { team: true },
  101 |     });
  102 |     const testTeam = membership?.team || (await prisma.team.findFirst());
  103 |     const teamId = testTeam!.id;
  104 |     const originalTitle = testTeam?.projectTitle || 'V-Bridge Connect';
  105 |     const mutatedTitle = `Live DB Verification ${Date.now()}`;
  106 | 
  107 |     // 1. Authenticate as student
  108 |     await context.addCookies([
  109 |       {
  110 |         name: 'vbridge_demo_user',
  111 |         value: encodeURIComponent(JSON.stringify({ email: 'vedant.nikumbh@vit.edu.in', role: 'STUDENT' })),
  112 |         url: 'http://localhost:3000',
  113 |       },
  114 |     ]);
  115 | 
  116 |     // 2. Load dashboard page
  117 |     await Promise.all([
  118 |       page.waitForResponse((res) => res.url().includes('student/dashboard')),
  119 |       page.goto('/dashboard'),
  120 |     ]);
  121 |     await page.waitForLoadState('networkidle');
  122 | 
  123 |     // 3. Mutate the database row directly via Prisma
  124 |     await prisma.team.update({
  125 |       where: { id: teamId },
  126 |       data: { projectTitle: mutatedTitle },
  127 |     });
  128 | 
  129 |     // 4. Reload page and wait for fresh API response
  130 |     await Promise.all([
  131 |       page.waitForResponse((res) => res.url().includes('student/dashboard')),
  132 |       page.reload(),
  133 |     ]);
  134 | 
  135 |     // 5. Assert the mutated title appears immediately (proves no stale service worker cache for dynamic data)
  136 |     await expect(page.locator(`text=${mutatedTitle}`).first()).toBeVisible({ timeout: 10000 });
  137 | 
  138 |     // Restore original title
  139 |     await prisma.team.update({
  140 |       where: { id: teamId },
  141 |       data: { projectTitle: originalTitle },
  142 |     });
  143 |   });
  144 | 
  145 |   // --------------------------------------------------------------------------
  146 |   // 3. Install UX (Suppression in Standalone Mode & Prompts in Browser)
  147 |   // --------------------------------------------------------------------------
  148 |   test('3. Install UX: custom prompt logic and standalone mode suppression', async ({ page }) => {
  149 |     // A. Standalone Mode Test: When running in standalone display mode, prompt must be hidden
  150 |     await page.addInitScript(() => {
  151 |       Object.defineProperty(window, 'matchMedia', {
  152 |         writable: true,
  153 |         value: (query: string) => ({
  154 |           matches: query.includes('standalone'),
  155 |           media: query,
  156 |           onchange: null,
  157 |           addListener: () => {},
  158 |           removeListener: () => {},
  159 |           addEventListener: () => {},
  160 |           removeEventListener: () => {},
  161 |           dispatchEvent: () => false,
  162 |         }),
  163 |       });
  164 |     });
  165 | 
  166 |     await page.goto('/dashboard');
  167 |     await page.waitForLoadState('domcontentloaded');
  168 | 
  169 |     // Both Android and iOS prompts must NOT render in standalone mode
  170 |     const androidPrompt = page.locator('#pwa-android-install-prompt');
  171 |     const iosPrompt = page.locator('#pwa-ios-install-prompt');
  172 |     await expect(androidPrompt).toHaveCount(0);
  173 |     await expect(iosPrompt).toHaveCount(0);
  174 |   });
  175 | 
  176 |   // --------------------------------------------------------------------------
  177 |   // 4. Web Push VAPID API & PRD Anti-Spam Rule
  178 |   // --------------------------------------------------------------------------
  179 |   test('4. Web Push: VAPID endpoint registration and PRD anti-spam compliance', async ({
  180 |     request,
  181 |   }) => {
  182 |     // A. GET /api/v1/push/subscribe returns public key
  183 |     const pubKeyRes = await request.get('/api/v1/push/subscribe');
  184 |     expect(pubKeyRes.status()).toBe(200);
  185 |     const pubKeyJson = await pubKeyRes.json();
  186 |     expect(pubKeyJson.success).toBe(true);
  187 |     expect(pubKeyJson.publicKey).toBeTruthy();
  188 | 
  189 |     // B. Register mock subscription
  190 |     const mockEndpoint = `https://fcm.googleapis.com/fcm/send/test-sub-${Date.now()}`;
  191 |     const studentUser = { email: 'vedant.nikumbh@vit.edu.in', role: 'STUDENT' };
  192 | 
  193 |     const subRes = await request.post('/api/v1/push/subscribe', {
  194 |       headers: {
  195 |         Cookie: `vbridge_demo_user=${encodeURIComponent(JSON.stringify(studentUser))}`,
  196 |         'Content-Type': 'application/json',
  197 |       },
```