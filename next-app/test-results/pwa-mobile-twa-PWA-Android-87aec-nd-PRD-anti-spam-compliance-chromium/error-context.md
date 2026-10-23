# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pwa-mobile-twa.spec.ts >> PWA & Android TWA Verification Suite >> 4. Web Push: VAPID endpoint registration and PRD anti-spam compliance
- Location: tests\pwa-mobile-twa.spec.ts:179:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 401
```

# Test source

```ts
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
  97  |     const user = await prisma.user.findFirst({ where: { email: 'vedant.nikumbh@vit.edu.in' } });
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
> 184 |     expect(pubKeyRes.status()).toBe(200);
      |                                ^ Error: expect(received).toBe(expected) // Object.is equality
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
  198 |       data: {
  199 |         subscription: {
  200 |           endpoint: mockEndpoint,
  201 |           keys: {
  202 |             p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9t0484BhOJByScTOACCheRzp0-S4EPC0UrQfiXyVUfBRhk',
  203 |             auth: 'tBHItJI5svbpez7KI4CCXg',
  204 |           },
  205 |         },
  206 |         userAgent: 'Playwright Android Emulation',
  207 |       },
  208 |     });
  209 | 
  210 |     expect(subRes.status()).toBe(200);
  211 |     const subJson = await subRes.json();
  212 |     expect(subJson.success).toBe(true);
  213 | 
  214 |     // Verify stored in PostgreSQL push_subscriptions
  215 |     const dbSub = await prisma.pushSubscription.findUnique({
  216 |       where: { endpoint: mockEndpoint },
  217 |     });
  218 |     expect(dbSub).not.toBeNull();
  219 |     expect(dbSub!.endpoint).toBe(mockEndpoint);
  220 | 
  221 |     // Clean up mock subscription
  222 |     await prisma.pushSubscription.delete({ where: { endpoint: mockEndpoint } });
  223 |   });
  224 | 
  225 |   // --------------------------------------------------------------------------
  226 |   // 5. Mobile UI Audit at 360x800 and 390x844 for Every Role
  227 |   // --------------------------------------------------------------------------
  228 |   const viewports = [
  229 |     { name: 'android-360x800', width: 360, height: 800 },
  230 |     { name: 'iphone-390x844', width: 390, height: 844 },
  231 |   ];
  232 | 
  233 |   const roles = [
  234 |     { role: 'STUDENT', email: 'vedant.nikumbh@vit.edu.in', path: '/dashboard' },
  235 |     { role: 'COORDINATOR', email: 'sheetal.patil@vit.edu.in', path: '/mentor/dashboard' },
  236 |     { role: 'SUPER_ADMIN', email: 'admin@vbridge.com', path: '/admin/reports' },
  237 |     { role: 'INDUSTRY_PARTNER', email: 'expert@industry.com', path: '/dashboard' },
  238 |   ];
  239 | 
  240 |   for (const vp of viewports) {
  241 |     for (const r of roles) {
  242 |       test(`5. Mobile UI Audit: ${r.role} on ${vp.name} (${vp.width}x${vp.height})`, async ({
  243 |         page,
  244 |         context,
  245 |       }) => {
  246 |         await page.setViewportSize({ width: vp.width, height: vp.height });
  247 | 
  248 |         await context.addCookies([
  249 |           {
  250 |             name: 'vbridge_demo_user',
  251 |             value: encodeURIComponent(JSON.stringify({ email: r.email, role: r.role })),
  252 |             domain: 'localhost',
  253 |             path: '/',
  254 |           },
  255 |         ]);
  256 | 
  257 |         await page.goto(r.path);
  258 |         await page.waitForLoadState('networkidle');
  259 | 
  260 |         // A. Assert ZERO horizontal page overflow
  261 |         const hasHorizontalScroll = await page.evaluate(() => {
  262 |           const doc = document.documentElement;
  263 |           return doc.scrollWidth > window.innerWidth;
  264 |         });
  265 |         expect(
  266 |           hasHorizontalScroll,
  267 |           `Horizontal scroll detected on ${r.path} for ${r.role} on ${vp.name}!`
  268 |         ).toBe(false);
  269 | 
  270 |         // B. Tap Targets: Verify interactive buttons have min 44px tap target height
  271 |         const buttons = page.locator('button:visible');
  272 |         const count = await buttons.count();
  273 |         let checkedCount = 0;
  274 | 
  275 |         for (let i = 0; i < Math.min(count, 8); i++) {
  276 |           const btn = buttons.nth(i);
  277 |           const box = await btn.boundingBox();
  278 |           if (box && box.height > 0) {
  279 |             // Must satisfy 44px minimum tap target or be styled appropriately
  280 |             expect(
  281 |               box.height,
  282 |               `Button on ${r.path} failed 44px tap target check (actual: ${box.height}px)`
  283 |             ).toBeGreaterThanOrEqual(32); // accounts for compact icon buttons with padding
  284 |             checkedCount++;
```