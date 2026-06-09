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
    await expect(page).toHaveURL('**/settings/test-team-001', { timeout: 12000 });

    // Find the toggle
    const holidayToggle = page.getByTestId('settings-holiday-toggle')
      .or(page.getByRole('switch', { name: 'Enable Holiday Mode' }))
      .or(page.locator('button[role="switch"]'))
      .first();
    
    await expect(holidayToggle).toBeVisible();
    const initialState = await holidayToggle.getAttribute('aria-checked');
    await expect(holidayToggle).toHaveAttribute('aria-checked');
    expect(initialState === 'true' || initialState === 'false').toBeTruthy();

    // Click it
    await holidayToggle.click();

    // Verify UI state changed (optimistic update)
    // We don't check persistence as that's an API concern
    await expect(holidayToggle).toHaveAttribute(
      'aria-checked',
      initialState === 'true' ? 'false' : 'true'
    );
  });
});
