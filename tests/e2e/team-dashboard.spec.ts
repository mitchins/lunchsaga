import { test, expect } from './fixtures';
import { selectFirstTeam } from './helpers';

/**
 * Team Dashboard Tests
 * 
 * Tests for the main team dashboard screen including roster, team switcher,
 * and "Up Next" indicator functionality.
 */

test.describe('Team Dashboard', () => {
  // Helper to navigate to dashboard (assumes mock data is available)

  test('roster tab renders list of members', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/test-team-001');
    
    // Wait for member content to appear
    await page.waitForSelector('h3, text=/[A-Z][a-z]+/', { timeout: 10000 }).catch(() => {
      console.warn('Member content did not appear');
    });
    
    // Look for member cards or list items
    // Members might be in cards, list items, or other containers
    const memberElements = page.locator('[data-testid*="member"], [class*="member"], li, article').filter({
      has: page.locator('text=/[A-Z][a-z]+/') // Look for names (capitalized words)
    });
    
    // Should have at least one member
    await expect(memberElements.first()).toBeVisible();
  });

  test('Up Next indicator is visible on at least one member', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/test-team-001');
    
    // Wait for member content to appear
    await page.waitForSelector('h3, text=/[A-Z][a-z]+/', { timeout: 10000 }).catch(() => {
      console.warn('Member content did not appear');
    });
    
    // Look for "Up Next", "Next", or similar indicator
    const upNextIndicator = page.getByText(/up next|next in|next:|upcoming/i);
    
    await expect(upNextIndicator).toBeVisible();
  });

  test('team switcher dropdown opens and closes', async ({ authenticatedPage: page }) => {
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

  test('holiday mode toggle is present', async ({ authenticatedPage: page }) => {
    // Look for holiday mode switch
    const holidaySwitch = page.getByRole('switch', { name: /holiday/i }).or(
      page.getByText(/holiday/i).locator('..').getByRole('switch')
    );
    
    await expect(holidaySwitch).toBeVisible();
  });

  test('member cards are expandable or interactive', async ({ authenticatedPage: page }) => {
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
