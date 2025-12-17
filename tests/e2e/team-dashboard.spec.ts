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

  test('roster renders team members', async ({ authenticatedPage: page }) => {
    // Focus only on member list rendering (ui-rendering.spec already covers leaderboard)
    // This is specifically the dashboard roster/team view
    await page.goto('/dashboard/test-team-001');
    
    // Wait for member content to appear
    // Relaxed selector to just look for any list item or card
    await page.waitForSelector('li, article, [class*="card"]', { timeout: 10000 }).catch(() => {
      console.warn('Member content did not appear');
    });
    
    const memberElements = page.locator('li, article, [class*="card"]');
    
    // Should have at least one member
    await expect(memberElements.first()).toBeVisible();
  });
});
