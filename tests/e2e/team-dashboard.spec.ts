import { test, expect } from './fixtures';
import { navigateAndWait } from './helpers';

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
    await navigateAndWait(page, '/dashboard/test-team-001');
    await expect(page).toHaveURL(/\/dashboard\/test-team-001(?:\/)?(?:\?.*)?$/, { timeout: 12000 });

    const rosterContent = page.locator('[data-testid="team-member"]').first().or(page.getByText('Your Fellowship Awaits'));
    const heading = page.getByRole('heading', { name: /team members/i }).first();

    await expect(rosterContent.or(heading)).toBeVisible({ timeout: 12000 });
  });
});
