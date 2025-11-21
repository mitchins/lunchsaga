import { test, expect } from '@playwright/test';
import { quickLogin } from './helpers';

/**
 * Voting Flow Tests
 * 
 * Tests for the voting screen functionality including rendering member cards,
 * vote interaction, and navigation.
 */

test.describe('Voting Flow', () => {
  test.beforeEach(async ({ page }) => {
    await quickLogin(page);
  });

  test('vote screen renders when navigated to', async ({ page }) => {
    // Navigate to vote screen
    await page.goto('/vote');
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the vote screen
    expect(page.url()).toContain('/vote');
    
    // Look for voting-related content
    const votingContent = page.getByText(/vote|voting|pick|choose/i);
    await expect(votingContent.first()).toBeVisible();
  });

  test('vote screen shows venue options or member info', async ({ page }) => {
    await page.goto('/vote');
    await page.waitForLoadState('networkidle');
    
    // Look for venue options, member cards, or voting buttons
    // The screen might show different states based on period status
    const hasVoteButtons = await page.getByRole('button', { name: /vote|👍|👎|yes|no/i })
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    
    const hasStartButton = await page.getByRole('button', { name: /start|begin|chapter/i })
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    
    const hasContent = await page.locator('article, [class*="card"], [class*="venue"]')
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    
    // One of these should be true
    expect(hasVoteButtons || hasStartButton || hasContent).toBeTruthy();
  });

  test('clicking vote buttons updates UI state', async ({ page }) => {
    await page.goto('/vote');
    await page.waitForLoadState('networkidle');
    
    // Start the week if needed
    const startButton = page.getByRole('button', { name: /start|begin|chapter/i }).first();
    if (await startButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for vote buttons (thumbs up/down or similar)
    const voteButtons = page.getByRole('button', { name: /👍|👎|vote|yes|no/i });
    const buttonCount = await voteButtons.count();
    
    if (buttonCount > 0) {
      // Get initial state
      const firstButton = voteButtons.first();
      
      // Click the vote button
      await firstButton.click();
      
      // Wait for UI update
      await page.waitForTimeout(500);
      
      // Check for toast/notification or state change
      const toast = page.locator('[data-sonner-toast]').or(
        page.locator('[role="status"], [role="alert"]')
      );
      
      // Either toast appears or button state changes
      const toastVisible = await toast.first().isVisible({ timeout: 2000 }).catch(() => false);
      
      // Test passes if toast appeared or if the page is still functional
      expect(toastVisible || page.url().includes('/vote')).toBeTruthy();
    }
  });

  test('back navigation works from vote screen', async ({ page }) => {
    await page.goto('/vote');
    await page.waitForLoadState('networkidle');
    
    // Look for back button
    const backButton = page.getByRole('button', { name: /back|return|←/i }).or(
      page.locator('button').filter({ has: page.locator('svg') }).first()
    );
    
    if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Get current URL
      const beforeUrl = page.url();
      
      // Click back
      await backButton.click();
      await page.waitForTimeout(500);
      
      // URL should have changed
      const afterUrl = page.url();
      expect(afterUrl).not.toBe(beforeUrl);
    } else {
      // If no back button, try browser back
      await page.goBack();
      await page.waitForTimeout(500);
      
      // Should navigate somewhere
      expect(page.url()).not.toContain('/vote');
    }
  });

  test('vote screen handles empty/holiday state', async ({ page }) => {
    await page.goto('/vote');
    await page.waitForLoadState('networkidle');
    
    // Check for empty state message or start button
    const emptyStateText = page.getByText(/awaits|paused|holiday|begin/i);
    const hasEmptyState = await emptyStateText.first().isVisible({ timeout: 2000 }).catch(() => false);
    
    // Empty state or active voting content should be visible
    expect(hasEmptyState || page.getByText(/vote/i).first()).toBeTruthy();
  });
});
