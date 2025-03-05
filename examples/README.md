# Browser Service Examples

This directory contains example scripts that demonstrate how to use the browser-service API.

## Screenshot Example

The `take_screenshot.py` script demonstrates how to take a screenshot of a website using the browser-service API.

### Prerequisites

- Python 3.6 or higher
- The browser-service must be running (typically on port 8000)
- Required Python packages: `requests`

You can install the required packages with:

```bash
pip install requests
```

### Usage

```bash
# Basic usage - takes a screenshot of the specified URL
./take_screenshot.py https://example.com

# Specify an output directory
./take_screenshot.py https://example.com -o /path/to/output/directory

# Specify a custom filename
./take_screenshot.py https://example.com -f custom_filename.png

# Specify both output directory and filename
./take_screenshot.py https://example.com -o /path/to/output/directory -f custom_filename.png
```

### Using as a Module

You can also import the `take_screenshot` function in your own Python scripts:

```python
from take_screenshot import take_screenshot

# Take a screenshot and get the path to the saved file
screenshot_path = take_screenshot("https://example.com")
print(f"Screenshot saved to: {screenshot_path}")

# Specify output directory and filename
screenshot_path = take_screenshot(
    "https://example.com",
    output_dir="/path/to/output/directory",
    filename="custom_filename.png"
)
```

## Troubleshooting

If you encounter issues:

1. Make sure the browser-service is running on port 8000
2. Check that the URL is valid and accessible
3. Ensure you have the required Python packages installed
4. Check the browser-service logs for any errors

## Additional Examples

More examples will be added in the future to demonstrate other features of the browser-service API. 