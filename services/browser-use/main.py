# main.py - FastAPI integration

import asyncio
import base64
import logging
import os
import uuid
from datetime import datetime, timedelta
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

# Global variables for tracking application state
startup_time = None
cleanup_task = None

# Initialize FastAPI with lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup and clean up on shutdown"""
    global session_manager, startup_time, cleanup_task
    
    # Startup logic
    startup_time = datetime.now()
    session_manager.start()
    logger.info("Application started")
    
    # Start the task cleanup background task
    cleanup_task = asyncio.create_task(periodic_task_cleanup())
    logger.info("Started periodic task cleanup")
    
    yield  # This is where FastAPI serves requests
    
    # Shutdown logic
    logger.info("Application shutting down, cleaning up resources...")
    
    # Cancel the cleanup task
    if cleanup_task:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass
    
    # Close all active browser sessions
    for session_id, session in list(session_manager.sessions.items()):
        try:
            logger.info(f"Closing browser session {session_id}")
            await session_manager.close_session(session_id, force=True)
        except Exception as e:
            logger.error(f"Error closing browser session {session_id} during shutdown: {e}")
    
    # Update all active tasks to failed state if they're still running
    for task_id, task_status in list(active_tasks.items()):
        if task_status.status in ["running", "paused", "pending"]:
            task_status.status = "failed"
            task_status.error = "Task terminated due to service shutdown"
            task_status.end_time = datetime.now()
            
            # Move to history
            task_history[task_id] = task_status
            del active_tasks[task_id]
    
    await session_manager.stop()
    logger.info("Application shutdown complete")

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

