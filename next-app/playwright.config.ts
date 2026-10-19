import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E & Database Audit Suite Configuration
 * Targets local Next.js instance on http://localhost:3000
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1, // Run sequentially to avoid database race conditions during audit tests
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/summary.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
