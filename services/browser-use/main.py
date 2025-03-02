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
    status: str  # "pending", "running", "completed", "failed", "needs_assistance"
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
    global session_manager
    recording_process = None
    context = None
    reused_session = False

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

        # Check if we should reuse an existing session
        if request.persistent_session and request.task_id:
            # Try to get an existing session with the same ID
            existing_context = session_manager.get_session(request.task_id)
            if existing_context:
                logger.info(f"Reusing existing browser session {request.task_id}")
                context = existing_context
                # Update the LLM provider
                context.llm_provider = llm_provider
                reused_session = True
        
        # Create a new context if we didn't reuse one
        if not context:
            # Create context with Playwright browser
            context = BrowserUseContext(
                llm_provider, 
                headless=request.headless,
                session_id=request.task_id or task_id,
                persistent=request.persistent_session
            )
            
            # If this is a persistent session, add it to the session manager
            if request.persistent_session:
                session_manager.add_session(context)

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

        # Check if the task needs assistance
        if result.get("status") == "needs_assistance":
            task_status.status = "needs_assistance"
            task_status.assistance_message = result.get("message", "Assistance needed")
            task_status.metadata["screenshot"] = result.get("screenshot")
            
            # Don't mark the task as completed yet
            await broadcast_task_update(task_id, task_status)
            
            # Keep the task in active_tasks
            return
            
        # Update task status
        task_status.status = "completed"
        task_status.result = result
        task_status.end_time = datetime.now()
        task_status.progress = 1.0
        
        # Add session info to metadata
        task_status.metadata["session_id"] = context.session_id
        task_status.metadata["persistent_session"] = context.persistent
        task_status.metadata["reused_session"] = reused_session

        # Store in history
        task_history[task_id] = task_status

        # Broadcast update
        await broadcast_task_update(task_id, task_status)

    except asyncio.TimeoutError:
        logger.error(f"Task {task_id} timed out after {request.operation_timeout} seconds")
        task_status.status = "failed"
        task_status.error = f"Task timed out after {request.operation_timeout} seconds"
        task_status.end_time = datetime.now()

        # Store in history
        task_history[task_id] = task_status

        # Broadcast update
        await broadcast_task_update(task_id, task_status)

    except Exception as e:
        logger.error(f"Error executing task {task_id}: {str(e)}")
        task_status.status = "failed"
        task_status.error = str(e)
        task_status.end_time = datetime.now()

        # Store in history
        task_history[task_id] = task_status

        # Broadcast update
        await broadcast_task_update(task_id, task_status)

    finally:
        # Clean up resources
        if context:
            try:
                # Stop recording if it was started
                if recording_process:
                    await context.stop_recording(recording_process)

                # If this is a persistent session and the task completed successfully,
                # don't clean up the browser resources
                if not (request.persistent_session and task_status.status == "completed"):
                    # For non-persistent sessions or failed tasks, clean up immediately
                    if context.persistent:
                        # For persistent sessions, let the session manager handle it
                        await session_manager.close_session(context.session_id, force=task_status.status != "completed")
                    else:
                        # For non-persistent sessions, clean up immediately
                        await context._cleanup()
                    logger.info(f"Cleaned up resources for task {task_id}")
            except Exception as e:
                logger.error(f"Error cleaning up resources for task {task_id}: {str(e)}")

        # Remove from active tasks only if not waiting for assistance
        if task_id in active_tasks and task_status.status != "needs_assistance":
            del active_tasks[task_id]

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
