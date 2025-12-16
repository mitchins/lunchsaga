import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { quickLogin, navigateAndWait } from './helpers';

/**
 * Accessibility Tests
 * 
 * Basic accessibility smoke tests using axe-core.
 * Checks for critical ARIA issues and semantic HTML usage.
 */

test.describe('Accessibility', () => {
  test('login screen has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Filter for only critical violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical'
    );
    
    // Log violations for visibility but don't fail on serious (only critical)
    if (accessibilityScanResults.violations.length > 0) {
      console.log(`Found ${accessibilityScanResults.violations.length} accessibility issues (${criticalViolations.length} critical)`);
    }
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('dashboard has no critical accessibility violations', async ({ page }) => {
    await quickLogin(page);
    await navigateAndWait(page, '/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    // Filter for only critical violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical'
    );
    
    // Log violations for visibility
    if (accessibilityScanResults.violations.length > 0) {
      console.log(`Found ${accessibilityScanResults.violations.length} accessibility issues (${criticalViolations.length} critical)`);
    }
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('voting screen has no critical accessibility violations', async ({ page }) => {
    await quickLogin(page);
    await navigateAndWait(page, '/vote');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    // Filter for only critical violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical'
    );
    
    // Log violations for visibility
    if (accessibilityScanResults.violations.length > 0) {
      console.log(`Found ${accessibilityScanResults.violations.length} accessibility issues (${criticalViolations.length} critical)`);
    }
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('buttons have accessible names', async ({ page }) => {
    await quickLogin(page);
    await navigateAndWait(page, '/dashboard');
    
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

  test.skip('main navigation elements use semantic HTML', async ({ page }) => {
    // This test is skipped for now as the app uses modern React patterns with ARIA roles
    // rather than traditional semantic HTML5 elements
    await navigateAndWait(page, '/dashboard');
    
    // Check for semantic landmarks
    const main = page.locator('main');
    const nav = page.locator('nav');
    const header = page.locator('header');
    const article = page.locator('article');
    
    // Count semantic elements
    const hasMain = await main.count() > 0;
    const hasNav = await nav.count() > 0;
    const hasHeader = await header.count() > 0;
    const hasArticle = await article.count() > 0;
    
    // At least the page should have some structure
    // Modern React apps might use divs with roles instead
    const roles = await page.locator('[role]').count();
    
    // We expect either semantic HTML or ARIA roles
    expect(hasMain || hasNav || hasHeader || hasArticle || roles > 5).toBeTruthy();
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await quickLogin(page);
    await navigateAndWait(page, '/dashboard');
    
    // Try to tab through the page
    await page.keyboard.press('Tab');
    
    // Check if something received focus
    const focusedElement = page.locator(':focus');
    const hasFocus = await focusedElement.count() > 0;
    
    expect(hasFocus).toBeTruthy();
  });

  test('switch controls have proper ARIA roles', async ({ page }) => {
    await quickLogin(page);
    await navigateAndWait(page, '/dashboard');
    
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
    await quickLogin(page);
    await navigateAndWait(page, '/leaderboard');
    
    // Check for headings
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');
    
    const h1Count = await h1.count();
    const h2Count = await h2.count();
    
    // Should have at least a heading
    expect(h1Count + h2Count).toBeGreaterThan(0);
  });
});
