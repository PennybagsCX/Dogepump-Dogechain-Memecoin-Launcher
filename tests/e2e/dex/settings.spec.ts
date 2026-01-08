/**
 * Settings E2E Tests
 * 
 * End-to-end tests for settings functionality covering:
 * - User opens settings
 * - User adjusts slippage
 * - User sets deadline
 * - User enables expert mode
 * - User resets to defaults
 * - Settings persist on reload
 */
// @ts-nocheck

import { test, expect } from '@playwright/test';

test.describe('Settings E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to swap page
    await page.goto('/swap');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('User opens settings', async ({ page }) => {
    // Click settings button
    await page.click('button:has-text("Settings")');
    
    // Wait for settings modal to open
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Verify settings modal is displayed
    await expect(page.locator('role=dialog[name="Settings"]')).toBeVisible();
    
    // Verify slippage section is displayed
    await expect(page.locator('text=Slippage Tolerance')).toBeVisible();
    
    // Verify deadline section is displayed
    await expect(page.locator('text=Transaction Deadline')).toBeVisible();
    
    // Verify expert mode section is displayed
    await expect(page.locator('text=Expert Mode')).toBeVisible();
  });

  test('User adjusts slippage', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Click custom slippage input
    await page.click('[aria-label="custom slippage"]');
    
    // Enter custom slippage value
    await page.fill('[aria-label="custom slippage"]', '1.5');
    
    // Verify slippage value is set
    await expect(page.locator('[aria-label="custom slippage"]')).toHaveValue('1.5');
    
    // Save settings
    await page.click('button:has-text("Save")');
    
    // Wait for settings to save
    await page.waitForTimeout(1000);
    
    // Verify settings modal is closed
    await expect(page.locator('role=dialog[name="Settings"]')).not.toBeVisible();
  });

  test('User selects slippage preset', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Click 0.5% preset
    await page.click('button:has-text("0.5%")');
    
    // Verify preset is selected
    await expect(page.locator('button:has-text("0.5%")')).toHaveClass(/bg-blue-500/);
    
    // Verify custom input is cleared
    await expect(page.locator('[aria-label="custom slippage"]')).toHaveValue('');
    
    // Save settings
    await page.click('button:has-text("Save")');
    
    // Wait for settings to save
    await page.waitForTimeout(1000);
  });

  test('User sets deadline', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Click custom deadline input
    await page.click('[aria-label="custom deadline"]');
    
    // Enter custom deadline value
    await page.fill('[aria-label="custom deadline"]', '45');
    
    // Verify deadline value is set
    await expect(page.locator('[aria-label="custom deadline"]')).toHaveValue('45');
    
    // Save settings
    await page.click('button:has-text("Save")');
    
    // Wait for settings to save
    await page.waitForTimeout(1000);
  });

  test('User selects deadline preset', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Click 30 minutes preset
    await page.click('button:has-text("30 minutes")');
    
    // Verify preset is selected
    await expect(page.locator('button:has-text("30 minutes")')).toHaveClass(/bg-blue-500/);
    
    // Verify custom input is cleared
    await expect(page.locator('[aria-label="custom deadline"]')).toHaveValue('');
    
    // Save settings
    await page.click('button:has-text("Save")');
    
    // Wait for settings to save
    await page.waitForTimeout(1000);
  });

  test('User enables expert mode', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Click expert mode toggle
    await page.click('[aria-label="expert mode"]');
    
    // Verify expert mode is enabled
    await expect(page.locator('[aria-label="expert mode"]')).toBeChecked();
    
    // Verify expert mode warning is displayed
    await expect(page.locator('text=Expert mode warning')).toBeVisible();
    
    // Save settings
    await page.click('button:has-text("Save")');
    
    // Wait for settings to save
    await page.waitForTimeout(1000);
  });

  test('User disables expert mode', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Enable expert mode first
    await page.click('[aria-label="expert mode"]');
    await expect(page.locator('[aria-label="expert mode"]')).toBeChecked();
    
    // Disable expert mode
    await page.click('[aria-label="expert mode"]');
    
    // Verify expert mode is disabled
    await expect(page.locator('[aria-label="expert mode"]')).not.toBeChecked();
    
    // Save settings
    await page.click('button:has-text("Save")');
    
    // Wait for settings to save
    await page.waitForTimeout(1000);
  });

  test('User resets to defaults', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Change some settings
    await page.click('[aria-label="custom slippage"]');
    await page.fill('[aria-label="custom slippage"]', '2.5');
    
    await page.click('[aria-label="custom deadline"]');
    await page.fill('[aria-label="custom deadline"]', '45');
    
    // Click reset to defaults button
    await page.click('button:has-text("Reset to Defaults")');
    
    // Verify settings are reset
    await expect(page.locator('[aria-label="custom slippage"]')).toHaveValue('');
    await expect(page.locator('[aria-label="custom deadline"]')).toHaveValue('');
    
    // Verify default presets are selected
    await expect(page.locator('button:has-text("0.5%")')).toHaveClass(/bg-blue-500/);
    await expect(page.locator('button:has-text("20 minutes")')).toHaveClass(/bg-blue-500/);
    
    // Verify expert mode is disabled
    await expect(page.locator('[aria-label="expert mode"]')).not.toBeChecked();
  });

  test('Settings persist on reload', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Change settings
    await page.click('[aria-label="custom slippage"]');
    await page.fill('[aria-label="custom slippage"]', '1.5');
    
    await page.click('[aria-label="custom deadline"]');
    await page.fill('[aria-label="custom deadline"]', '45');
    
    // Save settings
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Open settings again
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Verify settings are persisted
    await expect(page.locator('[aria-label="custom slippage"]')).toHaveValue('1.5');
    await expect(page.locator('[aria-label="custom deadline"]')).toHaveValue('45');
  });

  test('User cancels settings', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Change some settings
    await page.click('[aria-label="custom slippage"]');
    await page.fill('[aria-label="custom slippage"]', '2.5');
    
    // Click cancel button
    await page.click('button:has-text("Cancel")');
    
    // Verify settings modal is closed
    await expect(page.locator('role=dialog[name="Settings"]')).not.toBeVisible();
    
    // Open settings again
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Verify settings were not saved
    await expect(page.locator('[aria-label="custom slippage"]')).toHaveValue('');
  });

  test('User handles high slippage warning', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Enter high slippage value
    await page.click('[aria-label="custom slippage"]');
    await page.fill('[aria-label="custom slippage"]', '5.0');
    
    // Verify high slippage warning is displayed
    await expect(page.locator('text=High slippage warning')).toBeVisible();
  });

  test('User handles very high slippage warning', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Enter very high slippage value
    await page.click('[aria-label="custom slippage"]');
    await page.fill('[aria-label="custom slippage"]', '15.0');
    
    // Verify very high slippage warning is displayed
    await expect(page.locator('text=Very high slippage warning')).toBeVisible();
  });

  test('User handles short deadline warning', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Enter short deadline value
    await page.click('[aria-label="custom deadline"]');
    await page.fill('[aria-label="custom deadline"]', '1');
    
    // Verify short deadline warning is displayed
    await expect(page.locator('text=Short deadline warning')).toBeVisible();
  });

  test('User handles invalid slippage input', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Enter invalid slippage value (text)
    await page.click('[aria-label="custom slippage"]');
    await page.fill('[aria-label="custom slippage"]', 'abc');
    
    // Verify input is rejected (value is cleared)
    await expect(page.locator('[aria-label="custom slippage"]')).toHaveValue('');
  });

  test('User handles invalid deadline input', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Enter invalid deadline value (text)
    await page.click('[aria-label="custom deadline"]');
    await page.fill('[aria-label="custom deadline"]', 'abc');
    
    // Verify input is rejected (value is cleared)
    await expect(page.locator('[aria-label="custom deadline"]')).toHaveValue('');
  });

  test('User handles negative slippage input', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Enter negative slippage value
    await page.click('[aria-label="custom slippage"]');
    await page.fill('[aria-label="custom slippage"]', '-1.5');
    
    // Verify input is rejected (value is cleared)
    await expect(page.locator('[aria-label="custom slippage"]')).toHaveValue('');
  });

  test('User handles negative deadline input', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Enter negative deadline value
    await page.click('[aria-label="custom deadline"]');
    await page.fill('[aria-label="custom deadline"]', '-10');
    
    // Verify input is rejected (value is cleared)
    await expect(page.locator('[aria-label="custom deadline"]')).toHaveValue('');
  });

  test('User handles very high slippage input', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Enter very high slippage value (near max)
    await page.click('[aria-label="custom slippage"]');
    await page.fill('[aria-label="custom slippage"]', '49.9');
    
    // Verify input is accepted
    await expect(page.locator('[aria-label="custom slippage"]')).toHaveValue('49.9');
  });

  test('User handles very long deadline input', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Enter very long deadline value
    await page.click('[aria-label="custom deadline"]');
    await page.fill('[aria-label="custom deadline"]', '1440');
    
    // Verify input is accepted
    await expect(page.locator('[aria-label="custom deadline"]')).toHaveValue('1440');
  });
});
