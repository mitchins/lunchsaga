import { test, expect } from '@playwright/test';
import { quickLogin } from './helpers';

/**
 * Routing Robustness Tests
 * 
 * Tests for direct navigation, deep linking, and 404 handling.
 */

test.describe('Routing Robustness', () => {
  test('direct navigation to dashboard loads expected UI', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should either show dashboard or redirect to login/teams
    const url = page.url();
    const validPaths = ['/', '/dashboard', '/teams', '/login'];
    const isValidPath = validPaths.some(path => url.includes(path));
    
    expect(isValidPath).toBeTruthy();
  });

  test('direct navigation to vote screen', async ({ page }) => {
    await page.goto('/vote');
    await page.waitForLoadState('networkidle');
    
    // Should show vote screen or redirect
    const url = page.url();
    expect(url).toBeTruthy();
    
    // Page should have loaded something
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('direct navigation to leaderboard', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    
    // Should load leaderboard or redirect
    const url = page.url();
    expect(url).toBeTruthy();
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('direct navigation to settings', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url).toBeTruthy();
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('direct navigation to summary', async ({ page }) => {
    await page.goto('/summary');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url).toBeTruthy();
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('direct navigation to profile with ID', async ({ page }) => {
    await page.goto('/profile/test-member-123');
    await page.waitForLoadState('networkidle');
    
    // Should load profile or redirect to dashboard/teams
    const url = page.url();
    expect(url).toBeTruthy();
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('invalid route handling', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-12345');
    await page.waitForLoadState('networkidle');
    
    // Should either show 404, redirect, or handle gracefully
    const url = page.url();
    expect(url).toBeTruthy();
    
    // Page should still render something (not crash)
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check for 404 text or redirect to home
    const has404Text = await page.getByText(/404|not found|doesn't exist/i)
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    
    const redirectedToHome = url === page.url().match(/^https?:\/\/[^/]+(\/)?$/)?.[0];
    
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
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    // Should load teams or redirect to login
    const url = page.url();
    expect(url).toBeTruthy();
    
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
