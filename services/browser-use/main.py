# main.py - FastAPI integration

import asyncio
import base64
import logging
import os
import uuid
from datetime import datetime
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import WebSocket
from fastapi import WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import gradio as gr
from contextlib import asynccontextmanager

# Import configuration
from config import AppConfig
from config import get_api_key_for_provider
from config import get_available_llm_providers
from config import get_default_model_for_provider
from config import get_default_provider
from core.context import BrowserUseContext
from core.session_manager import SessionManager
# Import our LLM strategy implementation
from strategies.llm.factory import LLMProviderFactory

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI with lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup and clean up on shutdown"""
    global session_manager
    # Startup logic
    session_manager.start()
    logger.info("Application started")
    
    yield  # This is where FastAPI serves requests
    
    # Shutdown logic
    await session_manager.stop()
    logger.info("Application shutdown")

app = FastAPI(title="Browser Use Service", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "screenshots")
RECORDINGS_DIR = os.path.join(BASE_DIR, "recordings")

# Ensure directories exist
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
os.makedirs(RECORDINGS_DIR, exist_ok=True)

# Create Gradio interface
from core.visualization import create_browser_interface

# Mount Gradio app
interface = create_browser_interface(SCREENSHOTS_DIR, RECORDINGS_DIR)
app = gr.mount_gradio_app(app, interface, path="/visualize")

# Default operation timeout (in seconds)
DEFAULT_OPERATION_TIMEOUT = AppConfig.DEFAULT_OPERATION_TIMEOUT

# Global variables
active_tasks = {}
task_history = {}
connected_clients = {}
visualization = None

# Initialize session manager
session_manager = SessionManager(session_timeout_minutes=AppConfig.SESSION_TIMEOUT_MINUTES)

# Task status model
class TaskStatus(BaseModel):
    task_id: str
    status: str  # "pending", "running", "completed", "failed", "needs_assistance", "paused"
    progress: float = 0.0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    assistance_message: Optional[str] = None  # Message explaining why assistance is needed

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
    persistent_session: Optional[bool] = False
    options: Optional[Dict[str, Any]] = None

# Execute a browser task
@app.post("/execute", response_model=TaskStatus)
async def execute_task(request: TaskRequest):
    """Execute a browser task"""
    global visualization
    
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
        metadata={
            "persistent_session": request.persistent_session
        }
    )

    # Store task in active tasks
    active_tasks[task_id] = task_status

    # Run task in background
    asyncio.create_task(run_task(task_id, request, task_status))

    return task_status

# Run a task in the background
async def run_task(task_id: str, request: TaskRequest, task_status: TaskStatus):
    """Run a task in the background"""
    try:
        # Create a new browser context or reuse an existing one
        reused_session = False
        context = None
        
        # Check if we should use a persistent session
        if request.persistent_session:
            # Try to find an existing session
            for session_id, ctx in session_manager.sessions.items():
                if ctx.persistent:
                    logger.info(f"Reusing persistent session {session_id}")
                    context = ctx
                    context.task_id = task_id  # Update the task ID for the context
                    reused_session = True
                    task_status.metadata = task_status.metadata or {}
                    task_status.metadata["reused_session"] = True
                    task_status.metadata["session_id"] = session_id
                    break
        
        # If no existing session found, create a new one
        if not context:
            # Configure LLM provider
            llm_provider = None
            
            # Get model from options if available
            model = request.options.get('model') if request.options else None
            provider_type = get_default_provider()
            
            try:
                # Always create an LLM provider, using default model if none specified
                llm_provider = LLMProviderFactory.create_provider(
                    provider_type=provider_type,
                    config={
                        "api_key": get_api_key_for_provider(provider_type),
                        "model": model or get_default_model_for_provider(provider_type),
                        "temperature": 0.7,  # Default temperature
                        "options": request.options
                    }
                )
                logger.info(f"Created LLM provider with model: {model or get_default_model_for_provider(provider_type)}")
            except ValueError as e:
                logger.error(f"Error creating LLM provider: {str(e)}")
                task_status.status = "failed"
                task_status.error = str(e)
                await broadcast_task_update(task_id, task_status)
                return
            
            # Create a new browser context
            context = BrowserUseContext(
                llm_provider=llm_provider,
                headless=request.headless,
                metadata={"task_id": task_id},
                persistent=request.persistent_session,
                task_id=task_id
            )
            
            # Register the session
            if request.persistent_session:
                session_manager.add_session(context.session_id, context)
                task_status.metadata = task_status.metadata or {}
                task_status.metadata["session_id"] = context.session_id
        
        # Update task status
        task_status.status = "running"
        task_status.start_time = datetime.now()
        await broadcast_task_update(task_id, task_status)
        
        # Execute the task
        result = await context.execute_task(request.task)
        
        # Check if the task needs assistance
        if result.get("status") == "needs_assistance":
            task_status.status = "needs_assistance"
            task_status.assistance_message = result.get("message", "Assistance needed")
            task_status.metadata = task_status.metadata or {}
            task_status.metadata["screenshot"] = result.get("screenshot")
            
            # Don't mark the task as completed yet
            await broadcast_task_update(task_id, task_status)
            
            # Keep the task in active_tasks
            return
        
        # Check if the task is paused
        if result.get("status") == "paused":
            task_status.status = "paused"
            task_status.metadata = task_status.metadata or {}
            task_status.metadata["pause_reason"] = result.get("message", "Task paused")
            task_status.metadata["screenshot"] = result.get("screenshot")
            
            # Don't mark the task as completed yet
            await broadcast_task_update(task_id, task_status)
            
            # Keep the task in active_tasks
            return
        
        # Update task status with result
        task_status.status = "completed"
        task_status.end_time = datetime.now()
        task_status.result = result
        task_status.progress = 1.0
        
        # Broadcast task update
        await broadcast_task_update(task_id, task_status)
        
    except Exception as e:
        logger.error(f"Error running task: {str(e)}")
        task_status.status = "failed"
        task_status.error = str(e)
        task_status.end_time = datetime.now()
        
        # Broadcast task update
        await broadcast_task_update(task_id, task_status)
    
    finally:
        # If this is a persistent session and the task completed successfully or is paused/needs assistance,
        # don't clean up the browser resources
        if not (request.persistent_session and (task_status.status == "completed" or 
                                               task_status.status == "paused" or 
                                               task_status.status == "needs_assistance")):
            # For non-persistent sessions or failed tasks, clean up immediately
            if context and context.persistent:
                # For persistent sessions, let the session manager handle it
                await session_manager.close_session(context.session_id, force=task_status.status == "failed")
            elif context:
                # For non-persistent sessions, clean up immediately
                await context._cleanup()
        
        # Move completed or failed tasks to history
        if task_id in active_tasks and task_status.status in ["completed", "failed"]:
            task_history[task_id] = active_tasks[task_id]
            del active_tasks[task_id]
        # Don't remove tasks that are paused or need assistance from active_tasks

# WebSocket for real-time updates
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time updates"""
    try:
        await websocket.accept()
        connected_clients[client_id] = websocket
        logger.info(f"Client {client_id} connected")
        
        # Keep connection alive and handle disconnection
        try:
            while True:
                # Wait for any message - this keeps the connection alive
                data = await websocket.receive_text()
                logger.debug(f"Received message from client {client_id}: {data}")
        except WebSocketDisconnect:
            logger.info(f"Client {client_id} disconnected")
        finally:
            # Clean up client on disconnect
            if client_id in connected_clients:
                del connected_clients[client_id]
                logger.info(f"Removed client {client_id} from connected clients")
    except Exception as e:
        logger.error(f"Error in WebSocket connection for client {client_id}: {str(e)}")
        if client_id in connected_clients:
            del connected_clients[client_id]
        raise

