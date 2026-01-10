#!/usr/bin/env python3
"""Capture console logs to see the height calculations."""

from playwright.sync_api import sync_playwright
import time

def capture_console():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()

        # Capture console logs
        def handle_console(msg):
            if msg.type == 'log' and 'CandleChart layout:' in msg.text:
                print(f"\n🔍 CONSOLE LOG: {msg.text}")

        page = context.new_page()
        page.on('console', handle_console)

        # Navigate to token page
        print("Navigating to token page...")
        page.goto('http://localhost:3005/token/token-7')
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        # Click Indicators button
        print("\nClicking Indicators button...")
        page.locator('button:has-text("Indicators")').first.click()
        time.sleep(0.5)

        # Click RSI
        print("Clicking RSI button...")
        page.locator('button:has-text("RSI")').first.click()
        time.sleep(2)

        print("\n=== Check console output above ===")
        input("Press Enter to close browser...")

        browser.close()

if __name__ == '__main__':
    capture_console()
