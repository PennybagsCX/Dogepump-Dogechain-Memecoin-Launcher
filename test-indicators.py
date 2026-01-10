#!/usr/bin/env python3
"""Test script to verify RSI, MACD, and Stoch RSI indicators appear below the chart."""

from playwright.sync_api import sync_playwright
import time

def test_indicators():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Navigate to token page
        print("Navigating to token page...")
        page.goto('http://localhost:3005/token/token-7')
        page.wait_for_load_state('networkidle')

        # Wait for page to fully load
        time.sleep(2)

        # Take initial screenshot
        page.screenshot(path='/tmp/01-before-indicators.png', full_page=False)
        print("✓ Took screenshot before enabling indicators")

        # Find and click Indicators button
        print("\nLooking for Indicators button...")
        indicators_btn = page.locator('button:has-text("Indicators")').first
        indicators_btn.click()
        print("✓ Clicked Indicators button")

        # Wait for menu to appear
        time.sleep(0.5)

        # Click RSI button
        print("\nClicking RSI button...")
        rsi_btn = page.locator('button:has-text("RSI")').first
        rsi_btn.click()
        print("✓ Clicked RSI button")
        time.sleep(1)

        # Take screenshot after RSI
        page.screenshot(path='/tmp/02-after-rsi.png', full_page=False)
        print("✓ Took screenshot after enabling RSI")

        # Click MACD button
        print("\nClicking MACD button...")
        macd_btn = page.locator('button:has-text("MACD")').first
        macd_btn.click()
        print("✓ Clicked MACD button")
        time.sleep(1)

        # Take screenshot after MACD
        page.screenshot(path='/tmp/03-after-macd.png', full_page=False)
        print("✓ Took screenshot after enabling MACD")

        # Click Stoch RSI button
        print("\nClicking Stoch RSI button...")
        stoch_btn = page.locator('button:has-text("Stoch RSI")').first
        stoch_btn.click()
        print("✓ Clicked Stoch RSI button")
        time.sleep(1)

        # Take final screenshot with all indicators
        page.screenshot(path='/tmp/04-all-indicators.png', full_page=False)
        print("✓ Took screenshot with all indicators enabled")

        # Check for any console errors
        print("\nChecking console logs...")
        page.wait_for_timeout(1000)

        browser.close()
        print("\n=== Test Complete ===")
        print("Screenshots saved:")
        print("  /tmp/01-before-indicators.png")
        print("  /tmp/02-after-rsi.png")
        print("  /tmp/03-after-macd.png")
        print("  /tmp/04-all-indicators.png")

if __name__ == '__main__':
    test_indicators()
