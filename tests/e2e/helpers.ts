import { Page } from '@playwright/test';

/**
 * Test Utilities
 * 
 * Common helper functions for E2E tests.
 */

/**
 * Performs a quick login using mock credentials.
 * This navigates through the login flow automatically.
 */
export async function quickLogin(page: Page, email = 'test@example.com') {
  await page.goto('/');
  
  const emailInput = page.getByRole('textbox', { name: /email/i });
  if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await emailInput.fill(email);
    await page.getByRole('button').first().click();
    await page.waitForTimeout(500);
    
    const codeInput = page.getByRole('textbox', { name: /code|verify/i });
    if (await codeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await codeInput.fill('ABCD1234');
      await page.getByRole('button').first().click();
    }
  }
  
  await page.waitForLoadState('networkidle');
}

/**
 * Navigates to a team selection if on teams page.
 */
export async function selectFirstTeam(page: Page) {
  const teamCard = page.locator('[role="button"]').filter({ hasText: /team/i }).first();
  if (await teamCard.isVisible({ timeout: 2000 }).catch(() => false)) {
    await teamCard.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Waits for any loading/animation states to complete.
 */
export async function waitForPageIdle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300); // Small buffer for animations
}

/**
 * Closes any open toast notifications.
 */
export async function closeToasts(page: Page) {
  const toasts = page.locator('[data-sonner-toast]');
  const count = await toasts.count();
  
  for (let i = 0; i < count; i++) {
    const toast = toasts.nth(i);
    if (await toast.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
    }
  }
}
