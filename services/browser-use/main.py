from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, SecretStr
from typing import Optional, Dict, Any
from browser_use import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv
import logging
import asyncio
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Check for required environment variables
if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY environment variable is required")

# Default timeouts
DEFAULT_OPERATION_TIMEOUT = 60  # seconds

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",     # Local development
        "http://web:3000",           # Docker internal network
        "http://127.0.0.1:3000",     # Alternative local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskRequest(BaseModel):
    task: str
    options: Optional[Dict[str, Any]] = None
    operation_timeout: Optional[int] = DEFAULT_OPERATION_TIMEOUT

@app.post("/execute")
async def execute_task(request: TaskRequest):
    try:
        logger.info(f"Starting task execution: {request.task}")
        
        # Initialize Gemini using langchain with API key from environment
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.7
        )
        logger.info("LLM initialized successfully")
        
        # Initialize agent with task
        agent = Agent(
            task=request.task,
            llm=llm
        )
        logger.info("Agent initialized successfully")
        
        # Execute the task with timeout
        try:
            logger.info("Starting agent.run()")
            result = await asyncio.wait_for(
                agent.run(),
                timeout=request.operation_timeout
            )
            logger.info("Task execution completed")
            
            # Extract the final result from the AgentHistoryList
            final_result = None
            if hasattr(result, 'all_results') and result.all_results:
                # Get the last result that has extracted_content
                for r in reversed(result.all_results):
                    if r.extracted_content:
                        final_result = r.extracted_content
                        break
            
            return {
                "success": True,
                "result": final_result or str(result),
                "error": None
            }
        except asyncio.TimeoutError:
            logger.error(f"Task execution timed out after {request.operation_timeout} seconds")
            raise HTTPException(
                status_code=408,
                detail=f"Task execution timed out after {request.operation_timeout} seconds"
            )
            
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Error during task execution: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"}
