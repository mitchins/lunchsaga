import { test as base, expect } from '@playwright/test';

/**
 * E2E Test Fixtures with Pre-Minted JWT Authentication
 * 
 * Tests use a valid JWT token injected into localStorage.
 * Tests navigate directly to routes with teamId in URL (e.g., /leaderboard/:teamId).
 * All view state is in the URI - no React state needed.
 */

const TOKEN_KEY = 'lunchsaga_token';
const MOCK_USER_ID = 'test-user-001';
const MOCK_EMAIL = 'test@example.com';
const MOCK_TEAM_ID = 'test-team-001';

/**
 * Create a valid JWT token for testing.
 * The mock API decodes this and auto-creates user, team, and members.
 */
function createMockToken(): string {
  const payload = {
    userId: MOCK_USER_ID,
    email: MOCK_EMAIL,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

type AuthFixtures = {
  authenticatedPage: any;
};

/**
 * Fixture: Provide a page with authentication token in localStorage and a selected team in URL.
 * The app loads all data based on token + URL parameters.
 * Tests can navigate to any route with teamId already set.
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const token = createMockToken();

    // Ensure auth token is available before the app bootstraps.
    await page.addInitScript((tok) => {
      window.localStorage.setItem('lunchsaga_token', tok);
    }, token);

    // Start with token set before the first routed render so team-scoped routes
    // can resolve team context in a single navigation pass.
    await page.goto(`/dashboard/${MOCK_TEAM_ID}`);

    const waitForAuth = page.waitForResponse(
      (response) => response.url().includes('/api/auth/me') && response.status() === 200,
      { timeout: 8000 }
    )

    const waitForTeams = page.waitForResponse(
      (response) => response.url().includes('/api/teams') && response.status() === 200,
      { timeout: 8000 }
    )

    const waitForMembers = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/teams/${MOCK_TEAM_ID}/members`) && response.status() === 200,
      { timeout: 8000 }
    )

    const bootstrapChecks = await Promise.allSettled([waitForAuth, waitForTeams, waitForMembers]);
    if (bootstrapChecks.every((result) => result.status === 'rejected')) {
      // If all bootstrap calls failed, log a warning but allow the test to continue.
      console.warn('[Fixture] Initial API calls did not complete in time.');
    }

    await page.waitForLoadState('domcontentloaded');

    // Ensure we are still on the requested team dashboard path.
    if (!page.url().includes(`/dashboard/${MOCK_TEAM_ID}`)) {
      await page.goto(`/dashboard/${MOCK_TEAM_ID}`);
      await page.waitForLoadState('domcontentloaded');
    }

    await page.locator('text=Loading your saga...').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {
      // The spinner can remain briefly visible under cold start; we still continue with explicit test assertions.
    })

    // Keep a final safety wait so fixtures don't race with initial app startup.
    try {
      await page.waitForSelector('h2:has-text("Team Members")', { timeout: 5000 });
    } catch (e) {
      // Not a hard failure if the heading is not ready in time for every test.
    }

    // Page is now authenticated with team selected - tests can navigate to any route
    await use(page);
  },
});

export { expect };
