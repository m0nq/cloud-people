from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from browser_use import Agent, Browser, BrowserConfig
from langchain_openai import ChatOpenAI
import os

app = FastAPI()

class TaskRequest(BaseModel):
    url: str
    task: str
    options: Optional[Dict[str, Any]] = None

@app.post("/execute")
async def execute_task(request: TaskRequest):
    try:
        # Initialize browser with headless config
        browser = Browser(headless=True)
        
        # Initialize LLM using langchain_openai
        llm = ChatOpenAI(model="gpt-4")
        
        # Initialize agent with browser and LLM
        agent = Agent(
            task=request.task,
            llm=llm,
            browser=browser,
            use_vision=True
        )
        
        # Execute the task
        result = await agent.run()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok"}
