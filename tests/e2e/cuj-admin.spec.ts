import { test, expect } from './fixtures';
import { navigateAndWait } from './helpers';

/**
 * Critical User Journey: Admin & Settings
 * 
 * Focuses on team settings and admin tasks.
 */

test.describe('CUJ: Admin', () => {

  test.skip('can navigate to settings', async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/settings/test-team-001');
    expect(page.url()).toContain('/settings/test-team-001');
    
    const settingsHeader = page.getByText(/settings|preferences|config/i);
    await expect(settingsHeader.first()).toBeVisible();
  });

  test('can toggle holiday mode (UI only)', async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/settings/test-team-001');
    await expect(page).toHaveURL(/\/settings\/test-team-001(?:\/)?(?:\?.*)?$/, { timeout: 12000 });

    // Target the deterministic toggle used by settings screen settings.
    const holidayToggle = page.getByTestId('settings-holiday-toggle');
    await expect(holidayToggle).toBeVisible();
    const initialState = await holidayToggle.getAttribute('aria-checked');
    await expect(holidayToggle).toHaveAttribute('aria-checked');
    expect(initialState === 'true' || initialState === 'false').toBeTruthy();

    const toggleAndVerify = async (targetState: string) => {
      const request = page.waitForResponse((response) =>
        response.request().method() === 'PUT' &&
        response.url().endsWith('/api/teams/test-team-001')
      );
      await holidayToggle.click();
      const response = await request;
      expect(response.ok()).toBeTruthy();
      await expect(holidayToggle).toHaveAttribute('aria-checked', targetState);
    }

    const newState = initialState === 'true' ? 'false' : 'true';
    await toggleAndVerify(newState);
    await toggleAndVerify(initialState ?? 'false');
  });
});
