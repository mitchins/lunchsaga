import { test as base, expect } from '@playwright/test';
import { quickLogin } from './helpers';

/**
 * Worker-scoped authenticated fixture for E2E tests
 * 
 * This fixture performs login once per worker, reusing auth state across tests.
 * Dramatically reduces per-test setup overhead on 2+ workers.
 * 
 * Usage:
 * test('my test', async ({ authenticatedPage }) => {
 *   await authenticatedPage.goto('/dashboard');
 *   // Already logged in
 * });
 */

type AuthFixtures = {
  authenticatedPage: typeof base<{ page }>['args'][0]['page'];
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login once per worker (not per test)
    await quickLogin(page);
    
    // Use the authenticated page in the test
    await use(page);
    
    // No teardown needed - Playwright manages page lifecycle
  },
});

export { expect };
