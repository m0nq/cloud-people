import asyncio
import base64
import logging
import os
import sys
import time
import uuid
from datetime import datetime, timedelta
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
import copy
import json

# --- Restore original logger setup ---
logger = logging.getLogger(__name__) # Restore original logger
logger.propagate = False # Restore original setting
# --- End Restore ---

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic import Field
from pydantic import validator
import gradio as gr
from fastapi.encoders import jsonable_encoder

from core.agent_adapter import AgentAdapter
from core.state_utils import restore_state
from contextlib import asynccontextmanager

# Import configuration
from config import AppConfig
from config import get_api_key_for_provider
from config import get_available_llm_providers
from config import get_default_model_for_provider
from config import get_default_provider
from core.context import BrowserUseContext  # Legacy context, will be phased out
from core.session_manager import SessionManager
# Import our LLM strategy implementation
from strategies.llm.factory import LLMProviderFactory
# Import our new AgentAdapter
from core.agent_adapter import agent_adapter

# Load environment variables
load_dotenv()

# Global variables for tracking application state
startup_time = None
cleanup_task = None
active_tasks = {}  # Store active tasks by task_id
task_history = {}  # Store completed tasks by task_id
task_requests = {}  # Store original task requests by task_id
connected_clients = {}
visualization = None

# Initialize FastAPI with lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup and clean up on shutdown"""
    global session_manager, startup_time, cleanup_task
    
    # Startup logic
    startup_time = datetime.now()
    session_manager.start()
    logger.info("Application started")  # Revert to logger
    
    # Start the task cleanup background task
    logger.info("Attempting to start periodic task cleanup...")  # Revert to logger
    cleanup_task = asyncio.create_task(periodic_task_cleanup())
    logger.info(f"Periodic task cleanup created: {cleanup_task.get_name()}")  # Revert to logger
    
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
    
    # Close all active agents in the AgentAdapter
    for task_id, agent in list(agent_adapter.active_agents.items()):
        try:
            logger.info(f"Cleaning up agent for task {task_id}")
            await agent_adapter.cleanup_task(task_id)
        except Exception as e:
            logger.error(f"Error cleaning up agent for task {task_id} during shutdown: {e}")
    
    # Close all active browser sessions (legacy)
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
connected_clients = {}
visualization = None

# Initialize session manager
session_manager = SessionManager(session_timeout_minutes=AppConfig.SESSION_TIMEOUT_MINUTES)

