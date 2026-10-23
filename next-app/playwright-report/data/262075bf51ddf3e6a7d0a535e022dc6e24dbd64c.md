# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pwa-mobile-twa.spec.ts >> PWA & Android TWA Verification Suite >> 7. Standalone display mode authentication flow check
- Location: tests\pwa-mobile-twa.spec.ts:408:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e4]:
    - generic [ref=f1e5]:
      - generic [ref=f1e6]: V
      - heading "VBridgeConnect" [level=1] [ref=f1e7]
      - paragraph [ref=f1e8]: VIT Institutional Project, Mentorship & Collaboration Portal
    - generic [ref=f1e9]:
      - generic [ref=f1e10]:
        - strong [ref=f1e11]: "Notice:"
        - text: Invalid institutional credentials. Please check your email and password.
      - generic [ref=f1e12]:
        - button "VIT College" [ref=f1e13]
        - button "Superadmin" [ref=f1e18]
        - button "Industry Expert" [ref=f1e23]
      - generic [ref=f1e29]:
        - generic [ref=f1e30]:
          - generic [ref=f1e31]: Microsoft VIT Mail & Password
          - text: Sign in with your official
          - code [ref=f1e36]: "@vit.edu.in"
          - text: student or faculty mentor address. Teams and cohorts are securely loaded upon authentication.
        - generic [ref=f1e37]:
          - generic [ref=f1e38]: VIT Institutional Email
          - textbox "firstname.lastname@vit.edu.in" [ref=f1e43]: vedant.nikumbh@vit.edu.in
        - generic [ref=f1e44]:
          - generic [ref=f1e45]: Password
          - textbox "••••••••••••" [ref=f1e50]: Test1234!
        - button "Sign In to VIT Portal" [ref=f1e51]
    - paragraph [ref=f1e55]: Protected by institutional audit logging (FR-130).All actions are timestamped and signed.
  - button "Open Next.js Dev Tools" [ref=f1e61] [cursor=pointer]
  - alert [ref=f1e65]
```

# Test source

```ts
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
  429 |     // Fill in demo credentials
  430 |     const emailInput = page.locator('input[type="email"]');
  431 |     if (await emailInput.isVisible()) {
  432 |       await emailInput.fill('vedant.nikumbh@vit.edu.in');
  433 |       const passwordInput = page.locator('input[type="password"]');
  434 |       if (await passwordInput.isVisible()) {
  435 |         await passwordInput.fill('Test1234!');
  436 |       }
  437 |       const submitBtn = page.locator('button[type="submit"]');
  438 |       await submitBtn.click();
  439 | 
  440 |       // In standalone display mode, verify navigation completes to /dashboard without breaking
> 441 |       await page.waitForURL('**/dashboard', { timeout: 15000 });
      |                  ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  442 |       expect(page.url()).toContain('/dashboard');
  443 |     }
  444 |   });
  445 | });
  446 | 
```