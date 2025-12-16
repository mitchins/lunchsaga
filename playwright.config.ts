import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for LunchSaga E2E tests
 * Tests run against the local Vite dev server with mock data
 */

const PORT = 5173; // Vite default port
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  
  // Maximum time one test can run for (30 seconds)
  timeout: 30 * 1000,
  
  // Expect timeout for assertions (5 seconds)
  expect: {
    timeout: 5 * 1000,
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: process.env.CI ? 'github' : 'html',
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || BASE_URL,
    
    // Maximum time for a single action (10 seconds)
    actionTimeout: 10 * 1000,
    
    // Maximum navigation time (15 seconds)  
    navigationTimeout: 15 * 1000,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local dev server before starting the tests
  // Runs both mock API and Vite dev server for E2E tests
  webServer: {
    command: 'npm run dev:e2e',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