# Task cleanup function
async def periodic_task_cleanup():
    # --- Explicit Logger Configuration --- 
    task_logger = logging.getLogger(__name__ + ".periodic_task") # Use a unique name
    task_logger.setLevel(logging.INFO) # Set desired level
    # Create handler only if logger doesn't have handlers already
    if not task_logger.hasHandlers(): 
        handler = logging.StreamHandler(sys.stdout) # Output to stdout
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        task_logger.addHandler(handler)
        task_logger.propagate = False # Prevent duplicate logs if root logger is also configured
    else:
        # Optional: Log if handlers already exist (for debugging setup)
        task_logger.info("Logger already configured, reusing existing handlers.")
    # --- End Explicit Logger Configuration ---
    
    task_logger.info("Starting periodic task cleanup loop...") # Log start

    while True:
        try:
            # Explicitly get logger inside the task loop
            task_logger.info("Running periodic task cleanup") # Use task_logger
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
                    task_logger.info(f"Cleaning up stale task {task_id}")
                    
                    # Clean up the agent if it exists
                    if task_id in agent_adapter.active_agents:
                        try:
                            task_logger.info(f"Cleaning up stale agent for task {task_id}")
                            await agent_adapter.cleanup_task(task_id)
                        except Exception as e:
                            task_logger.error(f"Error cleaning up stale agent for task {task_id}: {e}")
                    
                    # Find associated session (legacy)
                    session_id = None
                    if task_status.metadata and "session_id" in task_status.metadata:
                        session_id = task_status.metadata["session_id"]
                    
                    # Close the session if it exists (legacy)
                    if session_id and session_id in session_manager.sessions:
                        try:
                            task_logger.info(f"Closing stale session {session_id}")
                            await session_manager.close_session(session_id, force=True)
                        except Exception as e:
                            task_logger.error(f"Error closing stale session {session_id}: {e}")
                    
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
                        task_logger.info(f"Removing old completed task {task_id} from history")
                        del task_history[task_id]
            
            # Check for orphaned agents (agents without an active task)
            for task_id, agent in list(agent_adapter.active_agents.items()):
                if task_id not in active_tasks:
                    task_logger.info(f"Cleaning up orphaned agent for task {task_id}")
                    try:
                        await agent_adapter.cleanup_task(task_id)
                    except Exception as e:
                        task_logger.error(f"Error cleaning up orphaned agent for task {task_id}: {e}")
            
            # Also check for orphaned sessions (sessions without an active task) - legacy
            for session_id, session in list(session_manager.sessions.items()):
                # Check if this session is associated with an active task
                task_found = False
                for task_id, task_status in active_tasks.items():
                    if task_status.metadata and task_status.metadata.get("session_id") == session_id:
                        task_found = True
                        break
                
                # If no active task is using this session and it's not persistent, close it
                if not task_found and not session.persistent:
                    task_logger.info(f"Closing orphaned session {session_id}")
                    try:
                        await session_manager.close_session(session_id, force=True)
                    except Exception as e:
                        task_logger.error(f"Error closing orphaned session {session_id}: {e}")
                
                # For persistent sessions, check last activity
                elif session.persistent:
                    last_activity = session_manager.last_activity.get(session_id)
                    if last_activity and last_activity < stale_threshold:
                        task_logger.info(f"Closing stale persistent session {session_id}")
                        try:
                            await session_manager.close_session(session_id, force=True)
                        except Exception as e:
                            task_logger.error(f"Error closing stale persistent session {session_id}: {e}")
            
            # Sleep for a while before the next cleanup cycle
            await asyncio.sleep(60)  # Run every 60 seconds

        except Exception as e:
            # Use .exception() to include traceback
            task_logger.exception("Error during periodic task cleanup") 
            # Add print as fallback
            print(f"--- PERIODIC TASK: EXCEPTION: {e} ---") 
        
        await asyncio.sleep(60) # Run every 60 seconds

# Task creation response model
class TaskCreationResponseModel(BaseModel):
    taskId: str

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
    previous_agent_output: Optional[Dict[str, Any]] = None
    
    @validator('previous_agent_output')
    def validate_previous_output(cls, v):
        if v is not None:
            if not isinstance(v, dict):
                raise ValueError('Previous agent output must be a dictionary')
            # Iterate through the predecessor results (values in the dictionary)
            for key, result_value in v.items():
                if result_value is not None: # Only validate non-null results
                    # Check if the result itself is a dictionary
                    if not isinstance(result_value, dict):
                         raise ValueError(f'Result for predecessor "{key}" must be a dictionary or null')
                    # Check for mandatory fields within each result
                    if 'version' not in result_value:
                        raise ValueError(f'Result for predecessor "{key}" must contain a "version" field')
                    if 'timestamp' not in result_value:
                        raise ValueError(f'Result for predecessor "{key}" must contain a "timestamp" field')
                    # Note: 'data' field is optional in AgentResult, so no check here.
        return v

# Execute a browser task
@app.post("/execute", response_model=TaskCreationResponseModel)
async def execute_task(request: TaskRequest):
    """
    Execute a browser task.

    This endpoint creates a new task and executes it asynchronously.
    It returns the generated task ID.
    """
    # Generate task ID if not provided
    task_id = request.task_id or str(uuid.uuid4())

    # Check if task ID already exists
    if task_id in active_tasks:
        raise HTTPException(status_code=400, detail=f"Task ID {task_id} already exists")

    # Create task status (still needed internally)
    task_status = TaskStatus(
        task_id=task_id,
        status="pending",
        start_time=datetime.now()
    )

    # Store task status and request
    logger.info(f"EXECUTE: Attempting to add task_id: {task_id}")
    print(f"[execute_task] PRE-UPDATE: Attempting to add task {task_id}. Current active tasks ({len(active_tasks)}): {list(active_tasks.keys())}")
    active_tasks[task_id] = task_status
    print(f"[execute_task] POST-UPDATE: Task {task_id} added. Current active tasks ({len(active_tasks)}): {list(active_tasks.keys())}")
    task_requests[task_id] = request
    logger.info(f"EXECUTE: Task {task_id} added. Active tasks: {list(active_tasks.keys())}")

    # --- Use logger directly before background task ---
    logger.debug(f"--- DEBUG MARKER: Immediately before creating background task ---")
    print(f"--- PRINT MARKER: Immediately before creating background task ---", file=sys.stderr, flush=True)
    # --- END Add --- 

    # Start the task in a background task
    asyncio.create_task(run_task(task_id, request, task_status))

    # Return only the task ID using the simplified model
    print(f"[execute_task] Scheduling background task and returning response for {task_id}.")
    return TaskCreationResponseModel(taskId=task_id)

