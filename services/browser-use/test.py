import asyncio
import os
from dotenv import load_dotenv
import logging

# Import our implementation
from strategies.llm.factory import LLMProviderFactory
from core.context import BrowserUseContext

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def main():
    # Get API key from environment
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.error("No GOOGLE_API_KEY found in environment")
        return
    
    # Create LLM provider
    llm_provider = LLMProviderFactory.create_provider(
        "gemini",
        {
            "api_key": api_key,
            "model": "gemini-2.0-flash-exp",
            "temperature": 0.7
        }
    )
    
    # Create browser context with non-headless mode
    async with BrowserUseContext(llm_provider, headless=False) as context:
        # Execute a simple task
        task = "Go to https://www.google.com and search for OpenAI"
        logger.info(f"Executing task: {task}")
        
        result = await context.execute_task(task)
        
        # Log the result
        logger.info(f"Task completed with success: {result.get('success', False)}")
        
        # Take a screenshot
        screenshot = await context.take_screenshot()
        if screenshot:
            with open("screenshot.png", "wb") as f:
                f.write(screenshot)
            logger.info("Screenshot saved to screenshot.png")

if __name__ == "__main__":
    asyncio.run(main())
