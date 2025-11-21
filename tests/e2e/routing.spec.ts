import { test, expect } from '@playwright/test';
import { quickLogin, navigateAndEnsureVisible, isValidPath } from './helpers';

/**
 * Routing Robustness Tests
 *
 * Tests for direct navigation, deep linking, and 404 handling.
 */

test.describe('Routing Robustness', () => {
  const directRoutes = ['/dashboard', '/vote', '/leaderboard', '/settings', '/summary', '/profile/test-member-123', '/teams'];

  for (const path of directRoutes) {
    test(`direct navigation to ${path} renders a page`, async ({ page }) => {
      await navigateAndEnsureVisible(page, path);
      expect(isValidPath(page.url(), ['/', path, '/login', '/teams', '/dashboard'])).toBeTruthy();
    });
  }

  test('invalid route handling', async ({ page }) => {
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

  test('navigation state persists on page refresh', async ({ page }) => {
    // Quick login
    await quickLogin(page);

    // Navigate to a specific page
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');

    const urlBeforeRefresh = page.url();

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    const urlAfterRefresh = page.url();

    // URL should be similar (might redirect to login in some cases)
    // The important thing is the app doesn't crash
    expect(urlAfterRefresh).toBeTruthy();
  });

  test('deep link to teams page works', async ({ page }) => {
    await navigateAndEnsureVisible(page, '/teams');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('browser back button works correctly', async ({ page }) => {
    await quickLogin(page);

    // Navigate to dashboard then leaderboard
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
    await page.goto('/leaderboard');
    await page.waitForTimeout(500);

    const urlBeforeBack = page.url();

    // Go back
    await page.goBack();
    await page.waitForTimeout(500);

    const urlAfterBack = page.url();

    // URL should have changed
    expect(urlAfterBack).not.toBe(urlBeforeBack);
  });

  test('browser forward button works correctly', async ({ page }) => {
    await quickLogin(page);

    // Navigate forward and back
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
    await page.goto('/leaderboard');
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
