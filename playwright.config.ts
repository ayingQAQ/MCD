import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure', browserName: 'chromium', locale: 'zh-CN', timezoneId: 'Asia/Shanghai' },
  webServer: { command: 'node dist/serve.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
