import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/production',
  timeout: 40000,
  expect: { timeout: 15000 },
  use: { baseURL: 'http://127.0.0.1:5185', channel: 'chrome', viewport: { width: 1440, height: 1050 } },
  webServer: { command: 'npm run preview --workspace @seedatlas/web -- --port 5185 --strictPort', url: 'http://127.0.0.1:5185', reuseExistingServer: false },
});
