import { Page, ConsoleMessage } from '@playwright/test';

/**
 * Test Utilities
 * 
 * Common helper functions for E2E tests.
 */

/**
 * Performs a quick login using mock credentials.
 * This navigates through the login flow automatically and extracts the magic code.
 */
export async function quickLogin(page: Page, email = 'test@example.com'): Promise<void> {
  // Listen for console messages to catch the magic link code
  let magicCode = '';
  const consoleHandler = (msg: ConsoleMessage) => {
    const text = msg.text();
    const match = text.match(/Magic link code.*: ([A-Z0-9]+)/);
    if (match) {
      magicCode = match[1];
    }
  };
  
  page.on('console', consoleHandler);
  
  await page.goto('/');
  
  const emailInput = page.getByRole('textbox', { name: /email/i });
  if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await emailInput.fill(email);
    const submitButton = page.getByRole('button', { name: /continue|send|sign in|login/i }).first();
    await submitButton.click();
    await page.waitForTimeout(1500);
    
    const codeInput = page.getByRole('textbox', { name: /code|verify/i });
    if (await codeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (magicCode) {
        await codeInput.fill(magicCode);
        const verifyButton = page.getByRole('button', { name: /verify|confirm/i }).first();
        await verifyButton.click();
        await page.waitForTimeout(1000);
      }
    }
  }
  
  // Remove console listener
  page.off('console', consoleHandler);
  
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

/**
 * Navigates to a specific route and waits for page to be ready.
 */
export async function navigateAndWait(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

