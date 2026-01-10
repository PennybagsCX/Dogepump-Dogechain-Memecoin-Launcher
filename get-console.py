#!/usr/bin/env python3
"""Get console logs to see height calculations."""

from playwright.sync_api import sync_playwright
import time

def get_console_logs():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Collect all console messages
        console_messages = []
        def handle_console(msg):
            console_messages.append({
                'type': msg.type,
                'text': msg.text
            })

        page.on('console', handle_console)

        # Navigate
        print("Navigating...")
        page.goto('http://localhost:3005/token/token-7')
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        # Click RSI
        print("Clicking RSI...")
        page.locator('button:has-text("Indicators")').first.click()
        time.sleep(0.5)
        page.locator('button:has-text("RSI")').first.click()
        time.sleep(2)

        # Print relevant console messages
        print("\n=== CONSOLE LOGS (CandleChart layout) ===")
        for msg in console_messages:
            if 'CandleChart layout:' in msg['text']:
                print(msg['text'])

        # Save logs to file
        with open('/tmp/console-logs.txt', 'w') as f:
            for msg in console_messages:
                f.write(f"{msg['type']}: {msg['text']}\n")

        print("\nLogs saved to /tmp/console-logs.txt")
        print("Close browser to exit...")
        input("Press Enter...")

        browser.close()

if __name__ == '__main__':
    get_console_logs()
