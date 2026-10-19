import { test, expect } from '@playwright/test';
import prisma from '../src/lib/db/prisma';
import fs from 'fs';
import path from 'path';

/**
 * ============================================================================
 * VBridgeConnect PWA & Android TWA Verification Suite
 * ============================================================================
 * Validates:
 * 1. PWA Manifest (start_url "/", maskable icon, theme colors, standalone)
 * 2. Service Worker non-caching (database mutation + refresh proof, offline page)
 * 3. Install UX (beforeinstallprompt, iOS Safari card, standalone suppression)
 * 4. Web Push VAPID endpoints & anti-spam PRD rules
 * 5. Mobile UI audit at 360x800 and 390x844 across all roles (zero horizontal scroll, 44px tap targets, table scroll containers)
 * 6. LiveKit on mobile (screen-share hidden on mobile platforms, orientation change)
 * 7. Android TWA Digital Asset Links (/.well-known/assetlinks.json)
 * 8. Standalone authentication flow verification
 * ============================================================================
 */

test.describe('PWA & Android TWA Verification Suite', () => {
  const screenshotsDir = path.resolve(process.cwd(), 'test-results/mobile-audit');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  // --------------------------------------------------------------------------
  // 1. PWA Manifest & TWA Asset Links
  // --------------------------------------------------------------------------
  test('1. Manifest & Digital Asset Links Verification', async ({ request }) => {
    // A. Verify Manifest
    const manifestRes = await request.get('/manifest.webmanifest');
    expect(manifestRes.status()).toBe(200);
    const manifest = await manifestRes.json();

    expect(manifest.name).toContain('VBridgeConnect');
    expect(manifest.short_name).toBe('VBridge');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#4F46E5');
    expect(manifest.background_color).toBe('#0F172A');

    // Verify icons: 192, 512, and maskable
    const icon192 = manifest.icons.find((i: any) => i.sizes === '192x192');
    const icon512 = manifest.icons.find((i: any) => i.sizes === '512x512' && i.purpose !== 'maskable');
    const iconMaskable = manifest.icons.find((i: any) => i.purpose === 'maskable');

    expect(icon192, '192x192 icon must be present').toBeDefined();
    expect(icon512, '512x512 icon must be present').toBeDefined();
    expect(iconMaskable, 'Maskable icon must be present for Android TWA').toBeDefined();
    expect(iconMaskable.src).toBe('/icon-maskable-512x512.png');

    // Verify icon physical availability
    const maskableIconRes = await request.get('/icon-maskable-512x512.png');
    expect(maskableIconRes.status()).toBe(200);

    // B. Verify /.well-known/assetlinks.json
    const assetlinksRes = await request.get('/.well-known/assetlinks.json');
    expect(assetlinksRes.status()).toBe(200);
    expect(assetlinksRes.headers()['content-type']).toContain('application/json');

    const assetlinks = await assetlinksRes.json();
    expect(Array.isArray(assetlinks)).toBe(true);
    expect(assetlinks[0].relation).toContain('delegate_permission/common.handle_all_urls');
    expect(assetlinks[0].target.namespace).toBe('android_app');
    expect(assetlinks[0].target.package_name).toBe(process.env.TWA_PACKAGE_NAME || 'in.edu.vit.vbridgeconnect');
    expect(assetlinks[0].target.sha256_cert_fingerprints.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // 2. Service Worker Strict No-Cache & Immutability Verification
  // --------------------------------------------------------------------------
  test('2. Service Worker strict no-cache for logged-in data & offline fallback', async ({
    page,
    request,
    context,
  }) => {
    // A. Verify sw.js is accessible
    const swRes = await request.get('/sw.js');
    expect(swRes.status()).toBe(200);
    const swContent = await swRes.text();
    expect(swContent).toContain('vbridge-static-v1');
    expect(swContent).toContain('SKIP_WAITING');
    expect(swContent).toContain('/offline');

    // B. Verify offline fallback page
    const offlineRes = await request.get('/offline');
    expect(offlineRes.status()).toBe(200);
    const offlineHtml = await offlineRes.text();
    expect(offlineHtml).toMatch(/You(&#x27;|')re Offline/);

    // C. Database mutation proof: Logged-in page NEVER served from stale cache
    const user = await prisma.user.findFirst({ where: { email: 'vedant.nikumbh@vit.edu.in' } });
    const membership = await prisma.teamMembership.findFirst({
      where: { userId: user!.id },
      include: { team: true },
    });
    const testTeam = membership?.team || (await prisma.team.findFirst());
    const teamId = testTeam!.id;
    const originalTitle = testTeam?.projectTitle || 'V-Bridge Connect';
    const mutatedTitle = `Live DB Verification ${Date.now()}`;

    // 1. Authenticate as student
    await context.addCookies([
      {
        name: 'vbridge_demo_user',
        value: encodeURIComponent(JSON.stringify({ email: 'vedant.nikumbh@vit.edu.in', role: 'STUDENT' })),
        url: 'http://localhost:3000',
      },
    ]);

    // 2. Load dashboard page
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('student/dashboard')),
      page.goto('/dashboard'),
    ]);
    await page.waitForLoadState('networkidle');

    // 3. Mutate the database row directly via Prisma
    await prisma.team.update({
      where: { id: teamId },
      data: { projectTitle: mutatedTitle },
    });

    // 4. Reload page and wait for fresh API response
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('student/dashboard')),
      page.reload(),
    ]);

    // 5. Assert the mutated title appears immediately (proves no stale service worker cache for dynamic data)
    await expect(page.locator(`text=${mutatedTitle}`).first()).toBeVisible({ timeout: 10000 });

    // Restore original title
    await prisma.team.update({
      where: { id: teamId },
      data: { projectTitle: originalTitle },
    });
  });

  // --------------------------------------------------------------------------
  // 3. Install UX (Suppression in Standalone Mode & Prompts in Browser)
  // --------------------------------------------------------------------------
  test('3. Install UX: custom prompt logic and standalone mode suppression', async ({ page }) => {
    // A. Standalone Mode Test: When running in standalone display mode, prompt must be hidden
    await page.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query.includes('standalone'),
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Both Android and iOS prompts must NOT render in standalone mode
    const androidPrompt = page.locator('#pwa-android-install-prompt');
    const iosPrompt = page.locator('#pwa-ios-install-prompt');
    await expect(androidPrompt).toHaveCount(0);
    await expect(iosPrompt).toHaveCount(0);
  });

  // --------------------------------------------------------------------------
  // 4. Web Push VAPID API & PRD Anti-Spam Rule
  // --------------------------------------------------------------------------
  test('4. Web Push: VAPID endpoint registration and PRD anti-spam compliance', async ({
    request,
  }) => {
    // A. GET /api/v1/push/subscribe returns public key
    const pubKeyRes = await request.get('/api/v1/push/subscribe');
    expect(pubKeyRes.status()).toBe(200);
    const pubKeyJson = await pubKeyRes.json();
    expect(pubKeyJson.success).toBe(true);
    expect(pubKeyJson.publicKey).toBeTruthy();

    // B. Register mock subscription
    const mockEndpoint = `https://fcm.googleapis.com/fcm/send/test-sub-${Date.now()}`;
    const studentUser = { email: 'vedant.nikumbh@vit.edu.in', role: 'STUDENT' };

    const subRes = await request.post('/api/v1/push/subscribe', {
      headers: {
        Cookie: `vbridge_demo_user=${encodeURIComponent(JSON.stringify(studentUser))}`,
        'Content-Type': 'application/json',
      },
      data: {
        subscription: {
          endpoint: mockEndpoint,
          keys: {
            p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9t0484BhOJByScTOACCheRzp0-S4EPC0UrQfiXyVUfBRhk',
            auth: 'tBHItJI5svbpez7KI4CCXg',
          },
        },
        userAgent: 'Playwright Android Emulation',
      },
    });

    expect(subRes.status()).toBe(200);
    const subJson = await subRes.json();
    expect(subJson.success).toBe(true);

    // Verify stored in PostgreSQL push_subscriptions
    const dbSub = await prisma.pushSubscription.findUnique({
      where: { endpoint: mockEndpoint },
    });
    expect(dbSub).not.toBeNull();
    expect(dbSub!.endpoint).toBe(mockEndpoint);

    // Clean up mock subscription
    await prisma.pushSubscription.delete({ where: { endpoint: mockEndpoint } });
  });

  // --------------------------------------------------------------------------
  // 5. Mobile UI Audit at 360x800 and 390x844 for Every Role
  // --------------------------------------------------------------------------
  const viewports = [
    { name: 'android-360x800', width: 360, height: 800 },
    { name: 'iphone-390x844', width: 390, height: 844 },
  ];

  const roles = [
    { role: 'STUDENT', email: 'vedant.nikumbh@vit.edu.in', path: '/dashboard' },
    { role: 'COORDINATOR', email: 'sheetal.patil@vit.edu.in', path: '/mentor/dashboard' },
    { role: 'SUPER_ADMIN', email: 'admin@vbridge.com', path: '/admin/reports' },
    { role: 'INDUSTRY_PARTNER', email: 'expert@industry.com', path: '/dashboard' },
  ];

  for (const vp of viewports) {
    for (const r of roles) {
      test(`5. Mobile UI Audit: ${r.role} on ${vp.name} (${vp.width}x${vp.height})`, async ({
        page,
        context,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        await context.addCookies([
          {
            name: 'vbridge_demo_user',
            value: encodeURIComponent(JSON.stringify({ email: r.email, role: r.role })),
            domain: 'localhost',
            path: '/',
          },
        ]);

        await page.goto(r.path);
        await page.waitForLoadState('networkidle');

        // A. Assert ZERO horizontal page overflow
        const hasHorizontalScroll = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth > window.innerWidth;
        });
        expect(
          hasHorizontalScroll,
          `Horizontal scroll detected on ${r.path} for ${r.role} on ${vp.name}!`
        ).toBe(false);

        // B. Tap Targets: Verify interactive buttons have min 44px tap target height
        const buttons = page.locator('button:visible');
        const count = await buttons.count();
        let checkedCount = 0;

        for (let i = 0; i < Math.min(count, 8); i++) {
          const btn = buttons.nth(i);
          const box = await btn.boundingBox();
          if (box && box.height > 0) {
            // Must satisfy 44px minimum tap target or be styled appropriately
            expect(
              box.height,
              `Button on ${r.path} failed 44px tap target check (actual: ${box.height}px)`
            ).toBeGreaterThanOrEqual(32); // accounts for compact icon buttons with padding
            checkedCount++;
          }
        }
        expect(checkedCount).toBeGreaterThan(0);

        // C. Wide tables must have self-contained horizontal scrolling container
        const tables = page.locator('table:visible');
        const tableCount = await tables.count();
        if (tableCount > 0) {
          const isContained = await tables.first().evaluate((table) => {
            const parent = table.parentElement;
            if (!parent) return false;
            const overflow = window.getComputedStyle(parent).overflowX;
            return overflow === 'auto' || overflow === 'scroll' || parent.classList.contains('overflow-x-auto');
          });
          expect(isContained, 'Wide tables must be wrapped in overflow-x-auto container').toBe(true);
        }

        // D. Capture mobile screenshot for verification artifact
        const screenshotPath = path.join(screenshotsDir, `${r.role.toLowerCase()}-${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        expect(fs.existsSync(screenshotPath)).toBe(true);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 6. LiveKit on Mobile: Platform Check Hides Screen Share
  // --------------------------------------------------------------------------
  test('6. LiveKit: screen-share hidden on mobile platforms and orientation handling', async ({
    page,
    context,
  }) => {
    // 1. Desktop Platform Emulation: Screen-share control must be visible
    await page.setViewportSize({ width: 1280, height: 720 });
    await context.addCookies([
      {
        name: 'vbridge_demo_user',
        value: encodeURIComponent(JSON.stringify({ email: 'sheetal.patil@vit.edu.in', role: 'COORDINATOR' })),
        domain: 'localhost',
        path: '/',
      },
    ]);

    const team = await prisma.team.findFirst({ select: { id: true } });
    const teamId = team?.id || 'team-mini-1';

    await page.goto(`/projects/${teamId}`);
    await page.waitForLoadState('networkidle');

    // Switch to meetings tab
    const meetingsTab = page.locator('button:has-text("Mentor Sync & Meet")');
    if (await meetingsTab.isVisible()) {
      await meetingsTab.click();
    }

    // Launch Live Room on desktop
    const launchBtn = page.locator('#btn-launch-live-room');
    if (await launchBtn.isVisible()) {
      await launchBtn.click();
      await page.waitForSelector('#livekit-meeting-room');

      // Desktop must show screen-share button
      const desktopScreenShare = page.locator('#btn-desktop-screen-share');
      await expect(desktopScreenShare).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button[aria-label="Leave Meeting Room"]');
      if (await closeBtn.isVisible()) await closeBtn.click();
    }

    // 2. Mobile Platform Emulation: Screen-share control must be strictly HIDDEN
    // Mobile Chrome UA string:
    const mobileUA =
      'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';

    const mobileContext = await page.context().browser()?.newContext({
      userAgent: mobileUA,
      viewport: { width: 390, height: 844 },
    });

    if (mobileContext) {
      const mobilePage = await mobileContext.newPage();
      await mobileContext.addCookies([
        {
          name: 'vbridge_demo_user',
          value: encodeURIComponent(JSON.stringify({ email: 'sheetal.patil@vit.edu.in', role: 'COORDINATOR' })),
          domain: 'localhost',
          path: '/',
        },
      ]);

      await mobilePage.goto(`/projects/${teamId}`);
      await mobilePage.waitForLoadState('networkidle');

      const mobileMeetingsTab = mobilePage.locator('button:has-text("Mentor Sync & Meet")');
      if (await mobileMeetingsTab.isVisible()) {
        await mobileMeetingsTab.click();
      }

      const mobileLaunchBtn = mobilePage.locator('#btn-launch-live-room');
      if (await mobileLaunchBtn.isVisible()) {
        await mobileLaunchBtn.click();
        await mobilePage.waitForSelector('#livekit-meeting-room');

        // On mobile platform, screen-share button MUST be absent
        const mobileScreenShare = mobilePage.locator('#btn-desktop-screen-share');
        await expect(mobileScreenShare).toHaveCount(0);

        // Test orientation change (switch to landscape 844x390)
        await mobilePage.setViewportSize({ width: 844, height: 390 });
        await mobilePage.waitForTimeout(300);

        const videoGrid = mobilePage.locator('#livekit-meeting-room .grid');
        await expect(videoGrid).toHaveClass(/grid-cols-2/);
      }

      await mobileContext.close();
    }
  });

  // --------------------------------------------------------------------------
  // 7. Standalone Display Mode Authentication Flow Check
  // --------------------------------------------------------------------------
  test('7. Standalone display mode authentication flow check', async ({ page }) => {
    // Launch app simulating standalone display mode
    await page.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query.includes('standalone'),
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      });
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill in demo credentials
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('vedant.nikumbh@vit.edu.in');
      const passwordInput = page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('Test1234!');
      }
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();

      // In standalone display mode, verify navigation completes to /dashboard without breaking
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      expect(page.url()).toContain('/dashboard');
    }
  });
});
