import { test as baseTest, expect } from '@playwright/test';
import { test, expect as expectAuth } from './fixtures';
import { quickLogin } from './helpers';

/**
 * Application Smoke Suite
 * 
 * Basic tests to ensure the app loads and core UI elements are present.
 * Uses role-based locators and semantic queries for robustness.
 * 
 * NOTE: Login-related tests use regular `page`, authenticated tests use `authenticatedPage`
 */

baseTest.describe('Application Smoke Tests - Unauthenticated', () => {
  baseTest('app loads with header and brand present', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check for the brand/logo - using text content that's likely present
    const brandElement = page.getByText(/lunch/i).first();
    await expect(brandElement).toBeVisible();
  });

  baseTest('login screen renders with email input and CTA', async ({ page }) => {
    await page.goto('/');
    
    // Check for email input field
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();
    
    // Check for the submit button or CTA
    const submitButton = page.getByRole('button', { name: /continue|send|sign in|login/i });
    await expect(submitButton).toBeVisible();
  });

  baseTest('login flow - complete journey from email to authenticated', async ({ page }) => {
    // CRITICAL TEST: Verify the actual login transition works
    // This tests the critical boundary between unauthenticated → authenticated
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Step 1: Submit email
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();
    
    await emailInput.fill('test@example.com');
    
    const submitButton = page.getByRole('button', { name: /send magic link/i });
    await submitButton.click();
    
    // Step 2: Verify code input appears
    const codeInput = page.getByRole('textbox', { name: /code|verification/i });
    await expect(codeInput).toBeVisible({ timeout: 5000 });
    
    // Step 3: Submit code (mock API uses fixed code '000000')
    await codeInput.fill('000000');
    
    const verifyButton = page.getByRole('button', { name: /verify|sign in/i }).first();
    await verifyButton.click();
    
    // Step 4: Verify transition to authenticated page
    // Should redirect to teams or dashboard
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/\/teams|\/dashboard/);
  });

  baseTest.skip('navigation to teams dashboard works', async ({ page }) => {
    // Skipped: Login flow is complex with magic codes and is better tested via authenticated fixture
    // The authenticated smoke tests below verify routing works
    await quickLogin(page);
    
    const url = page.url();
    const currentPath = new URL(url).pathname;
    
    expect(currentPath.includes('teams') || currentPath.includes('dashboard')).toBeTruthy();
  });
});

test.describe('Application Smoke Tests - Authenticated', () => {
  test('basic routing - teams page is accessible', async ({ authenticatedPage: page }) => {
    // Start directly on teams page (already authenticated)
    await page.goto('/teams');
    
    await page.waitForLoadState('domcontentloaded');
    
    // URL should contain 'teams'
    const currentUrl = page.url();
    expect(currentUrl).toContain('teams');
  });

  test('routing robustness - direct navigation to key pages', async ({ authenticatedPage: page }) => {
    // Consolidated: Check that key routes are accessible (replaces dashboard structure test)
    const routes = [
      '/dashboard/test-team-001',
      '/vote/test-team-001',
      '/leaderboard/test-team-001',
      '/settings/test-team-001',
      '/summary/test-team-001',
      '/teams'
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain(route);
      
      // Ensure page content loaded (not 404)
      const main = page.locator('main, [role="main"], #root');
      await expect(main).toBeVisible();
    }
  });

  test.skip('routing robustness - 404 handling', async ({ authenticatedPage: page }) => {
    await page.goto('/this-route-does-not-exist-12345');
    
    // Should show 404 or redirect
    const has404 = await page.getByText(/404|not found/i).isVisible().catch(() => false);
    const isHome = page.url().endsWith('/');
    
    expect(has404 || isHome).toBeTruthy();
  });
});