# Run a task in the background
async def run_task(task_id: str, request: TaskRequest, task_status: TaskStatus):
    """Run a task in the background"""
    logger.info(f"[run_task:{task_id}] Starting execution for task: '{request.task}'")
    try:
        # Update task status to running
        task_status.status = "running"
        await broadcast_task_update(task_id, task_status)
        
        # Get LLM provider configuration
        llm_provider = request.llm_provider or ProviderConfig(
            type=get_default_provider(),
            model=get_default_model_for_provider(get_default_provider()),
            api_key=get_api_key_for_provider(get_default_provider())
        )
        
        # Determine headless setting (default to True if None)
        is_headless = request.headless if request.headless is not None else True
        logger.info(f"[run_task:{task_id}] Headless mode: {is_headless}")

        # Extract previous agent output if available
        previous_agent_output = request.previous_agent_output
        if previous_agent_output:
            logger.info(f"[run_task:{task_id}] Task includes previous agent output.")

        # Execute task using the agent adapter
        response = await agent_adapter.execute_task(
            task=request.task,
            task_id=task_id,
            headless=is_headless, # Use determined headless value
            llm_provider=llm_provider,
            operation_timeout=request.operation_timeout or DEFAULT_OPERATION_TIMEOUT,
            options=request.options,
            previous_output=previous_agent_output  # Pass previous agent output
        )
        
        # Update task status based on adapter response
        adapter_status = response.get("status")
        logger.info(f"[run_task:{task_id}] Adapter finished with status: {adapter_status}")

        if adapter_status == "success":
            task_status.status = "completed"
        elif adapter_status in ["pending", "running", "completed", "failed", "needs_assistance", "paused"]:
             task_status.status = adapter_status
        else:
            task_status.status = "failed"
            task_status.error = f"Unknown status from adapter: {adapter_status}"
            logger.warning(f"[run_task:{task_id}] Received unknown status from adapter: {adapter_status}")
            
        task_status.result = response.get("result")
        # Capture error from adapter response if status is failed or if adapter provided one
        adapter_error = response.get("error")
        if task_status.status == "failed" and not task_status.error:
            task_status.error = adapter_error or "Error details not provided by adapter."
        elif adapter_error: # Prioritize adapter error if available
             task_status.error = adapter_error
             
        task_status.end_time = datetime.now()

    except Exception as e:
        # Log the exception immediately, including its type
        error_type = type(e).__name__
        error_msg = str(e)
        logger.exception(f"[run_task:{task_id}] Unhandled exception during execution: {error_type}: {error_msg}")
        logger.error(f"[run_task:{task_id}] EXCEPTION CAUGHT. Status before finally: 'failed'. Error: {task_status.error}")
        
        # Update task status to reflect the failure
        task_status.status = "failed"
        task_status.error = f"{error_type}: {error_msg}" # Store error type and message
        task_status.end_time = datetime.now()

    finally:
        # This block ensures cleanup happens even if the main try block completes or an exception occurs
        logger.info(f"[run_task:{task_id}] Entering finally block. Current status: {task_status.status}")
        
        # Ensure task is moved to history if in a terminal state (completed or failed)
        if task_status.status in ["completed", "failed"]:
            logger.info(f"[run_task:{task_id}] FINALLY: Task in terminal state ('{task_status.status}'). Preparing to move/update history.")
            logger.info(f"[run_task:{task_id}] FINALLY: State before move -> Active: {list(active_tasks.keys())}, History: {list(task_history.keys())}")
            try:
                logger.info(f"[run_task:{task_id}] Task in terminal state ('{task_status.status}'). Attempting cleanup.")
                # Check if already moved (could happen if exception occurred *after* successful completion logic)
                if task_id in active_tasks:
                    logger.info(f"[run_task:{task_id}] Task found in active_tasks. Moving to history.")
                    # Move the actual TaskStatus object
                    task_history[task_id] = active_tasks.pop(task_id)
                    logger.info(f"[run_task:{task_id}] Task successfully moved to history. Active: {list(active_tasks.keys())}, History: {list(task_history.keys())}")
                elif task_id not in task_history:
                     # This case handles if the task failed very early or the except block was hit
                     logger.warning(f"[run_task:{task_id}] Task not found in active_tasks. Placing current status directly into history.")
                     task_history[task_id] = task_status # Add current status object directly if missing
                     logger.info(f"[run_task:{task_id}] Task status placed in history. Active: {list(active_tasks.keys())}, History: {list(task_history.keys())}")
                     logger.info(f"[run_task:{task_id}] FINALLY: State after adding missing to history -> Active: {list(active_tasks.keys())}, History: {list(task_history.keys())}")
                else:
                    # Task is already in history, maybe update it?
                    logger.info(f"[run_task:{task_id}] Task already present in task_history. Status: {task_history[task_id].status}. Updating if necessary.")
                    # Optionally update the history entry if needed, e.g., with a more specific error
                    task_history[task_id] = task_status # Ensure latest status object is stored
                    logger.info(f"[run_task:{task_id}] FINALLY: State after updating history -> Active: {list(active_tasks.keys())}, History: {list(task_history.keys())}")
            except Exception as final_e:
                 logger.exception(f"[run_task:{task_id}] CRITICAL: Exception during final cleanup! Error: {final_e}")
                 logger.error(f"[run_task:{task_id}] FINALLY: State during cleanup exception -> Active: {list(active_tasks.keys())}, History: {list(task_history.keys())}")

        # Broadcast final status update AFTER moving/updating history
        await broadcast_task_update(task_id, task_status)
        logger.info(f"[run_task:{task_id}] Finished execution and cleanup.")

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
@app.get("/execute/{task_id}/status", response_model=TaskStatus)
async def get_task_status(task_id: str, request: Request):
    logger.info(f"GET_STATUS: Received request for task_id: {task_id}") 
    logger.debug(f"GET_STATUS: Current active tasks: {list(active_tasks.keys())}") 
    logger.debug(f"GET_STATUS: Current task history: {list(task_history.keys())}") 

    # First check our local task tracking
    if task_id in active_tasks:
        logger.info(f"GET_STATUS: Task {task_id} found in active_tasks.") 
        # For active tasks, check if we have an agent in the adapter
        agent_status = agent_adapter.get_task_status(task_id)
        
        if agent_status["status"] != "not_found":
            # Update our local task status with the agent status
            task_status = active_tasks[task_id]
            task_status.status = agent_status["status"]
            return task_status # Return updated active status

        # Return existing active status if agent doesn't know about it (shouldn't happen often)
        logger.warning(f"GET_STATUS: Task {task_id} in active_tasks, but agent_adapter status is 'not_found'. Returning local status.")
        return active_tasks[task_id]

    elif task_id in task_history:
        logger.info(f"GET_STATUS: Task {task_id} found in task_history.") 
        return task_history[task_id]
    else:
        logger.warning(f"GET_STATUS_404: Task {task_id} not found. Final check. Active tasks: {list(active_tasks.keys())}, History: {list(task_history.keys())}")
        logger.error(f"GET_STATUS: Task {task_id} not found anywhere. Returning 404.") 
        logger.error(f"GET_STATUS_RAISING_404: Task {task_id}. Raising HTTPException. Active: {list(active_tasks.keys())}, History: {list(task_history.keys())}")
        raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found")