# Task cleanup function
async def periodic_task_cleanup():
    """Periodically clean up stale tasks and sessions"""
    while True:
        try:
            logger.info("Running periodic task cleanup")
            now = datetime.now()
            stale_threshold = now - timedelta(minutes=AppConfig.SESSION_TIMEOUT_MINUTES)
            
            # Check for stale tasks
            for task_id, task_status in list(active_tasks.items()):
                # Skip tasks that are not in a running or paused state
                if task_status.status not in ["running", "paused"]:
                    continue
                
                # Check last activity time
                last_activity = None
                if task_status.metadata and "last_activity" in task_status.metadata:
                    try:
                        last_activity = datetime.fromisoformat(task_status.metadata["last_activity"])
                    except (ValueError, TypeError):
                        pass
                
                # If no last activity or it's stale
                if not last_activity or last_activity < stale_threshold:
                    logger.info(f"Cleaning up stale task {task_id}")
                    
                    # Find associated session
                    session_id = None
                    if task_status.metadata and "session_id" in task_status.metadata:
                        session_id = task_status.metadata["session_id"]
                    
                    # Close the session if it exists
                    if session_id and session_id in session_manager.sessions:
                        try:
                            logger.info(f"Closing stale session {session_id}")
                            await session_manager.close_session(session_id, force=True)
                        except Exception as e:
                            logger.error(f"Error closing stale session {session_id}: {e}")
                    
                    # Update task status
                    task_status.status = "failed"
                    task_status.error = "Task terminated due to inactivity"
                    task_status.end_time = now
                    
                    # Move to history
                    task_history[task_id] = task_status
                    del active_tasks[task_id]
                    
                    # Broadcast update
                    await broadcast_task_update(task_id, task_status)
            
            # Check for completed tasks in history that should be removed
            completed_threshold = now - timedelta(minutes=30)  # Remove completed tasks after 30 minutes
            for task_id, task_status in list(task_history.items()):
                if task_status.status == "completed" and task_status.end_time:
                    # If the task completed more than 30 minutes ago, remove it from history
                    if task_status.end_time < completed_threshold:
                        logger.info(f"Removing old completed task {task_id} from history")
                        del task_history[task_id]
            
            # Also check for orphaned sessions (sessions without an active task)
            for session_id, context in list(session_manager.sessions.items()):
                # Check if this session is associated with an active task
                task_found = False
                for task_id, task_status in active_tasks.items():
                    if task_status.metadata and task_status.metadata.get("session_id") == session_id:
                        task_found = True
                        break
                
                # If no active task is using this session and it's not persistent, close it
                if not task_found and not context.persistent:
                    logger.info(f"Closing orphaned session {session_id}")
                    try:
                        await session_manager.close_session(session_id, force=True)
                    except Exception as e:
                        logger.error(f"Error closing orphaned session {session_id}: {e}")
                
                # For persistent sessions, check last activity
                elif context.persistent:
                    last_activity = session_manager.last_activity.get(session_id)
                    if last_activity and last_activity < stale_threshold:
                        logger.info(f"Closing stale persistent session {session_id}")
                        try:
                            await session_manager.close_session(session_id, force=True)
                        except Exception as e:
                            logger.error(f"Error closing stale persistent session {session_id}: {e}")
            
        except Exception as e:
            logger.error(f"Error in task cleanup: {e}")
        
        # Sleep for cleanup interval
        await asyncio.sleep(300)  # 5 minutes

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
        # Check if we should force cleanup of the existing task
        force = request.options.get('force', False) if request.options else False
        
        if force:
            logger.info(f"Force option enabled, cleaning up existing task {task_id}")
            
            # Get the existing task
            existing_task = active_tasks[task_id]
            
            # Check if there's an associated session to close
            session_id = existing_task.metadata.get("session_id") if existing_task.metadata else None
            if session_id and session_id in session_manager.sessions:
                try:
                    # Close the session
                    logger.info(f"Closing session {session_id} for task {task_id}")
                    await session_manager.close_session(session_id, force=True)
                except Exception as e:
                    logger.error(f"Error closing session {session_id} for task {task_id}: {e}")
            
            # Move the task to history
            task_history[task_id] = existing_task
            del active_tasks[task_id]
            
            # Wait a moment for resources to clean up
            await asyncio.sleep(0.5)
        else:
            # If force is not enabled, return an error
            raise HTTPException(status_code=400, detail=f"Task with ID {task_id} already exists")

    # Create task status
    task_status = TaskStatus(
        task_id=task_id,
        status="pending",
        start_time=datetime.now(),
        metadata={
            "persistent_session": request.persistent_session,
            "created_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat()
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
                    task_status.metadata["last_activity"] = datetime.now().isoformat()
                    
                    # Update session last activity
                    session_manager.last_activity[session_id] = datetime.now()
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
                session_manager.add_session(context)
                task_status.metadata = task_status.metadata or {}
                task_status.metadata["session_id"] = context.session_id
                task_status.metadata["last_activity"] = datetime.now().isoformat()
                
                # Initialize session last activity
                session_manager.last_activity[context.session_id] = datetime.now()
        
        # Update task status
        task_status.status = "running"
        task_status.start_time = datetime.now()
        await broadcast_task_update(task_id, task_status)
        
        # Execute the task
        result = await context.execute_task(request.task)
        
        # Update last activity
        task_status.metadata = task_status.metadata or {}
        task_status.metadata["last_activity"] = datetime.now().isoformat()
        if "session_id" in task_status.metadata:
            session_id = task_status.metadata["session_id"]
            session_manager.last_activity[session_id] = datetime.now()
        
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
                try:
                    await session_manager.close_session(context.session_id, force=task_status.status == "failed")
                    logger.info(f"Closed session {context.session_id} after task completion")
                except Exception as e:
                    logger.error(f"Error closing session {context.session_id}: {e}")
            elif context:
                # For non-persistent sessions, clean up immediately
                try:
                    await context._cleanup()
                    logger.info(f"Cleaned up non-persistent session after task completion")
                except Exception as e:
                    logger.error(f"Error cleaning up non-persistent session: {e}")
        
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
        "status": task_status.model_dump()
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
    """Health check endpoint with detailed status information"""
    global startup_time
    
    # Count tasks by status
    task_counts = {"total": len(active_tasks)}
    for status in ["pending", "running", "completed", "failed", "needs_assistance", "paused"]:
        task_counts[status] = sum(1 for t in active_tasks.values() if t.status == status)
    
    # Get session information
    session_count = len(session_manager.sessions)
    persistent_sessions = sum(1 for ctx in session_manager.sessions.values() if ctx.persistent)
    
    return {
        "status": "healthy",
        "uptime_seconds": (datetime.now() - startup_time).total_seconds() if startup_time else 0,
        "active_tasks": task_counts,
        "history_tasks": len(task_history),
        "sessions": {
            "total": session_count,
            "persistent": persistent_sessions,
            "non_persistent": session_count - persistent_sessions
        },
        "connected_clients": len(connected_clients),
        "version": "1.0.0"  # Replace with your actual version
    }

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
    """Explicitly close a browser session with improved error handling"""
    global session_manager
    
    # Check if session exists
    session = session_manager.get_session(session_id)
    if not session:
        # If force is true, we'll just return success even if session doesn't exist
        if force:
            return {"status": "success", "message": f"Session {session_id} not found (force=True)"}
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    try:
        # Close the session
        await session_manager.close_session(session_id, force=force)
        
        # Update any associated tasks
        for task_id, task_status in list(active_tasks.items()):
            if task_status.metadata and task_status.metadata.get("session_id") == session_id:
                if task_status.status in ["running", "paused"]:
                    task_status.status = "completed" if not force else "failed"
                    task_status.end_time = datetime.now()
                    if force:
                        task_status.error = "Session was forcibly closed"
                    
                    # Broadcast update
                    await broadcast_task_update(task_id, task_status)
                    
                    # Move to history if completed or failed
                    if task_status.status in ["completed", "failed"]:
                        task_history[task_id] = task_status
                        del active_tasks[task_id]
        
        return {"status": "success", "message": f"Session {session_id} closed successfully"}
    except Exception as e:
        # If force is true, we'll consider this a success even if there was an error
        if force:
            if session_id in session_manager.sessions:
                del session_manager.sessions[session_id]
            return {"status": "success", "message": f"Forced session {session_id} closure (with error: {str(e)})"}
        
        # Otherwise, report the error
        logger.error(f"Error closing session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error closing session: {str(e)}")

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
    
    # Check if the session still exists
    session_id = task_status.metadata.get("session_id") if task_status.metadata else None
    if not session_id or session_id not in session_manager.sessions:
        # Session is gone, we need to report this and not try to pause
        task_status.status = "failed"
        task_status.error = "Browser session was lost and cannot be paused"
        task_status.end_time = datetime.now()
        
        # Move to history
        task_history[task_id] = task_status
        del active_tasks[task_id]
        
        # Broadcast update
        await broadcast_task_update(task_id, task_status)
        
        raise HTTPException(
            status_code=400,
            detail=f"Browser session for task {task_id} was lost and cannot be paused"
        )
    
    # Update task status
    task_status.status = "paused"
    task_status.metadata = task_status.metadata or {}
    task_status.metadata["paused_at"] = datetime.now().isoformat()
    task_status.metadata["last_activity"] = datetime.now().isoformat()
    
    # Update session last activity
    session_manager.last_activity[session_id] = datetime.now()
    
    # Get the browser context for this task
    context = session_manager.get_session(session_id)
    
    if context:
        # Take a screenshot to show the current state
        try:
            screenshot_path = await context.take_screenshot()
            if screenshot_path:
                task_status.metadata["pause_screenshot"] = os.path.basename(screenshot_path)
        except Exception as e:
            logger.error(f"Error taking screenshot during pause: {e}")
    
    # Broadcast update
    await broadcast_task_update(task_id, task_status)
    
    return task_status

@app.post("/execute/{task_id}/resume", response_model=TaskStatus)
async def resume_task(task_id: str):
    """Resume a paused task with improved error handling for orphaned sessions"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found")
    
    task_status = active_tasks[task_id]
    
    # Only resume if the task is paused
    if task_status.status != "paused":
        raise HTTPException(status_code=400, detail=f"Task with ID {task_id} is not in paused state")
    
    # Check if the session still exists
    session_id = task_status.metadata.get("session_id") if task_status.metadata else None
    if not session_id or session_id not in session_manager.sessions:
        # Session is gone, we need to report this and not try to resume
        task_status.status = "failed"
        task_status.error = "Browser session was lost and cannot be resumed"
        task_status.end_time = datetime.now()
        
        # Move to history
        task_history[task_id] = task_status
        del active_tasks[task_id]
        
        # Broadcast update
        await broadcast_task_update(task_id, task_status)
        
        raise HTTPException(
            status_code=400,
            detail=f"Browser session for task {task_id} was lost and cannot be resumed"
        )
    
    # Update task status
    task_status.status = "running"
    task_status.metadata = task_status.metadata or {}
    task_status.metadata["last_activity"] = datetime.now().isoformat()
    task_status.metadata["resumed_at"] = datetime.now().isoformat()
    
    # Update session last activity
    session_manager.last_activity[session_id] = datetime.now()
    
    # Broadcast update
    await broadcast_task_update(task_id, task_status)
    
    return task_status
