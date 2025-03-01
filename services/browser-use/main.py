# main.py - FastAPI integration

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import os
import asyncio
import logging
import uuid
import json
import base64
from datetime import datetime
from dotenv import load_dotenv

# Import our LLM strategy implementation
from strategies.llm.factory import LLMProviderFactory
from core.context import BrowserUseContext

# Import configuration
from config import (
    validate_llm_provider_config,
    get_available_llm_providers,
    get_api_key_for_provider,
    get_default_model_for_provider,
    get_default_provider,
    AppConfig
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Force all loggers to DEBUG level
for handler in logging.root.handlers:
    handler.setLevel(logging.DEBUG)

# Initialize FastAPI
app = FastAPI(title="Browser Use Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Default operation timeout (in seconds)
DEFAULT_OPERATION_TIMEOUT = AppConfig.DEFAULT_OPERATION_TIMEOUT

# In-memory storage for active tasks and history
active_tasks = {}
task_history = {}

# Connected WebSocket clients
connected_clients = {}

# Task status model
class TaskStatus(BaseModel):
    task_id: str
    status: str
    progress: float = 0.0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

# Recording configuration
class RecordingConfig(BaseModel):
    enabled: bool = True
    format: str = AppConfig.DEFAULT_RECORDING_FORMAT
    quality: str = AppConfig.DEFAULT_RECORDING_QUALITY
    frame_rate: int = AppConfig.DEFAULT_RECORDING_FRAME_RATE

# LLM Provider configuration
class ProviderConfig(BaseModel):
    type: str
    api_key: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    options: Optional[Dict[str, Any]] = None

# Task request model
class TaskRequest(BaseModel):
    task: str
    task_id: Optional[str] = None
    operation_timeout: Optional[int] = DEFAULT_OPERATION_TIMEOUT
    recording_config: Optional[RecordingConfig] = None
    llm_provider: Optional[ProviderConfig] = None
    headless: Optional[bool] = False

# Execute a browser task
@app.post("/execute", response_model=TaskStatus)
async def execute_task(request: TaskRequest):
    """Execute a browser task"""
    # Generate a task ID if not provided
    task_id = request.task_id or str(uuid.uuid4())
    
    # Check if task already exists
    if task_id in active_tasks:
        raise HTTPException(status_code=400, detail=f"Task with ID {task_id} already exists")
    
    # Create task status
    task_status = TaskStatus(
        task_id=task_id,
        status="pending",
        start_time=datetime.now(),
        metadata={}
    )
    
    # Store task in active tasks
    active_tasks[task_id] = task_status
    
    # Run task in background
    asyncio.create_task(run_task(task_id, request, task_status))
    
    return task_status

# Run a task in the background
async def run_task(task_id: str, request: TaskRequest, task_status: TaskStatus):
    """Run a task in the background"""
    recording_process = None
    context = None
    
    try:
        # Update task status
        task_status.status = "running"
        await broadcast_task_update(task_id, task_status)
        
        # Configure LLM provider
        default_provider = get_default_provider()
        logger.info(f"Default provider: {default_provider}")
        
        llm_config = request.llm_provider or ProviderConfig(
            type=default_provider,
            api_key=get_api_key_for_provider(default_provider),
            model=get_default_model_for_provider(default_provider)
        )
        
        logger.info(f"LLM config: type={llm_config.type}, model={llm_config.model}")
        
        # Use provided API key or fall back to environment variable
        if not llm_config.api_key:
            llm_config.api_key = get_api_key_for_provider(llm_config.type)
            logger.info(f"Using API key from environment for {llm_config.type}")
            if not llm_config.api_key:
                logger.error(f"No API key available for provider {llm_config.type}")
                raise ValueError(f"No API key available for provider {llm_config.type}")
        
        # Ensure model is not None
        if not llm_config.model:
            logger.warning(f"Model is None, getting default for {llm_config.type}")
            llm_config.model = get_default_model_for_provider(llm_config.type)
            logger.info(f"Using default model: {llm_config.model}")
        
        # Create LLM provider using factory
        logger.info(f"Creating LLM provider with type={llm_config.type}, model={llm_config.model}")
        try:
            llm_provider = LLMProviderFactory.create_provider(
                llm_config.type,
                {
                    "api_key": llm_config.api_key,
                    "model": llm_config.model,
                    "temperature": llm_config.temperature,
                    **(llm_config.options or {})
                }
            )
            logger.info(f"Successfully created LLM provider: {llm_provider.get_provider_name()}")
        except Exception as e:
            logger.error(f"Error creating LLM provider: {str(e)}")
            raise
        
        # Create context with Playwright browser
        context = BrowserUseContext(llm_provider, headless=request.headless)
        
        # Start recording if enabled
        if request.recording_config and request.recording_config.enabled:
            recording_process = await context.start_recording(request.recording_config.dict())
            if recording_process:
                task_status.metadata["recording_enabled"] = True
        
        # Execute task with timeout
        result = await asyncio.wait_for(
            context.execute_task(request.task),
            timeout=request.operation_timeout
        )
        
        # Update task status
        task_status.status = "completed"
        task_status.result = result
        task_status.end_time = datetime.now()
        task_status.progress = 1.0
        
    except asyncio.TimeoutError:
        task_status.status = "failed"
        task_status.error = f"Task execution timed out after {request.operation_timeout} seconds"
        task_status.end_time = datetime.now()
    except Exception as e:
        task_status.status = "failed"
        task_status.error = str(e)
        task_status.end_time = datetime.now()
    finally:
        # Stop recording if started
        if recording_process and context:
            try:
                recording_path = await context.stop_recording(recording_process)
                if recording_path:
                    task_status.metadata["recording_path"] = recording_path
            except Exception as e:
                logger.error(f"Error stopping recording: {str(e)}")
        
        # Clean up browser resources
        if context:
            try:
                await context._cleanup()
            except Exception as e:
                logger.error(f"Error cleaning up browser resources: {str(e)}")
        
        # Move from active to history
        if task_id in active_tasks:
            task_history[task_id] = active_tasks[task_id]
            del active_tasks[task_id]
        
        # Broadcast final update
        await broadcast_task_update(task_id, task_status)
    
    return task_status

# Additional endpoints for task management, screenshots, recordings, etc.
# (Implement as shown in the monitoring plan)

# WebSocket for real-time updates
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    connected_clients[client_id] = websocket
    
    try:
        while True:
            # Wait for messages (heartbeat)
            await websocket.receive_text()
    except WebSocketDisconnect:
        if client_id in connected_clients:
            del connected_clients[client_id]

# Broadcast task status update to all connected clients
async def broadcast_task_update(task_id: str, task_status: TaskStatus):
    """Broadcast task status update to all connected clients"""
    if not connected_clients:
        return
    
    message = {
        "type": "task_update",
        "task_id": task_id,
        "status": task_status.dict()
    }
    
    for client_id, websocket in list(connected_clients.items()):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending update to client {client_id}: {str(e)}")
            if client_id in connected_clients:
                del connected_clients[client_id]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.get("/providers")
async def get_providers():
    """Return a list of available LLM providers"""
    providers = get_available_llm_providers()
    return {
        "providers": providers,
        "default": get_default_provider()
    }

# Get task status
@app.get("/execute/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    """Get the status of a task"""
    if task_id in active_tasks:
        return active_tasks[task_id]
    elif task_id in task_history:
        return task_history[task_id]
    else:
        raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found")

# Get all tasks
@app.get("/tasks", response_model=Dict[str, List[TaskStatus]])
async def get_all_tasks():
    """Get all tasks (active and history)"""
    return {
        "active": list(active_tasks.values()),
        "history": list(task_history.values())
    }

# Take a screenshot
@app.post("/screenshot")
async def take_screenshot():
    """Take a screenshot of the current browser state"""
    try:
        # Create a temporary context for the screenshot
        context = BrowserUseContext(
            LLMProviderFactory.create_provider(
                get_default_provider(),
                {"api_key": get_api_key_for_provider(get_default_provider())}
            ),
            headless=False
        )
        
        # Take screenshot
        screenshot = await context.take_screenshot()
        
        # Clean up
        await context._cleanup()
        
        if screenshot:
            # Return as base64
            return {"screenshot": base64.b64encode(screenshot).decode('utf-8')}
        else:
            raise HTTPException(status_code=500, detail="Failed to take screenshot")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))