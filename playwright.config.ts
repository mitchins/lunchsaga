import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for LunchSaga E2E tests
 * Tests run against the local Vite dev server with mock data
 */

const PORT = 5173; // Vite default port
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  
  // Maximum time one test can run for (60 seconds for CI stability)
  timeout: process.env.CI ? 60 * 1000 : 30 * 1000,
  
  // Expect timeout for assertions (5 seconds)
  expect: {
    timeout: 5 * 1000,
  },
  
  // Run tests in files in parallel locally, but respect --workers flag in CI
  fullyParallel: !process.env.CI,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // No retries on CI to debug issues faster
  retries: 0,
  
  // Workers: respect CLI flag in CI (--workers=2), single locally for fast feedback
  workers: process.env.CI ? undefined : 1,
  
  // Reporter to use
  reporter: process.env.CI ? [['github'], ['html']] : 'html',
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || BASE_URL,
    
    // Maximum time for a single action (10 seconds)
    actionTimeout: 10 * 1000,
    
    // Maximum navigation time (20 seconds for CI)
    navigationTimeout: process.env.CI ? 20 * 1000 : 15 * 1000,
    
    // Collect trace on failure for debugging CI issues
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure (useful for CI debugging)
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
    reuseExistingServer: !process.env.CI, // Reuse locally (faster), restart in CI (reliability)
    timeout: process.env.CI ? 120000 : 60000,
    stdout: 'ignore', // Suppress verbose output
    stderr: 'pipe', // Always capture errors
  },
});
