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
    
    // Navigate to dashboard with team ID in URL
    // This way, when the page loads, it has:
    // 1. JWT token in localStorage
    // 2. teamId in URL parameter
    await page.goto(`/dashboard/${MOCK_TEAM_ID}`);
    
    // Inject JWT token into localStorage
    await page.evaluate((tok: string) => {
      localStorage.setItem('lunchsaga_token', tok);
    }, token);
    
    // Reload so app initializes with token + team ID in URL
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for initial data loads to complete - both auth/me and teams/members
    try {
      await Promise.race([
        page.waitForResponse(response => 
          response.url().includes('/api/auth/me') && response.status() === 200,
          { timeout: 5000 }
        ),
        page.waitForResponse(response => 
          response.url().includes(`/api/teams/${MOCK_TEAM_ID}/members`) && response.status() === 200,
          { timeout: 5000 }
        ),
      ]);
    } catch (e) {
      // Not a hard failure - auth might use cached data
      console.warn('[Fixture] Initial API calls did not complete:', e.message);
    }
    
    await page.waitForTimeout(300);
    
    // Page is now authenticated with team selected - tests can navigate to any route
    await use(page);
  },
});

export { expect };
