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

  baseTest('navigation to teams dashboard works', async ({ page }) => {
    // Use the quickLogin helper which handles magic code extraction
    await quickLogin(page);
    
    // Check if we successfully navigated to teams or dashboard
    const url = page.url();
    const currentPath = new URL(url).pathname;
    
    // Should be on teams or dashboard after login
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

  test('basic routing - dashboard page structure', async ({ authenticatedPage: page }) => {
    // Navigate directly to dashboard (already authenticated)
    await page.goto('/dashboard/test-team-001');
    
    await page.waitForLoadState('domcontentloaded');
    
    // Check if we're on dashboard
    const currentUrl = page.url();
    expect(currentUrl).toContain('dashboard');
  });
});
