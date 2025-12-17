import { test, expect } from './fixtures';
import { navigateAndWait } from './helpers';

/**
 * UI Rendering Tests
 * 
 * Consolidates rendering checks for Leaderboard, Profile, and Summary.
 * Focuses on "does it render" rather than "is the data 100% correct".
 */

test.describe('UI Rendering', () => {

  test('leaderboard renders with members', async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/leaderboard/test-team-001');
    
    // Check for member list items or cards
    const members = page.locator('li, article, [class*="card"]');
    
    // We expect at least one member (the current user)
    await expect(members.first()).toBeVisible();
  });

  test.skip('profile page renders', async ({ authenticatedPage: page }) => {
    // Navigate to a profile (using a dummy ID, assuming app handles 404 gracefully or mock has it)
    // The mock API creates 'test-user-001' so we use that
    await navigateAndWait(page, '/profile/test-team-001/test-user-001');
    
    // Should show profile info
    const profileContent = page.getByText(/profile|stats|history/i).or(
      page.locator('img[alt*="avatar"]')
    );
    
    await expect(profileContent.first()).toBeVisible();
  });

  test.skip('weekly summary renders', async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/summary/test-team-001');
    
    // Should show summary header
    const summaryHeader = page.getByText(/summary|week|results/i);
    await expect(summaryHeader.first()).toBeVisible();
  });
});
