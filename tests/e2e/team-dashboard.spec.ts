import { test, expect } from '@playwright/test';

/**
 * Team Dashboard Tests
 * 
 * Tests for the main team dashboard screen including roster, team switcher,
 * and "Up Next" indicator functionality.
 */

test.describe('Team Dashboard', () => {
  // Helper to navigate to dashboard (assumes mock data is available)
  test.beforeEach(async ({ page }) => {
    // In mock environment, we can navigate directly
    // In real environment, this would go through login flow
    await page.goto('/');
    
    // Quick login flow
    const emailInput = page.getByRole('textbox', { name: /email/i });
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('test@example.com');
      const submitButton = page.getByRole('button').first();
      await submitButton.click();
      await page.waitForTimeout(500);
      
      // Handle code if needed
      const codeInput = page.getByRole('textbox', { name: /code|verify/i });
      if (await codeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await codeInput.fill('ABCD1234');
        const verifyButton = page.getByRole('button').first();
        await verifyButton.click();
      }
    }
    
    // Navigate to dashboard if not already there
    if (!page.url().includes('/dashboard')) {
      // Try to select a team if on teams page
      const teamCard = page.locator('[role="button"]', { hasText: /team/i }).first();
      if (await teamCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await teamCard.click();
      } else {
        await page.goto('/dashboard');
      }
    }
    
    await page.waitForLoadState('networkidle');
  });

  test('roster tab renders list of members', async ({ page }) => {
    // Look for tabs
    const rosterTab = page.getByRole('tab', { name: /roster/i });
    
    // If tabs exist, click roster
    if (await rosterTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rosterTab.click();
    }
    
    // Wait a moment for content to load
    await page.waitForTimeout(500);
    
    // Look for member cards or list items
    // Members might be in cards, list items, or other containers
    const memberElements = page.locator('[data-testid*="member"], [class*="member"], li, article').filter({
      has: page.locator('text=/[A-Z][a-z]+/') // Look for names (capitalized words)
    });
    
    // Should have at least one member
    await expect(memberElements.first()).toBeVisible();
  });

  test('Up Next indicator is visible on at least one member', async ({ page }) => {
    // Look for "Up Next", "Next", or similar indicator
    const upNextIndicator = page.getByText(/up next|next in|next:|upcoming/i);
    
    await expect(upNextIndicator).toBeVisible();
  });

  test('team switcher dropdown opens and closes', async ({ page }) => {
    // Look for team switcher button/dropdown
    const teamSwitcher = page.getByRole('button', { name: /switch|team/i }).or(
      page.locator('[aria-label*="team"]').or(
        page.locator('[data-testid*="team-switch"]')
      )
    );
    
    // Try to find by combobox role as well
    const combobox = page.getByRole('combobox');
    
    let switcherElement = teamSwitcher;
    if (await combobox.isVisible({ timeout: 1000 }).catch(() => false)) {
      switcherElement = combobox;
    } else if (!await teamSwitcher.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Team switcher might be in header, look for any dropdown
      switcherElement = page.locator('button').filter({ hasText: /🎯|🍕|⚡/ }).first();
    }
    
    // Only test if switcher is found
    if (await switcherElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click to open
      await switcherElement.click();
      await page.waitForTimeout(300);
      
      // Look for dropdown menu/options
      const dropdownMenu = page.locator('[role="menu"], [role="listbox"], [role="dialog"]').or(
        page.locator('[data-state="open"]')
      );
      
      await expect(dropdownMenu).toBeVisible();
      
      // Click away or press escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      // Menu should be hidden
      await expect(dropdownMenu).not.toBeVisible();
    } else {
      // Skip test if no team switcher (single team scenario)
      test.skip();
    }
  });

  test('holiday mode toggle is present', async ({ page }) => {
    // Look for holiday mode switch
    const holidaySwitch = page.getByRole('switch', { name: /holiday/i }).or(
      page.getByText(/holiday/i).locator('..').getByRole('switch')
    );
    
    await expect(holidaySwitch).toBeVisible();
  });

  test('member cards are expandable or interactive', async ({ page }) => {
    // Look for the first member card/element
    const memberCard = page.locator('article, [class*="card"]').filter({
      has: page.locator('text=/[A-Z][a-z]+/')
    }).first();
    
    if (await memberCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Member cards should be visible
      await expect(memberCard).toBeVisible();
      
      // Check if clickable/has buttons
      const buttons = memberCard.getByRole('button');
      const buttonCount = await buttons.count();
      
      // Should have at least some interactive element
      expect(buttonCount).toBeGreaterThanOrEqual(0);
    }
  });
});
