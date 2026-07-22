import { defineConfig } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:8080';
const backendHealth = process.env.BACKEND_HEALTH_URL || 'http://localhost:5125/health/ready';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm dev:backend',
      url: backendHealth,
      reuseExistingServer: true,
      timeout: 120000,
      cwd: '..',
    },
    {
      command: 'pnpm dev:frontend',
      url: baseURL,
      reuseExistingServer: true,
      timeout: 120000,
      cwd: '..',
    },
  ],
});
