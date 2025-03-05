#!/usr/bin/env python3
"""
Example script to take a screenshot of a website using the browser-service API.
"""

import requests
import base64
import argparse
import os
from datetime import datetime

def take_screenshot(url, output_dir=None, filename=None):
    """
    Take a screenshot of a website using the browser-service API.
    
    Args:
        url (str): The URL of the website to screenshot
        output_dir (str, optional): Directory to save the screenshot. Defaults to current directory.
        filename (str, optional): Filename for the screenshot. Defaults to a timestamp-based name.
        
    Returns:
        str: Path to the saved screenshot file
    """
    # Set default output directory if not provided
    if output_dir is None:
        output_dir = os.getcwd()
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Set default filename if not provided
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        domain = url.replace("http://", "").replace("https://", "").split("/")[0]
        filename = f"{domain}_{timestamp}.png"
    
    # Ensure filename has .png extension
    if not filename.lower().endswith('.png'):
        filename += '.png'
    
    # Full path to the output file
    output_path = os.path.join(output_dir, filename)
    
    # API endpoint
    api_url = "http://localhost:8000/screenshot"
    
    try:
        # Make the API request
        print(f"Taking screenshot of {url}...")
        response = requests.post(api_url, params={"url": url})
        
        # Check if the request was successful
        response.raise_for_status()
        
        # Get the screenshot data
        data = response.json()
        if "screenshot" not in data:
            raise ValueError("Screenshot data not found in response")
        
        # Decode the base64 image
        image_data = base64.b64decode(data["screenshot"])
        
        # Save the image to a file
        with open(output_path, "wb") as f:
            f.write(image_data)
        
        print(f"Screenshot saved to {output_path}")
        return output_path
    
    except requests.exceptions.RequestException as e:
        print(f"Error making API request: {e}")
        return None
    except ValueError as e:
        print(f"Error processing response: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

def main():
    """Main function to parse arguments and take a screenshot."""
    parser = argparse.ArgumentParser(description="Take a screenshot of a website")
    parser.add_argument("url", help="URL of the website to screenshot")
    parser.add_argument("-o", "--output-dir", help="Directory to save the screenshot")
    parser.add_argument("-f", "--filename", help="Filename for the screenshot")
    
    args = parser.parse_args()
    
    take_screenshot(args.url, args.output_dir, args.filename)

if __name__ == "__main__":
    main() 