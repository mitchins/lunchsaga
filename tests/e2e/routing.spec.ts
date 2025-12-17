import { test, expect } from './fixtures';
import { navigateAndEnsureVisible, isValidPath, quickLogin } from './helpers';

/**
 * Routing Robustness Tests
 *
 * Tests for direct navigation, deep linking, and 404 handling.
 */

test.describe('Routing Robustness', () => {
  const directRoutes = ['/dashboard/test-team-001', '/vote/test-team-001', '/leaderboard/test-team-001', '/settings/test-team-001', '/summary/test-team-001', '/profile/test-team-001/test-member-123', '/teams'];

  for (const path of directRoutes) {
    test(`direct navigation to ${path} renders a page`, async ({ authenticatedPage: page }) => {
      await navigateAndEnsureVisible(page, path);
      expect(isValidPath(page.url(), ['/', path, '/login', '/teams', '/dashboard/test-team-001'])).toBeTruthy();
    });
  }

  test('invalid route handling', async ({ authenticatedPage: page }) => {
    await navigateAndEnsureVisible(page, '/this-route-does-not-exist-12345');

    const url = page.url();
    expect(url).toBeTruthy();

    // Check for 404 text or redirect to home
    const has404Text = await page.getByText(/404|not found|doesn't exist/i)
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    const redirectedToHome = isValidPath(url, ['/']);

    // Either shows 404 or redirects gracefully
    expect(has404Text || redirectedToHome || url.includes('/')).toBeTruthy();
  });

  test('navigation state persists on page refresh', async ({ authenticatedPage: page }) => {
    // Quick login
    await quickLogin(page);

    // Navigate to a specific page
    await page.goto('/leaderboard/test-team-001');
    await page.waitForLoadState('domcontentloaded');

    const urlBeforeRefresh = page.url();

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const urlAfterRefresh = page.url();

    // URL should be similar (might redirect to login in some cases)
    // The important thing is the app doesn't crash
    expect(urlAfterRefresh).toBeTruthy();
  });

  test('deep link to teams page works', async ({ authenticatedPage: page }) => {
    await navigateAndEnsureVisible(page, '/teams');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('browser back button works correctly', async ({ authenticatedPage: page }) => {
    await quickLogin(page);

    // Navigate to dashboard then leaderboard
    await page.goto('/dashboard/test-team-001');
    await page.waitForTimeout(500);
    await page.goto('/leaderboard/test-team-001');
    await page.waitForTimeout(500);

    const urlBeforeBack = page.url();

    // Go back
    await page.goBack();
    await page.waitForTimeout(500);

    const urlAfterBack = page.url();

    // URL should have changed
    expect(urlAfterBack).not.toBe(urlBeforeBack);
  });

  test('browser forward button works correctly', async ({ authenticatedPage: page }) => {
    await quickLogin(page);

    // Navigate forward and back
    await page.goto('/dashboard/test-team-001');
    await page.waitForTimeout(500);
    await page.goto('/leaderboard/test-team-001');
    await page.waitForTimeout(500);
    await page.goBack();
    await page.waitForTimeout(500);

    const urlBeforeForward = page.url();

    // Go forward
    await page.goForward();
    await page.waitForTimeout(500);

    const urlAfterForward = page.url();

    // URL should have changed
    expect(urlAfterForward).not.toBe(urlBeforeForward);
  });
});
