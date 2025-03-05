"""
Browser Screenshot Module

A Python module for taking screenshots of websites using the browser-service API.
"""

import requests
import base64
import os
from datetime import datetime
from typing import Optional, Dict, Any, Union
import logging

# Configure logging
logger = logging.getLogger(__name__)

class BrowserScreenshot:
    """
    A class for taking screenshots of websites using the browser-service API.
    """
    
    def __init__(self, api_url: str = "http://localhost:8000"):
        """
        Initialize the BrowserScreenshot class.
        
        Args:
            api_url (str): The base URL of the browser-service API.
        """
        self.api_url = api_url.rstrip('/')
        self.screenshot_endpoint = f"{self.api_url}/screenshot"
        self.screenshots_endpoint = f"{self.api_url}/screenshots"
    
    def take_screenshot(self, 
                        url: str, 
                        output_path: Optional[str] = None,
                        full_page: bool = True) -> Dict[str, Any]:
        """
        Take a screenshot of a website.
        
        Args:
            url (str): The URL of the website to screenshot.
            output_path (str, optional): Path to save the screenshot. If None, the screenshot is not saved to disk.
            full_page (bool): Whether to take a full-page screenshot. Defaults to True.
            
        Returns:
            Dict[str, Any]: A dictionary containing the screenshot data and metadata.
        """
        try:
            # Prepare request parameters
            params = {"url": url}
            
            # Make the API request
            logger.info(f"Taking screenshot of {url}...")
            response = requests.post(self.screenshot_endpoint, params=params)
            
            # Check if the request was successful
            response.raise_for_status()
            
            # Get the response data
            data = response.json()
            
            # Check if the screenshot data is present
            if "screenshot" not in data:
                raise ValueError("Screenshot data not found in response")
            
            # Save the screenshot if output_path is provided
            if output_path:
                self._save_screenshot(data["screenshot"], output_path)
                data["saved_path"] = output_path
            
            return data
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error making API request: {e}")
            raise
        except ValueError as e:
            logger.error(f"Error processing response: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise
    
    def _save_screenshot(self, base64_data: str, output_path: str) -> None:
        """
        Save a base64-encoded screenshot to a file.
        
        Args:
            base64_data (str): The base64-encoded screenshot data.
            output_path (str): The path to save the screenshot.
        """
        try:
            # Create the directory if it doesn't exist
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
            
            # Decode the base64 image
            image_data = base64.b64decode(base64_data)
            
            # Save the image to a file
            with open(output_path, "wb") as f:
                f.write(image_data)
            
            logger.info(f"Screenshot saved to {output_path}")
        
        except Exception as e:
            logger.error(f"Error saving screenshot: {e}")
            raise
    
    def list_screenshots(self) -> Dict[str, Any]:
        """
        List all available screenshots.
        
        Returns:
            Dict[str, Any]: A dictionary containing the list of screenshots.
        """
        try:
            # Make the API request
            response = requests.get(self.screenshots_endpoint)
            
            # Check if the request was successful
            response.raise_for_status()
            
            # Return the response data
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error making API request: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise

# Convenience function for taking a screenshot
def take_screenshot(url: str, 
                   output_path: Optional[str] = None,
                   api_url: str = "http://localhost:8000",
                   full_page: bool = True) -> Dict[str, Any]:
    """
    Take a screenshot of a website.
    
    Args:
        url (str): The URL of the website to screenshot.
        output_path (str, optional): Path to save the screenshot. If None, the screenshot is not saved to disk.
        api_url (str): The base URL of the browser-service API.
        full_page (bool): Whether to take a full-page screenshot. Defaults to True.
        
    Returns:
        Dict[str, Any]: A dictionary containing the screenshot data and metadata.
    """
    screenshot = BrowserScreenshot(api_url=api_url)
    return screenshot.take_screenshot(url=url, output_path=output_path, full_page=full_page) 