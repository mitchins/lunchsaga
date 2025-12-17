import { test, expect } from './fixtures';
import { navigateAndWait } from './helpers';

/**
 * Settings / Holiday Mode Tests
 * 
 * Tests for settings screen and holiday mode functionality.
 */

test.describe('Settings & Holiday Mode', () => {

  test('settings screen loads when navigated to', async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/settings/test-team-001');
    
    // Verify URL
    expect(page.url()).toContain('/settings/test-team-001');
    
    // Look for settings content
    const header = page.getByText(/settings|preferences|configuration/i);
    await expect(header.first()).toBeVisible();
  });

  test('holiday mode toggle switch renders', async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/settings/test-team-001');
    
    // Look for holiday mode switch
    const holidaySwitch = page.getByRole('switch', { name: /holiday/i }).or(
      page.getByText(/holiday/i).locator('..').getByRole('switch')
    );
    
    await expect(holidaySwitch).toBeVisible();
  });

  test('holiday mode toggle can be interacted with', async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/settings/test-team-001');
    
    // Find holiday switch
    const holidaySwitch = page.getByRole('switch', { name: /holiday/i }).or(
      page.getByText(/holiday/i).locator('..').getByRole('switch')
    );
    
    // Get initial state
    const initialState = await holidaySwitch.getAttribute('aria-checked');
    
    // Toggle the switch
    await holidaySwitch.click();
    await page.waitForTimeout(500);
    
    // Check for toast notification or state change
    const toast = page.locator('[data-sonner-toast]').or(
      page.locator('[role="status"], [role="alert"]')
    );
    
    const toastVisible = await toast.first().isVisible({ timeout: 2000 }).catch(() => false);
    
    // Either toast appears or state changed
    const newState = await holidaySwitch.getAttribute('aria-checked');
    
    expect(toastVisible || (newState !== initialState)).toBeTruthy();
  });

  test('holiday mode banner appears on dashboard when enabled', async ({ authenticatedPage: page }) => {
    // First, enable holiday mode from settings or dashboard
    await navigateAndWait(page, '/dashboard/test-team-001');
    
    // Find holiday toggle on dashboard
    const holidaySwitch = page.getByRole('switch', { name: /holiday/i }).or(
      page.getByText(/holiday/i).locator('..').getByRole('switch')
    );
    
    if (await holidaySwitch.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Check if it's already on
      const isChecked = await holidaySwitch.getAttribute('aria-checked') === 'true';
      
      if (!isChecked) {
        // Enable it
        await holidaySwitch.click();
        await page.waitForTimeout(500);
      }
      
      // Look for holiday mode indicator/banner
      const holidayBanner = page.getByText(/holiday|paused|break|active/i).and(
        page.locator('[class*="badge"], [class*="banner"], [class*="alert"]')
      );
      
      const hasBanner = await holidayBanner.first().isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(hasBanner).toBeTruthy();
    }
  });

  test('settings screen shows team information', async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/settings/test-team-001');
    
    // Look for team name or emoji
    const teamInfo = page.locator('text=/🎯|🍕|⚡|Team/i');
    const hasTeamInfo = await teamInfo.first().isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasTeamInfo).toBeTruthy();
  });

  test('back navigation works from settings', async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/settings/test-team-001');
    
    const backButton = page.getByRole('button', { name: /back|return|←/i });
    
    if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backButton.click();
      await page.waitForTimeout(500);
      
      // Should navigate away from settings
      expect(page.url()).not.toContain('/settings/test-team-001');
    }
  });

  test('holiday mode persists across navigation', async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/dashboard/test-team-001');
    
    // Enable holiday mode
    const holidaySwitch = page.getByRole('switch', { name: /holiday/i });
    
    if (await holidaySwitch.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isChecked = await holidaySwitch.getAttribute('aria-checked') === 'true';
      
      if (!isChecked) {
        await holidaySwitch.click();
        await page.waitForTimeout(500);
      }
      
      // Navigate to another page and back
      await page.goto('/vote/test-team-001');
      await page.waitForTimeout(500);
      await navigateAndWait(page, '/dashboard/test-team-001');
      
      // Holiday mode should still be active
      const stillChecked = await holidaySwitch.getAttribute('aria-checked') === 'true';
      expect(stillChecked).toBeTruthy();
    }
  });
});