# Broadcast task status update to all connected clients
async def broadcast_task_update(task_id: str, task_status: TaskStatus):
    """Broadcast task status update to all connected clients"""
    if not connected_clients:
        return
        
    # Create update message
    update = {
        "type": "task_update",
        "task_id": task_id,
        "status": task_status.dict()
    }
    
    # Send update to all connected clients
    disconnected_clients = []
    for client_id, websocket in connected_clients.items():
        try:
            await websocket.send_json(update)
        except WebSocketDisconnect:
            disconnected_clients.append(client_id)
            logger.info(f"Client {client_id} disconnected during broadcast")
        except Exception as e:
            disconnected_clients.append(client_id)
            logger.error(f"Error sending update to client {client_id}: {str(e)}")
    
    # Clean up disconnected clients
    for client_id in disconnected_clients:
        if client_id in connected_clients:
            del connected_clients[client_id]
            logger.info(f"Removed disconnected client {client_id}")

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

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "running",
        "service": "browser-use",
        "visualization": {
            "vnc": "http://localhost:6080/vnc.html",
            "dashboard": "/visualize"
        }
    }

@app.get("/screenshots")
async def list_screenshots():
    """List available screenshots"""
    try:
        screenshots = [f for f in os.listdir(SCREENSHOTS_DIR) if f.endswith('.png')]
        screenshots.sort(key=lambda x: os.path.getctime(os.path.join(SCREENSHOTS_DIR, x)), reverse=True)
        return {
            "screenshots": [
                {
                    "filename": s,
                    "url": f"/screenshots/{s}",
                    "timestamp": os.path.getctime(os.path.join(SCREENSHOTS_DIR, s))
                }
                for s in screenshots
            ]
        }
    except Exception as e:
        logger.error(f"Error listing screenshots: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recordings")
