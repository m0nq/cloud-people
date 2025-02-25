from browser_use import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv
import asyncio

# Load environment variables
load_dotenv()

async def main():
    # Initialize Gemini
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-exp",
        api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.7
    )
    
    # Create agent with minimal config
    agent = Agent(
        task="Go to https://www.google.com and search for OpenAI",
        llm=llm
    )
    
    # Run the agent
    result = await agent.run()
    print("Result:", result)

if __name__ == "__main__":
    asyncio.run(main())
