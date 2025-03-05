#!/bin/bash

# Clean up existing virtual environment
rm -rf venv

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install playwright browsers
playwright install

# Run the FastAPI server with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8080
