import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure', browserName: 'chromium' },
  webServer: { command: 'pnpm preview --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
