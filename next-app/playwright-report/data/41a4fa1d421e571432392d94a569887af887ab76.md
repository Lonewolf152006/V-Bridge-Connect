# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pwa-mobile-twa.spec.ts >> PWA & Android TWA Verification Suite >> 6. LiveKit: screen-share hidden on mobile platforms and orientation handling
- Location: tests\pwa-mobile-twa.spec.ts:313:7

# Error details

```
PrismaClientInitializationError: 
Invalid `prisma.team.findFirst()` invocation in
C:\Users\Vedant\Downloads\V - Bridge connect\next-app\tests\pwa-mobile-twa.spec.ts:328:36

  325   },
  326 ]);
  327 
→ 328 const team = await prisma.team.findFirst(
Can't reach database server at `aws-0-ap-south-1.pooler.supabase.com:6543`

Please make sure your database server is running at `aws-0-ap-south-1.pooler.supabase.com:6543`.
```

# Test source

```ts
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
  285 |           }
  286 |         }
  287 |         expect(checkedCount).toBeGreaterThan(0);
  288 | 
  289 |         // C. Wide tables must have self-contained horizontal scrolling container
  290 |         const tables = page.locator('table:visible');
  291 |         const tableCount = await tables.count();
  292 |         if (tableCount > 0) {
  293 |           const isContained = await tables.first().evaluate((table) => {
  294 |             const parent = table.parentElement;
  295 |             if (!parent) return false;
  296 |             const overflow = window.getComputedStyle(parent).overflowX;
  297 |             return overflow === 'auto' || overflow === 'scroll' || parent.classList.contains('overflow-x-auto');
  298 |           });
  299 |           expect(isContained, 'Wide tables must be wrapped in overflow-x-auto container').toBe(true);
  300 |         }
  301 | 
  302 |         // D. Capture mobile screenshot for verification artifact
  303 |         const screenshotPath = path.join(screenshotsDir, `${r.role.toLowerCase()}-${vp.name}.png`);
  304 |         await page.screenshot({ path: screenshotPath, fullPage: false });
  305 |         expect(fs.existsSync(screenshotPath)).toBe(true);
  306 |       });
  307 |     }
  308 |   }
  309 | 
  310 |   // --------------------------------------------------------------------------
  311 |   // 6. LiveKit on Mobile: Platform Check Hides Screen Share
  312 |   // --------------------------------------------------------------------------
  313 |   test('6. LiveKit: screen-share hidden on mobile platforms and orientation handling', async ({
  314 |     page,
  315 |     context,
  316 |   }) => {
  317 |     // 1. Desktop Platform Emulation: Screen-share control must be visible
  318 |     await page.setViewportSize({ width: 1280, height: 720 });
  319 |     await context.addCookies([
  320 |       {
  321 |         name: 'vbridge_demo_user',
  322 |         value: encodeURIComponent(JSON.stringify({ email: 'sheetal.patil@vit.edu.in', role: 'COORDINATOR' })),
  323 |         domain: 'localhost',
  324 |         path: '/',
  325 |       },
  326 |     ]);
  327 | 
> 328 |     const team = await prisma.team.findFirst({ select: { id: true } });
      |                                    ^ PrismaClientInitializationError: 
  329 |     const teamId = team?.id || 'team-mini-1';
  330 | 
  331 |     await page.goto(`/projects/${teamId}`);
  332 |     await page.waitForLoadState('networkidle');
  333 | 
  334 |     // Switch to meetings tab
  335 |     const meetingsTab = page.locator('button:has-text("Mentor Sync & Meet")');
  336 |     if (await meetingsTab.isVisible()) {
  337 |       await meetingsTab.click();
  338 |     }
  339 | 
  340 |     // Launch Live Room on desktop
  341 |     const launchBtn = page.locator('#btn-launch-live-room');
  342 |     if (await launchBtn.isVisible()) {
  343 |       await launchBtn.click();
  344 |       await page.waitForSelector('#livekit-meeting-room');
  345 | 
  346 |       // Desktop must show screen-share button
  347 |       const desktopScreenShare = page.locator('#btn-desktop-screen-share');
  348 |       await expect(desktopScreenShare).toBeVisible();
  349 | 
  350 |       // Close modal
  351 |       const closeBtn = page.locator('button[aria-label="Leave Meeting Room"]');
  352 |       if (await closeBtn.isVisible()) await closeBtn.click();
  353 |     }
  354 | 
  355 |     // 2. Mobile Platform Emulation: Screen-share control must be strictly HIDDEN
  356 |     // Mobile Chrome UA string:
  357 |     const mobileUA =
  358 |       'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
  359 | 
  360 |     const mobileContext = await page.context().browser()?.newContext({
  361 |       userAgent: mobileUA,
  362 |       viewport: { width: 390, height: 844 },
  363 |     });
  364 | 
  365 |     if (mobileContext) {
  366 |       const mobilePage = await mobileContext.newPage();
  367 |       await mobileContext.addCookies([
  368 |         {
  369 |           name: 'vbridge_demo_user',
  370 |           value: encodeURIComponent(JSON.stringify({ email: 'sheetal.patil@vit.edu.in', role: 'COORDINATOR' })),
  371 |           domain: 'localhost',
  372 |           path: '/',
  373 |         },
  374 |       ]);
  375 | 
  376 |       await mobilePage.goto(`/projects/${teamId}`);
  377 |       await mobilePage.waitForLoadState('networkidle');
  378 | 
  379 |       const mobileMeetingsTab = mobilePage.locator('button:has-text("Mentor Sync & Meet")');
  380 |       if (await mobileMeetingsTab.isVisible()) {
  381 |         await mobileMeetingsTab.click();
  382 |       }
  383 | 
  384 |       const mobileLaunchBtn = mobilePage.locator('#btn-launch-live-room');
  385 |       if (await mobileLaunchBtn.isVisible()) {
  386 |         await mobileLaunchBtn.click();
  387 |         await mobilePage.waitForSelector('#livekit-meeting-room');
  388 | 
  389 |         // On mobile platform, screen-share button MUST be absent
  390 |         const mobileScreenShare = mobilePage.locator('#btn-desktop-screen-share');
  391 |         await expect(mobileScreenShare).toHaveCount(0);
  392 | 
  393 |         // Test orientation change (switch to landscape 844x390)
  394 |         await mobilePage.setViewportSize({ width: 844, height: 390 });
  395 |         await mobilePage.waitForTimeout(300);
  396 | 
  397 |         const videoGrid = mobilePage.locator('#livekit-meeting-room .grid');
  398 |         await expect(videoGrid).toHaveClass(/grid-cols-2/);
  399 |       }
  400 | 
  401 |       await mobileContext.close();
  402 |     }
  403 |   });
  404 | 
  405 |   // --------------------------------------------------------------------------
  406 |   // 7. Standalone Display Mode Authentication Flow Check
  407 |   // --------------------------------------------------------------------------
  408 |   test('7. Standalone display mode authentication flow check', async ({ page }) => {
  409 |     // Launch app simulating standalone display mode
  410 |     await page.addInitScript(() => {
  411 |       Object.defineProperty(window, 'matchMedia', {
  412 |         writable: true,
  413 |         value: (query: string) => ({
  414 |           matches: query.includes('standalone'),
  415 |           media: query,
  416 |           onchange: null,
  417 |           addListener: () => {},
  418 |           removeListener: () => {},
  419 |           addEventListener: () => {},
  420 |           removeEventListener: () => {},
  421 |           dispatchEvent: () => false,
  422 |         }),
  423 |       });
  424 |     });
  425 | 
  426 |     await page.goto('/login');
  427 |     await page.waitForLoadState('networkidle');
  428 | 
```