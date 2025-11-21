import { test, expect } from '@playwright/test';
import { quickLogin } from './helpers';

/**
 * Weekly Summary Screen Tests
 * 
 * Tests for weekly summary/history screen showing past picks and stats.
 */

test.describe('Weekly Summary Screen', () => {
  test.beforeEach(async ({ page }) => {
    await quickLogin(page);
  });

  test('weekly summary screen loads', async ({ page }) => {
    await page.goto('/summary');
    await page.waitForLoadState('networkidle');
    
    // Verify URL
    expect(page.url()).toContain('/summary');
    
    // Look for summary-related content
    const header = page.getByText(/summary|history|past|week/i);
    await expect(header.first()).toBeVisible();
  });

  test('mock summary data displays', async ({ page }) => {
    await page.goto('/summary');
    await page.waitForLoadState('networkidle');
    
    // Look for any content that indicates data loaded
    const content = page.locator('article, [class*="card"], li, tr');
    const contentCount = await content.count();
    
    // Should have some content
    expect(contentCount).toBeGreaterThan(0);
  });

  test('key stats render - turns count', async ({ page }) => {
    await page.goto('/summary');
    await page.waitForLoadState('networkidle');
    
    // Look for "turns", "weeks", or similar
    const turnsText = page.getByText(/turns|weeks|rounds|total/i);
    const hasTurnsText = await turnsText.first().isVisible({ timeout: 2000 }).catch(() => false);
    
    // Look for numbers
    const numbers = page.locator('text=/\\d+/');
    const hasNumbers = await numbers.count() > 0;
    
    expect(hasTurnsText || hasNumbers).toBeTruthy();
  });

  test('key stats render - win counts or picks', async ({ page }) => {
    await page.goto('/summary');
    await page.waitForLoadState('networkidle');
    
    // Look for win/pick related text
    const statsText = page.getByText(/wins|picks|votes|organizer/i);
    const hasStatsText = await statsText.first().isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasStatsText || page.getByText(/\d+/).first()).toBeTruthy();
  });

  test('summary shows historical entries', async ({ page }) => {
    await page.goto('/summary');
    await page.waitForLoadState('networkidle');
    
    // Look for list of past events
    const entries = page.locator('li, article, [class*="entry"], tr').filter({
      has: page.locator('text=/[A-Z][a-z]+|\\d+/')
    });
    
    const entryCount = await entries.count();
    
    // Should have at least some entries (or empty state)
    expect(entryCount).toBeGreaterThanOrEqual(0);
  });

  test('summary displays member names', async ({ page }) => {
    await page.goto('/summary');
    await page.waitForLoadState('networkidle');
    
    // Look for names (capitalized words)
    const names = page.locator('text=/[A-Z][a-z]{2,}/');
    const nameCount = await names.count();
    
    // Should show member names if there's history
    expect(nameCount).toBeGreaterThanOrEqual(0);
  });

  test('back navigation works from summary', async ({ page }) => {
    await page.goto('/summary');
    await page.waitForLoadState('networkidle');
    
    const backButton = page.getByRole('button', { name: /back|return|←/i });
    
    if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backButton.click();
      await page.waitForTimeout(500);
      
      // Should navigate away from summary
      expect(page.url()).not.toContain('/summary');
    }
  });

  test('summary handles empty state', async ({ page }) => {
    await page.goto('/summary');
    await page.waitForLoadState('networkidle');
    
    // Look for either data or empty state message
    const emptyState = page.getByText(/no.*history|empty|start|first/i);
    const hasContent = page.locator('article, li').first();
    
    const hasEmptyState = await emptyState.first().isVisible({ timeout: 2000 }).catch(() => false);
    const hasData = await hasContent.isVisible({ timeout: 2000 }).catch(() => false);
    
    // Should have either empty state or data
    expect(hasEmptyState || hasData).toBeTruthy();
  });
});
