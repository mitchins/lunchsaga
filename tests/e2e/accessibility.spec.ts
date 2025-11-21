import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests
 * 
 * Basic accessibility smoke tests using axe-core.
 * Checks for critical ARIA issues and semantic HTML usage.
 */

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Quick login
    const emailInput = page.getByRole('textbox', { name: /email/i });
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('test@example.com');
      await page.getByRole('button').first().click();
      await page.waitForTimeout(500);
      
      const codeInput = page.getByRole('textbox', { name: /code|verify/i });
      if (await codeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await codeInput.fill('ABCD1234');
        await page.getByRole('button').first().click();
      }
    }
    
    await page.waitForLoadState('networkidle');
  });

  test('login screen has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Filter for critical violations only
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('dashboard has no critical accessibility violations', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('voting screen has no critical accessibility violations', async ({ page }) => {
    await page.goto('/vote');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Get all buttons
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    // Check that buttons exist and are accessible
    expect(buttonCount).toBeGreaterThan(0);
    
    // Sample check - first button should have accessible text or label
    const firstButton = buttons.first();
    const text = await firstButton.textContent();
    const ariaLabel = await firstButton.getAttribute('aria-label');
    const ariaLabelledBy = await firstButton.getAttribute('aria-labelledby');
    
    // Button should have some form of accessible name
    expect(text || ariaLabel || ariaLabelledBy).toBeTruthy();
  });

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/');
    
    // Get all textboxes
    const inputs = page.getByRole('textbox');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      const firstInput = inputs.first();
      
      // Input should have a label or aria-label
      const ariaLabel = await firstInput.getAttribute('aria-label');
      const ariaLabelledBy = await firstInput.getAttribute('aria-labelledby');
      const placeholder = await firstInput.getAttribute('placeholder');
      
      // Some form of label should exist
      expect(ariaLabel || ariaLabelledBy || placeholder).toBeTruthy();
    }
  });

  test('main navigation elements use semantic HTML', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for semantic landmarks
    const main = page.locator('main');
    const nav = page.locator('nav');
    const header = page.locator('header');
    
    // At least some semantic elements should exist
    const hasMain = await main.count() > 0;
    const hasNav = await nav.count() > 0;
    const hasHeader = await header.count() > 0;
    
    // We expect at least some semantic HTML
    expect(hasMain || hasNav || hasHeader).toBeTruthy();
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Try to tab through the page
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // Check if something received focus
    const focusedElement = page.locator(':focus');
    const hasFocus = await focusedElement.count() > 0;
    
    expect(hasFocus).toBeTruthy();
  });

  test('switch controls have proper ARIA roles', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for switch elements (holiday mode toggle)
    const switches = page.getByRole('switch');
    const switchCount = await switches.count();
    
    if (switchCount > 0) {
      const firstSwitch = switches.first();
      
      // Should have aria-checked attribute
      const ariaChecked = await firstSwitch.getAttribute('aria-checked');
      expect(ariaChecked).toBeTruthy();
      expect(['true', 'false']).toContain(ariaChecked!);
    }
  });

  test('leaderboard has proper heading hierarchy', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    
    // Check for headings
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');
    
    const h1Count = await h1.count();
    const h2Count = await h2.count();
    
    // Should have at least a heading
    expect(h1Count + h2Count).toBeGreaterThan(0);
  });
});
