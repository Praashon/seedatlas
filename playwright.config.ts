import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/end-to-end',
  timeout: 40000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:5174', channel: 'chrome', trace: 'retain-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1050 } } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  webServer: { command: 'npm run dev --workspace @seedatlas/web -- --port 5174 --strictPort', url: 'http://127.0.0.1:5174', reuseExistingServer: !process.env.CI },
});
