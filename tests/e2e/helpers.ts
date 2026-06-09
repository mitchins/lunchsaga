import { Page, expect } from '@playwright/test';
import { isRouteAllowed } from '@/utils/navigation';

/**
 * Test Utilities
 * 
 * Common helper functions for E2E tests.
 */

/**
 * Performs a quick login using mock credentials.
 * Uses the fixed magic code from the mock API (always '000000' for E2E tests).
 */
/* istanbul ignore next */
export async function quickLogin(page: Page, email = 'test@example.com'): Promise<void> {
  const MOCK_MAGIC_CODE = '000000'; // Fixed code used by mock API
  
  await page.goto('/');
  
  const emailInput = page.getByRole('textbox', { name: /email/i });
  if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await emailInput.fill(email);
    const submitButton = page.getByRole('button', { name: /continue|send|sign in|login/i }).first();
    await submitButton.click();
    
    // Wait for code input to appear
    const codeInput = page.getByRole('textbox', { name: /code|verify/i });
    await codeInput.waitFor({ state: 'visible', timeout: 5000 });
    
    // Fill in the mock code
    await codeInput.fill(MOCK_MAGIC_CODE);
    const verifyButton = page.getByRole('button', { name: /verify|confirm/i }).first();
    await verifyButton.click();
  }
  
  // Wait for navigation to complete - use domcontentloaded instead of networkidle
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Navigates to a team selection if on teams page.
 */
/* istanbul ignore next */
export async function selectFirstTeam(page: Page) {
  const teamCard = page.locator('[role="button"]').filter({ hasText: /team/i }).first();
  if (await teamCard.isVisible({ timeout: 2000 }).catch(() => false)) {
    await teamCard.click();
    await page.waitForLoadState('domcontentloaded');
  }
}

/**
 * Waits for any loading/animation states to complete.
 */
/* istanbul ignore next */
export async function waitForPageIdle(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Closes any open toast notifications.
 */
/* istanbul ignore next */
export async function closeToasts(page: Page) {
  const toasts = page.locator('[data-sonner-toast]');
  const count = await toasts.count();
  
  for (let i = 0; i < count; i++) {
    const toast = toasts.nth(i);
    if (await toast.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
    }
  }
}

/**
 * Navigates to a specific route and waits for page to be ready.
 */
export async function navigateAndWait(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');

  if (path.includes('/dashboard/')) {
    await expect(page.getByRole('heading', { name: /team members/i })).toBeVisible({ timeout: 10000 }).catch(() => {
      // Some routes can render slightly later under CI load; callers still assert the final UI.
    });
  } else if (path.includes('/settings/')) {
    const holidayToggle = page.getByRole('switch').or(page.locator('button[role="switch"]')).first();
    await expect(holidayToggle).toBeVisible({ timeout: 10000 }).catch(() => {
      // Settings can hydrate after DOMContentLoaded; the test will still fail if the toggle never appears.
    });
  } else if (path.includes('/leaderboard/')) {
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 }).catch(() => {
      // Leaderboard content is asserted in the test body.
    });
  }
}

/**
 * Navigates to a route and verifies the document body is visible.
 */
/* istanbul ignore next */
export async function navigateAndEnsureVisible(page: Page, path: string): Promise<void> {
  await navigateAndWait(page, path);
  await expect(page.locator('body')).toBeVisible();
}

/**
 * Validates that a URL matches at least one of the provided valid path segments.
 */
export function isValidPath(url: string, validPaths: string[]): boolean {
  if (!url) return false;
  return isRouteAllowed(url, validPaths);
}