# Get all tasks
@app.get("/tasks", response_model=Dict[str, List[TaskStatus]])
async def get_all_tasks():
    """
    Get all tasks (active and history).
    
    This endpoint returns all active and historical tasks, including those managed by the agent adapter.
    """
    # Get tasks from our tracking
    active = list(active_tasks.values())
    history = list(task_history.values())
    
    # Get task IDs we're already tracking
    tracked_task_ids = set(active_tasks.keys()) | set(task_history.keys())
    
    # Get all agents from the adapter
    for task_id, agent in agent_adapter.active_agents.items():
        # Skip tasks we're already tracking
        if task_id in tracked_task_ids:
            continue
        
        # Get status from agent
        agent_status = agent_adapter.get_task_status(task_id)
        
        # Create a TaskStatus object for this agent
        if agent_status["status"] != "not_found":
            task_status = TaskStatus(
                task_id=task_id,
                status=agent_status["status"],
                metadata={"recovered_from_agent": True}
            )
            active.append(task_status)
    
    return {
        "active": active,
        "history": history
    }

# Take a screenshot
@app.post("/screenshot")
async def take_screenshot(url: str = "https://example.com"):
    """Take a screenshot of a website"""
    try:
        # Import the Playwright module
        from playwright.async_api import async_playwright
        
        # Initialize Playwright
        playwright = await async_playwright().start()
        
        try:
            # Launch a browser
            browser = await playwright.chromium.launch(headless=True)
            
            # Create a new page
            page = await browser.new_page()
            
            # Navigate to the URL
            await page.goto(url)
            
            # Wait for the page to load
            await page.wait_for_load_state("networkidle")
            
            # Take a screenshot
            screenshot_bytes = await page.screenshot(full_page=True)
            
            # Close the browser
            await browser.close()
            
            # Return as base64
            return {"screenshot": base64.b64encode(screenshot_bytes).decode('utf-8')}
        except Exception as e:
            logger.error(f"Error taking screenshot: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            # Close Playwright
            await playwright.stop()
    except Exception as e:
        logger.error(f"Error taking screenshot: {str(e)}", exc_info=True)
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
    # Check if any active agents are using this session
    session_agents = []
    for task_id, agent in agent_adapter.active_agents.items():
        # Check if this agent is using the specified session
        if hasattr(agent, '_context') and agent._context and getattr(agent._context, 'session_id', None) == session_id:
            session_agents.append((task_id, agent))
    
    if not session_agents:
        # If force is true, we'll just return success even if session doesn't exist
        if force:
            return {"status": "success", "message": f"Session {session_id} not found (force=True)"}
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    try:
        # Close each agent using this session
        for task_id, agent in session_agents:
            try:
                # Close the browser context
                if agent._browser_context:
                    await agent._browser_context.close()
                
                # Close the browser if it's not shared
                if agent._browser and not agent._shared_browser:
                    await agent._browser.close()
                
                # Remove from active agents
                await agent_adapter.cleanup_task(task_id)
                
                # Update any associated tasks
                if task_id in active_tasks:
                    task_status = active_tasks[task_id]
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
            except Exception as e:
                logger.warning(f"Error closing agent for task {task_id}: {e}")
                if not force:
                    raise
        
        return {"status": "success", "message": f"Session {session_id} closed successfully"}
    except Exception as e:
        # If force is true, we'll consider this a success even if there was an error
        if force:
            return {"status": "success", "message": f"Forced session {session_id} closure (with error: {str(e)})"}
        
        # Otherwise, report the error
        logger.error(f"Error closing session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error closing session: {str(e)}")

@app.get("/sessions")
async def list_sessions():
    """List all active browser sessions"""
    sessions = []
    session_ids = set()
    
    # Collect session information from active agents
    for task_id, agent in agent_adapter.active_agents.items():
        if hasattr(agent, '_context') and agent._context:
            session_id = getattr(agent._context, 'session_id', None)
            if session_id and session_id not in session_ids:
                session_ids.add(session_id)
                
                # Get metadata from the task if available
                metadata = {}
                if task_id in active_tasks and active_tasks[task_id].metadata:
                    metadata = active_tasks[task_id].metadata
                
                # Determine if this is a persistent session
                persistent = False
                if hasattr(agent, '_config'):
                    persistent = getattr(agent._config, 'persistent_session', False)
                
                # Get last activity time
                last_activity = datetime.now()
                if metadata and "last_activity" in metadata:
                    try:
                        last_activity = datetime.fromisoformat(metadata["last_activity"])
                    except (ValueError, TypeError):
                        pass
                
                sessions.append({
                    "session_id": session_id,
                    "persistent": persistent,
                    "last_activity": last_activity.isoformat(),
                    "headless": getattr(agent, '_headless', True),
                    "metadata": metadata
                })
    
    return {"sessions": sessions}

# Add a new endpoint to request assistance for a task
@app.post("/execute/{task_id}/assistance", response_model=TaskStatus)
async def request_assistance(task_id: str, message: str = "Assistance needed"):
    """
    Request assistance for a task.
    
    This endpoint marks a task as needing assistance and stores the assistance message.
    """
    # Check if task exists in our tracking
    if task_id not in active_tasks:
        # Try to get task status from agent
        agent_status = agent_adapter.get_task_status(task_id)
        if agent_status["status"] == "not_found":
            raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found")
        
        # Create a new TaskStatus object if task exists in agent but not in our tracking
        task_status = TaskStatus(
            task_id=task_id,
            status=agent_status["status"],
            metadata={"recovered_from_agent": True}
        )
        active_tasks[task_id] = task_status
    else:
        task_status = active_tasks[task_id]
    
    # Update task status
    task_status.status = "needs_assistance"
    task_status.assistance_message = message
    
    # Broadcast update
    await broadcast_task_update(task_id, task_status)
    
    return task_status

# Add a new endpoint to resolve assistance for a task
@app.post("/execute/{task_id}/resolve", response_model=TaskStatus)
async def resolve_assistance(task_id: str):
    """
    Resolve assistance for a task and resume execution.
    
    This endpoint resolves the assistance request for a task and resumes its execution.
    """
    # Check if task exists in our tracking
    if task_id not in active_tasks:
        # Try to get task status from agent
        agent_status = agent_adapter.get_task_status(task_id)
        if agent_status["status"] == "not_found":
            raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found")
        
        # Create a new TaskStatus object if task exists in agent but not in our tracking
        task_status = TaskStatus(
            task_id=task_id,
            status=agent_status["status"],
            metadata={"recovered_from_agent": True}
        )
        active_tasks[task_id] = task_status
    else:
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
    """
    Pause a running task.
    
    This endpoint pauses a running task by saving its state and canceling the current execution.
    The task can be resumed later from its saved state.
    """
    # Check if task exists
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    # Get task status
    task_status = active_tasks[task_id]
    
    # Check if task is running
    if task_status.status != "running":
        raise HTTPException(status_code=400, detail=f"Task {task_id} is not running (current status: {task_status.status})")
    
    try:
        # Get the agent
        agent = agent_adapter.get_agent_for_task(task_id)
        if not agent:
            raise HTTPException(status_code=404, detail=f"No agent found for task {task_id}")
        
        # Save the current state
        current_url = agent.page.url if hasattr(agent, 'page') and agent.page else None
        current_title = await agent.page.title() if hasattr(agent, 'page') and agent.page else None
        
        # Store state in task metadata for resuming later
        if not task_status.metadata:
            task_status.metadata = {}
        
        # Enhanced state persistence with more browser state information
        try:
            # Capture form data if available
            form_data = await agent.page.evaluate("""() => { 
                try {
                    return Array.from(document.forms).map(form => {
                        const formData = new FormData(form);
                        return Array.from(formData.entries()).map(([key, value]) => [key, value]);
                    });
                } catch (e) {
                    return [];
                }
            }""") if hasattr(agent, 'page') and agent.page else []
            
            # Capture scroll position
            scroll_position = await agent.page.evaluate("""() => { 
                return {x: window.scrollX, y: window.scrollY};
            }""") if hasattr(agent, 'page') and agent.page else None
            
            # Capture localStorage
            local_storage = await agent.page.evaluate("""() => { 
                try {
                    return Object.entries(localStorage);
                } catch (e) {
                    return [];
                }
            }""") if hasattr(agent, 'page') and agent.page else []
            
            # Capture sessionStorage
            session_storage = await agent.page.evaluate("""() => { 
                try {
                    return Object.entries(sessionStorage);
                } catch (e) {
                    return [];
                }
            }""") if hasattr(agent, 'page') and agent.page else []
            
            # Capture DOM state of important elements (like input values)
            dom_state = await agent.page.evaluate("""() => {
                try {
                    const inputs = Array.from(document.querySelectorAll('input:not([type="password"]), textarea, select'));
                    return inputs.map(el => ({
                        selector: getUniqueSelector(el),
                        value: el.value,
                        checked: el.checked,
                        type: el.type
                    }));
                    
                    // Helper function to get a unique selector for an element
                    function getUniqueSelector(el) {
                        if (el.id) return `#${el.id}`;
                        if (el.name) return `[name="${el.name}"]`;
                        
                        // Try with classes
                        if (el.className) {
                            const classes = el.className.split(' ').filter(c => c.trim().length > 0);
                            if (classes.length > 0) {
                                const selector = '.' + classes.join('.');
                                if (document.querySelectorAll(selector).length === 1) return selector;
                            }
                        }
                        
                        // Fallback to a path selector
                        let path = '';
                        let parent = el;
                        while (parent && parent.tagName) {
                            let tag = parent.tagName.toLowerCase();
                            const siblings = Array.from(parent.parentNode?.children || []);
                            if (siblings.length > 1) {
                                const index = siblings.indexOf(parent) + 1;
                                tag += `:nth-child(${index})`;
                            }
                            path = tag + (path ? ' > ' + path : '');
                            parent = parent.parentNode;
                        }
                        return path;
                    }
                } catch (e) {
                    return [];
                }
            }""") if hasattr(agent, 'page') and agent.page else []
            
            # Log the captured state for debugging
            logger.info(f"Captured enhanced state for task {task_id}: "
                      f"form_data: {len(form_data)} forms, "
                      f"dom_state: {len(dom_state)} elements, "
                      f"local_storage: {len(local_storage)} items, "
                      f"session_storage: {len(session_storage)} items")
            
        except Exception as capture_error:
            logger.warning(f"Error capturing enhanced state for task {task_id}: {str(capture_error)}")
            # Continue with basic state if enhanced capture fails
            form_data = []
            scroll_position = None
            local_storage = []
            session_storage = []
            dom_state = []
        
        task_status.metadata["paused_state"] = {
            "url": current_url,
            "title": current_title,
            "timestamp": datetime.now().isoformat(),
            "task_memory": agent.task_memory.get_history() if hasattr(agent, 'task_memory') else [],
            # Add enhanced state information
            "form_data": form_data,
            "scroll_position": scroll_position,
            "local_storage": local_storage,
            "session_storage": session_storage,
            "dom_state": dom_state
        }
        
        # Cancel the browser execution but keep the task in active_tasks
        if hasattr(agent, 'browser') and agent.browser:
            await agent.browser.close()
            
        # Remove the agent from active_agents to prevent automatic completion
        # but keep the task in active_tasks
        if task_id in agent_adapter.active_agents:
            del agent_adapter.active_agents[task_id]
        
        # Update task status
        task_status.status = "paused"
        
        # Broadcast update
        await broadcast_task_update(task_id, task_status)
        
        return task_status
    except Exception as e:
        logger.exception(f"Error pausing task {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error pausing task: {str(e)}")

@app.post("/execute/{task_id}/cancel", response_model=TaskStatus)
async def cancel_task(task_id: str):
    """
    Cancel a running task.
    
    This endpoint cancels a running task and cleans up associated resources.
    """
    # Check if task exists
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    # Get task status
    task_status = active_tasks[task_id]
    
    # Check if task is running or paused
    if task_status.status not in ["running", "paused"]:
        raise HTTPException(status_code=400, detail=f"Task {task_id} is not running or paused (current status: {task_status.status})")
    
    try:
        # Get the agent
        agent = agent_adapter.get_agent_for_task(task_id)
        if not agent:
            raise HTTPException(status_code=404, detail=f"No agent found for task {task_id}")
        
        # Close the browser if it's open
        if hasattr(agent, 'browser') and agent.browser:
            await agent.browser.close()
        
        # Update task status
        task_status.status = "cancelled"
        task_status.end_time = datetime.now()
        
        # Move to history
        task_history[task_id] = task_status
        if task_id in active_tasks:
            del active_tasks[task_id]
        
        # Clean up resources
        await agent_adapter.cleanup_task(task_id)
        
        # Broadcast update
        await broadcast_task_update(task_id, task_status)
        
        return task_status
    except Exception as e:
        logger.exception(f"Error cancelling task {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error cancelling task: {str(e)}")

@app.post("/execute/{task_id}/resume", response_model=TaskStatus)
async def resume_task(task_id: str):
    """
    Resume a paused task.
    
    This endpoint resumes a paused task by restarting it from its saved state.
    """
    # Check if task exists
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    # Get task status
    task_status = active_tasks[task_id]
    
    # Check if task is paused
    if task_status.status != "paused":
        raise HTTPException(status_code=400, detail=f"Task {task_id} is not paused (current status: {task_status.status})")
    
    try:
        # Check if we have saved state
        if not task_status.metadata or "paused_state" not in task_status.metadata:
            raise HTTPException(status_code=400, detail=f"No saved state found for task {task_id}")
        
        # Get the original task request
        original_request = task_requests.get(task_id)
        if not original_request:
            raise HTTPException(status_code=400, detail=f"Original request not found for task {task_id}")
        
        # Update task status
        task_status.status = "running"
        
        # Broadcast update
        await broadcast_task_update(task_id, task_status)
        
        # Start a new task execution with the saved state
        paused_state = task_status.metadata["paused_state"]
        
        # Create a modified task that includes resuming from the saved URL
        modified_request = copy.deepcopy(original_request)
        
        # If we don't have options, create it
        if not modified_request.options:
            modified_request.options = {}
        
        # Add resume information to options
        modified_request.options["resume_from"] = paused_state
        
        # Start the task in a background task
        asyncio.create_task(run_task(task_id, modified_request, task_status))
        
        return task_status
    except Exception as e:
        logger.exception(f"Error resuming task {task_id}: {str(e)}")
        # Update task status to error
        task_status.status = "error"
        task_status.error = f"Error resuming task: {str(e)}"
        await broadcast_task_update(task_id, task_status)
        raise HTTPException(status_code=500, detail=f"Error resuming task: {str(e)}")

@app.post("/execute/{task_id}/resume", response_model=TaskStatus)
async def resume_task(task_id: str):
    """
    Resume a paused task.
    
    This endpoint resumes a paused task by restarting it from its saved state.
    """
    # Check if task exists
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    # Get task status
    task_status = active_tasks[task_id]
    
    # Check if task is paused
    if task_status.status != "paused":
        raise HTTPException(status_code=400, detail=f"Task {task_id} is not paused (current status: {task_status.status})")
    
    try:
        # Check if we have saved state
        if not task_status.metadata or "paused_state" not in task_status.metadata:
            raise HTTPException(status_code=400, detail=f"No saved state found for task {task_id}")
        
        # Get the original task request
        original_request = task_requests.get(task_id)
        if not original_request:
            raise HTTPException(status_code=400, detail=f"Original request not found for task {task_id}")
        
        # Update task status
        task_status.status = "running"
        
        # Broadcast update
        await broadcast_task_update(task_id, task_status)
        
        # Start a new task execution with the saved state
        paused_state = task_status.metadata["paused_state"]
        
        # Create a modified task that includes resuming from the saved URL
        modified_request = copy.deepcopy(original_request)
        
        # If we don't have options, create it
        if not modified_request.options:
            modified_request.options = {}
        
        # Add resume information to options
        modified_request.options["resume_from"] = paused_state
        
        # Start the task in a background task
        asyncio.create_task(run_task(task_id, modified_request, task_status))
        
        return task_status
    except Exception as e:
        logger.exception(f"Error resuming task {task_id}: {str(e)}")
        # Update task status to error
        task_status.status = "error"
        task_status.error = f"Error resuming task: {str(e)}"
        await broadcast_task_update(task_id, task_status)
        raise HTTPException(status_code=500, detail=f"Error resuming task: {str(e)}")
