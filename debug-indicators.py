#!/usr/bin/env python3
"""Debug script to check indicator state and DOM."""

from playwright.sync_api import sync_playwright
import time

def debug_indicators():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Navigate to token page
        print("Navigating to token page...")
        page.goto('http://localhost:3005/token/token-7')
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        # Click Indicators button
        print("Clicking Indicators button...")
        page.locator('button:has-text("Indicators")').first.click()
        time.sleep(0.5)

        # Click RSI
        print("Clicking RSI button...")
        page.locator('button:has-text("RSI")').first.click()
        time.sleep(1)

        # Check the DOM for RSI subchart
        print("\n=== Checking DOM for RSI subchart ===")

        # Look for RSI-related elements
        rsi_elements = page.locator('text=RSI').all()
        print(f"Found {len(rsi_elements)} elements with 'RSI' text")

        # Check for subchart containers
        subcharts = page.locator('[class*="chart"]').all()
        print(f"Found {len(subcharts)} chart-related elements")

        # Check container heights
        container = page.locator('.recharts-wrapper').all()
        print(f"Found {len(container)} recharts-wrapper elements")

        # Get page HTML to inspect structure
        html = page.content()

        # Search for RSI in HTML
        if 'rsi' in html.lower():
            print("✓ 'rsi' found in page HTML")
        else:
            print("✗ 'rsi' NOT found in page HTML")

        # Check ResponsiveContainer elements
        responsive_containers = page.locator('.recharts-responsive-container').all()
        print(f"Found {len(responsive_containers)} ResponsiveContainer elements")

        # Take a close-up screenshot of the bottom of the chart
        page.screenshot(path='/tmp/chart-bottom-zoom.png', full_page=False)

        # Check console logs
        print("\n=== Checking Console ===")
        page.evaluate("""
        () => {
            console.log('Window height:', window.innerHeight);
            console.log('Document height:', document.body.scrollHeight);

            // Find chart container
            const chartContainer = document.querySelector('[class*="chart"]');
            if (chartContainer) {
                console.log('Chart container height:', chartContainer.offsetHeight);
                console.log('Chart container style:', chartContainer.getAttribute('style'));
            }

            // Find all subchart divs
            const subcharts = document.querySelectorAll('[style*="height"][style*="border"]');
            console.log('Subchart elements found:', subcharts.length);
            subcharts.forEach((sc, i) => {
                console.log(`Subchart ${i}:`, sc.offsetHeight, 'px -', sc.getAttribute('style'));
            });
        }
        """)

        time.sleep(1)

        browser.close()
        print("\n=== Debug Complete ===")
        print("Screenshot saved: /tmp/chart-bottom-zoom.png")

if __name__ == '__main__':
    debug_indicators()