async def list_recordings():
    """List available recordings"""
    try:
        recordings = [f for f in os.listdir(RECORDINGS_DIR) if f.endswith('.gif')]
        recordings.sort(key=lambda x: os.path.getctime(os.path.join(RECORDINGS_DIR, x)), reverse=True)
        return {
            "recordings": [
                {
                    "filename": r,
                    "url": f"/recordings/{r}",
                    "timestamp": os.path.getctime(os.path.join(RECORDINGS_DIR, r))
                }
                for r in recordings
            ]
        }
    except Exception as e:
        logger.error(f"Error listing recordings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sessions/{session_id}/close")
async def close_session(session_id: str, force: bool = False):
    """Explicitly close a browser session"""
    global session_manager
    
    # Check if session exists
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    # Close the session
    await session_manager.close_session(session_id, force=force)
    
    return {"status": "success", "message": f"Session {session_id} closed successfully"}

@app.get("/sessions")
async def list_sessions():
    """List all active browser sessions"""
    global session_manager
    
    sessions = []
    for session_id, context in session_manager.sessions.items():
        last_activity = session_manager.last_activity.get(session_id, datetime.now())
        sessions.append({
            "session_id": session_id,
            "persistent": context.persistent,
            "last_activity": last_activity.isoformat(),
            "headless": context.headless,
            "metadata": context.metadata
        })
    
    return {"sessions": sessions}

# Add a new endpoint to request assistance for a task
@app.post("/execute/{task_id}/assistance", response_model=TaskStatus)
async def request_assistance(task_id: str, message: str = "Assistance needed"):
    """Request assistance for a task"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found")
    
    task_status = active_tasks[task_id]
    task_status.status = "needs_assistance"
    task_status.assistance_message = message
    
    # Broadcast update
    await broadcast_task_update(task_id, task_status)
    
    return task_status

# Add a new endpoint to resolve assistance for a task
@app.post("/execute/{task_id}/resolve", response_model=TaskStatus)
async def resolve_assistance(task_id: str):
    """Resolve assistance for a task and resume execution"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found")
    
    task_status = active_tasks[task_id]
    
    # Only resume if the task was in needs_assistance state
    if task_status.status != "needs_assistance":
        raise HTTPException(status_code=400, detail=f"Task with ID {task_id} is not in needs_assistance state")
    
    # Resume task execution
    task_status.status = "running"
    task_status.assistance_message = None
    
    # Broadcast update
    await broadcast_task_update(task_id, task_status)
    
    return task_status

@app.post("/execute/{task_id}/pause", response_model=TaskStatus)
async def pause_task(task_id: str):
    """Pause a running task"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found")
    
    task_status = active_tasks[task_id]
    
    # Only pause if the task is running
    if task_status.status != "running":
        raise HTTPException(status_code=400, detail=f"Task with ID {task_id} is not in running state")
    
    # Update task status
    task_status.status = "paused"
    task_status.metadata = task_status.metadata or {}
    task_status.metadata["paused_at"] = datetime.now().isoformat()
    
    # Get the browser context for this task
    context = None
    for session_id, ctx in session_manager.sessions.items():
        if ctx.task_id == task_id:
            context = ctx
            break
    
    if context:
        # Take a screenshot to show the current state
        screenshot_path = await context.take_screenshot()
        if screenshot_path:
            task_status.metadata["pause_screenshot"] = os.path.basename(screenshot_path)
    
    # Broadcast update
    await broadcast_task_update(task_id, task_status)
    
    return task_status

@app.post("/execute/{task_id}/resume", response_model=TaskStatus)
async def resume_task(task_id: str):
    """Resume a paused task"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found")
    
    task_status = active_tasks[task_id]
    
    # Only resume if the task is paused
    if task_status.status != "paused":
        raise HTTPException(status_code=400, detail=f"Task with ID {task_id} is not in paused state")
    
    # Update task status
    task_status.status = "running"
    task_status.metadata = task_status.metadata or {}
    task_status.metadata["resumed_at"] = datetime.now().isoformat()
    
    # Broadcast update
    await broadcast_task_update(task_id, task_status)
    
    return task_status
