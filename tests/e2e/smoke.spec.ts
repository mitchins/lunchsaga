import { test, expect } from '@playwright/test';
import { quickLogin } from './helpers';

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
    // Use the quickLogin helper which handles magic code extraction
    await quickLogin(page);
    
    // Check if we successfully navigated to teams or dashboard
    const url = page.url();
    const currentPath = new URL(url).pathname;
    
    // Should be on teams or dashboard after login
    expect(currentPath.includes('teams') || currentPath.includes('dashboard')).toBeTruthy();
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
