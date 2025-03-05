#!/usr/bin/env python3
"""
Example script demonstrating how to use the browser_screenshot module.
"""

import os
import logging
from browser_screenshot import BrowserScreenshot, take_screenshot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def main():
    """
    Demonstrate various ways to use the browser_screenshot module.
    """
    # Create output directory
    output_dir = os.path.join(os.getcwd(), "screenshots")
    os.makedirs(output_dir, exist_ok=True)
    
    # Example 1: Using the convenience function
    print("\n=== Example 1: Using the convenience function ===")
    result = take_screenshot(
        url="https://example.com",
        output_path=os.path.join(output_dir, "example1.png")
    )
    print(f"Screenshot saved to: {result.get('saved_path')}")
    
    # Example 2: Using the BrowserScreenshot class
    print("\n=== Example 2: Using the BrowserScreenshot class ===")
    browser_screenshot = BrowserScreenshot()
    
    # Take a screenshot of a different website
    result = browser_screenshot.take_screenshot(
        url="https://github.com",
        output_path=os.path.join(output_dir, "github.png")
    )
    print(f"Screenshot saved to: {result.get('saved_path')}")
    
    # Example 3: Taking a screenshot without saving to disk
    print("\n=== Example 3: Taking a screenshot without saving to disk ===")
    result = browser_screenshot.take_screenshot(url="https://python.org")
    print(f"Screenshot taken but not saved to disk. Base64 data length: {len(result.get('screenshot', ''))}")
    
    # Example 4: List available screenshots
    print("\n=== Example 4: List available screenshots ===")
    try:
        screenshots = browser_screenshot.list_screenshots()
        print(f"Found {len(screenshots.get('screenshots', []))} screenshots on the server")
        
        # Print the first 5 screenshots
        for i, screenshot in enumerate(screenshots.get('screenshots', [])[:5]):
            print(f"  {i+1}. {screenshot}")
    except Exception as e:
        print(f"Error listing screenshots: {e}")
    
    print("\nAll examples completed successfully!")

if __name__ == "__main__":
    main() 