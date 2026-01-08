/**
 * Swap E2E Tests
 * 
 * End-to-end tests for swap functionality covering:
 * - User connects wallet
 * - User selects tokens
 * - User enters amount
 * - User adjusts slippage
 * - User executes swap
 * - User sees confirmation
 * - User checks transaction history
 */
// @ts-nocheck

import { test, expect } from '@playwright/test';

test.describe('Swap E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to swap page
    await page.goto('/swap');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('User connects wallet', async ({ page }) => {
    // Click connect wallet button
    await page.click('button:has-text("Connect Wallet")');
    
    // Wait for wallet connection modal
    await page.waitForSelector('role=dialog[name="Connect Wallet"]');
    
    // Select wallet provider (e.g., MetaMask)
    await page.click('button:has-text("MetaMask")');
    
    // Verify wallet is connected
    await expect(page.locator('text=0x...')).toBeVisible();
    
    // Verify wallet address is displayed
    const walletAddress = await page.locator('[data-testid="wallet-address"]').textContent();
    expect(walletAddress).toMatch(/^0x[a-fA-F0-9]{4}$/);
  });

  test('User selects tokens', async ({ page }) => {
    // Connect wallet first
    await page.click('button:has-text("Connect Wallet")');
    await page.click('button:has-text("MetaMask")');
    await page.waitForSelector('text=0x...');
    
    // Select from token
    await page.click('[aria-label="select from token"]');
    await page.waitForSelector('role=dialog[name="Select Token"]');
    
    // Search for token
    await page.fill('input[placeholder="Search tokens"]', 'DC');
    
    // Select DC token
    await page.click('text=DC');
    
    // Verify from token is selected
    await expect(page.locator('[data-testid="from-token-symbol"]')).toHaveText('DC');
    
    // Select to token
    await page.click('[aria-label="select to token"]');
    await page.waitForSelector('role=dialog[name="Select Token"]');
    
    // Search for token
    await page.fill('input[placeholder="Search tokens"]', 'WDOGE');
    
    // Select WDOGE token
    await page.click('text=WDOGE');
    
    // Verify to token is selected
    await expect(page.locator('[data-testid="to-token-symbol"]')).toHaveText('WDOGE');
  });

  test('User enters amount', async ({ page }) => {
    // Connect wallet and select tokens
    await page.click('button:has-text("Connect Wallet")');
    await page.click('button:has-text("MetaMask")');
    await page.waitForSelector('text=0x...');
    
    await page.click('[aria-label="select from token"]');
    await page.click('text=DC');
    
    await page.click('[aria-label="select to token"]');
    await page.click('text=WDOGE');
    
    // Enter amount
    await page.fill('[aria-label="from amount"]', '100');
    
    // Verify amount is entered
    await expect(page.locator('[aria-label="from amount"]')).toHaveValue('100');
    
    // Verify to amount is calculated
    const toAmount = await page.locator('[aria-label="to amount"]').inputValue();
    expect(parseFloat(toAmount)).toBeGreaterThan(0);
  });

  test('User adjusts slippage', async ({ page }) => {
    // Connect wallet and select tokens
    await page.click('button:has-text("Connect Wallet")');
    await page.click('button:has-text("MetaMask")');
    await page.waitForSelector('text=0x...');
    
    await page.click('[aria-label="select from token"]');
    await page.click('text=DC');
    
    await page.click('[aria-label="select to token"]');
    await page.click('text=WDOGE');
    
    // Open settings
    await page.click('button:has-text("Settings")');
    await page.waitForSelector('role=dialog[name="Settings"]');
    
    // Select custom slippage
    await page.click('[aria-label="custom slippage"]');
    await page.fill('[aria-label="custom slippage"]', '1.0');
    
    // Verify slippage is set
    await expect(page.locator('[aria-label="custom slippage"]')).toHaveValue('1.0');
    
    // Save settings
    await page.click('button:has-text("Save")');
    
    // Verify settings modal is closed
    await expect(page.locator('role=dialog[name="Settings"]')).not.toBeVisible();
  });

  test('User executes swap', async ({ page }) => {
    // Connect wallet and select tokens
    await page.click('button:has-text("Connect Wallet")');
    await page.click('button:has-text("MetaMask")');
    await page.waitForSelector('text=0x...');
    
    await page.click('[aria-label="select from token"]');
    await page.click('text=DC');
    
    await page.click('[aria-label="select to token"]');
    await page.click('text=WDOGE');
    
    // Enter amount
    await page.fill('[aria-label="from amount"]', '100');
    
    // Click swap button
    await page.click('button:has-text("Swap")');
    
    // Wait for confirmation modal
    await page.waitForSelector('role=dialog[name="Transaction Summary"]');
    
    // Verify swap details
    await expect(page.locator('text=100 DC')).toBeVisible();
    await expect(page.locator('text=WDOGE')).toBeVisible();
    
    // Confirm swap
    await page.click('button:has-text("Confirm")');
    
    // Wait for transaction to complete
    await page.waitForSelector('text=Swap successful', { timeout: 30000 });
  });

  test('User sees confirmation', async ({ page }) => {
    // Complete swap flow
    await page.click('button:has-text("Connect Wallet")');
    await page.click('button:has-text("MetaMask")');
    await page.waitForSelector('text=0x...');
    
    await page.click('[aria-label="select from token"]');
    await page.click('text=DC');
    
    await page.click('[aria-label="select to token"]');
    await page.click('text=WDOGE');
    
    await page.fill('[aria-label="from amount"]', '100');
    await page.click('button:has-text("Swap")');
    await page.click('button:has-text("Confirm")');
    
    // Wait for success message
    await page.waitForSelector('text=Swap successful');
    
    // Verify success message is displayed
    await expect(page.locator('text=Swap successful')).toBeVisible();
    
    // Verify form is reset
    await expect(page.locator('[aria-label="from amount"]')).toHaveValue('');
  });

  test('User checks transaction history', async ({ page }) => {
    // Complete swap flow
    await page.click('button:has-text("Connect Wallet")');
    await page.click('button:has-text("MetaMask")');
    await page.waitForSelector('text=0x...');
    
    await page.click('[aria-label="select from token"]');
    await page.click('text=DC');
    
    await page.click('[aria-label="select to token"]');
    await page.click('text=WDOGE');
    
    await page.fill('[aria-label="from amount"]', '100');
    await page.click('button:has-text("Swap")');
    await page.click('button:has-text("Confirm")');
    await page.waitForSelector('text=Swap successful');
    
    // Navigate to transaction history
    await page.click('button:has-text("Transactions")');
    
    // Wait for transaction history to load
    await page.waitForSelector('[data-testid="transaction-list"]');
    
    // Verify transaction is displayed
    await expect(page.locator('text=Swap')).toBeVisible();
    await expect(page.locator('text=100 DC')).toBeVisible();
    
    // Verify transaction status
    await expect(page.locator('text=Completed')).toBeVisible();
  });

  test('User handles insufficient balance error', async ({ page }) => {
    // Connect wallet and select tokens
    await page.click('button:has-text("Connect Wallet")');
    await page.click('button:has-text("MetaMask")');
    await page.waitForSelector('text=0x...');
    
    await page.click('[aria-label="select from token"]');
    await page.click('text=DC');
    
    await page.click('[aria-label="select to token"]');
    await page.click('text=WDOGE');
    
    // Enter large amount
    await page.fill('[aria-label="from amount"]', '999999999999999999999');
    
    // Verify error message
    await expect(page.locator('text=Insufficient balance')).toBeVisible();
    
    // Verify swap button is disabled
    await expect(page.locator('button:has-text("Swap")')).toBeDisabled();
  });

  test('User handles high price impact warning', async ({ page }) => {
    // Connect wallet and select tokens
    await page.click('button:has-text("Connect Wallet")');
    await page.click('button:has-text("MetaMask")');
    await page.waitForSelector('text=0x...');
    
    await page.click('[aria-label="select from token"]');
    await page.click('text=DC');
    
    await page.click('[aria-label="select to token"]');
    await page.click('text=WDOGE');
    
    // Enter large amount to trigger high price impact
    await page.fill('[aria-label="from amount"]', '1000000');
    
    // Verify high price impact warning
    await expect(page.locator('text=High price impact')).toBeVisible();
    
    // Verify warning color
    const warningElement = page.locator('text=High price impact');
    await expect(warningElement).toHaveCSS('color', 'rgb(239, 68, 68)'); // red-500
  });
});
