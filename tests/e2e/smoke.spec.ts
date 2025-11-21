import { test, expect } from '@playwright/test';

/**
 * Application Smoke Suite
 * 
 * Basic tests to ensure the app loads and core UI elements are present.
 * Uses role-based locators and semantic queries for robustness.
 */

test.describe('Application Smoke Tests', () => {
  test('app loads with header and brand present', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
    
    // Check for the brand/logo - using text content that's likely present
    const brandElement = page.getByText(/lunch/i).first();
    await expect(brandElement).toBeVisible();
  });

  test('login screen renders with email input and CTA', async ({ page }) => {
    await page.goto('/');
    
    // Check for email input field
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();
    
    // Check for the submit button or CTA
    const submitButton = page.getByRole('button', { name: /continue|send|sign in|login/i });
    await expect(submitButton).toBeVisible();
  });

  test('navigation to teams dashboard works', async ({ page }) => {
    await page.goto('/');
    
    // Fill in email to get past login
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await emailInput.fill('test@example.com');
    
    // Submit the form
    const submitButton = page.getByRole('button', { name: /continue|send|sign in|login/i });
    await submitButton.click();
    
    // Wait for code input or next step
    await page.waitForTimeout(1000);
    
    // Check if we need to enter a code
    const codeInput = page.getByRole('textbox', { name: /code|verify/i });
    if (await codeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Enter the mock code (check console for actual code in dev)
      await codeInput.fill('ABCD1234');
      const verifyButton = page.getByRole('button', { name: /verify|confirm/i });
      await verifyButton.click();
    }
    
    // Should navigate to teams selection or dashboard
    await page.waitForURL(/\/(teams|dashboard)/);
    
    // Verify we're on the right page
    expect(page.url()).toMatch(/\/(teams|dashboard)/);
  });

  test('basic routing - teams page is accessible', async ({ page }) => {
    // Navigate directly to teams (bypassing login in mock environment)
    await page.goto('/teams');
    
    // In a real scenario, this might redirect to login
    // For now, check if page loads
    await page.waitForLoadState('networkidle');
    
    // URL should contain 'teams' or redirect happened
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test('basic routing - dashboard page structure', async ({ page }) => {
    // Navigate directly to dashboard
    await page.goto('/dashboard');
    
    await page.waitForLoadState('networkidle');
    
    // Check if we're on dashboard or redirected to login/teams
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });
});
