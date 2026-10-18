import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for Booth.
 * Tests desktop and mobile viewports with Chromium and WebKit.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'desktop-webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-webkit',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @booth/api start',
      url: 'http://localhost:3000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        DATABASE_URL:
          process.env.DATABASE_URL ??
          process.env.DATABASE_URL_TEST ??
          'postgresql://booth:booth@localhost:5432/booth_dev?schema=public',
        JWT_ACCESS_SECRET:
          process.env.JWT_ACCESS_SECRET ??
          'Oko9AEnZMMjUkImGgbzFu6TK0H4Gjm70k58-qm8V-J6vDXrpN-sxsg5pRXfAAfIm',
        CORS_ORIGINS: process.env.CORS_ORIGINS ?? 'http://localhost:5173',
        WEB_PUBLIC_URL: process.env.WEB_PUBLIC_URL ?? 'http://localhost:5173',
        PORT: process.env.PORT ?? '3000',
        NODE_ENV: process.env.NODE_ENV ?? 'test',
      },
    },
    {
      command: 'pnpm --filter @booth/web dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
