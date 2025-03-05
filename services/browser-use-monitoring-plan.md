Based on my analysis of your codebase and the task description, I've developed a comprehensive strategy for implementing
browser-use monitoring and management in your application. Here's my proposed plan:

Strategic Plan for Browser-Use Monitoring Integration

1. Architecture Overview
   The integration will consist of several components:

   Enhanced Browser-Use Service: Extend the existing service with monitoring, recording, and reporting capabilities
   Browser-Use API Client: Create a client to interact with the enhanced service
   UI Components: Develop UI components to display monitoring data and controls
   State Management: Implement state management for browser-use sessions

2. Implementation Plan
   Phase 1: Enhance Browser-Use Service
   Extend the Browser-Use Service API:

```python
# services/browser-use/main.py additions

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, SecretStr
from typing import Optional, Dict, Any, List
import os
import asyncio
import logging
import uuid
import json
import base64
from datetime import datetime
import ffmpeg  # Add ffmpeg-python to requirements.txt

# Task management
active_tasks = {}
task_history = {}
connected_clients = {}

# New models
class TaskStatus(BaseModel):
    task_id: str
    status: str  # "pending", "running", "completed", "failed", "cancelled"
    progress: float = 0.0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    result: Optional[str] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class RecordingConfig(BaseModel):
    enabled: bool = True
    format: str = "mp4"
    quality: str = "medium"
    frame_rate: int = 5

# Enhanced task request
class EnhancedTaskRequest(TaskRequest):
    task_id: Optional[str] = None
    recording_config: Optional[RecordingConfig] = None

# New endpoints
@app.get("/tasks")
async def get_tasks():
    """Get all active and recent tasks"""
    return {
        "active_tasks": list(active_tasks.values()),
        "recent_tasks": list(task_history.values())[-10:]  # Last 10 tasks
    }

@app.get("/tasks/{task_id}")
async def get_task(task_id: str):
    """Get details of a specific task"""
    if task_id in active_tasks:
        return active_tasks[task_id]
    elif task_id in task_history:
        return task_history[task_id]
    else:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

@app.post("/tasks/{task_id}/cancel")
async def cancel_task(task_id: str):
    """Cancel a running task"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    # Set cancellation flag
    active_tasks[task_id].metadata = active_tasks[task_id].metadata or {}
    active_tasks[task_id].metadata["cancelled"] = True
    active_tasks[task_id].status = "cancelling"
    
    return {"success": True, "message": f"Cancellation requested for task {task_id}"}

@app.get("/tasks/{task_id}/screenshot")
async def get_task_screenshot(task_id: str):
    """Get the latest screenshot from a task"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    # Implementation to capture screenshot
    # This would interact with browser-use to get a screenshot
    screenshot_data = await capture_screenshot(task_id)
    
    return {"task_id": task_id, "screenshot": screenshot_data}

@app.get("/tasks/{task_id}/recording")
async def get_task_recording(task_id: str):
    """Get the recording URL for a task"""
    if task_id not in active_tasks and task_id not in task_history:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    task = active_tasks.get(task_id) or task_history.get(task_id)
    if not task.metadata or "recording_path" not in task.metadata:
        raise HTTPException(status_code=404, detail=f"No recording available for task {task_id}")
    
    # Return a pre-signed URL or a direct download link
    recording_url = f"/download/recording/{task_id}"
    return {"task_id": task_id, "recording_url": recording_url}

@app.get("/download/recording/{task_id}")
async def download_recording(task_id: str):
    """Download the recording for a task"""
    # Implementation to serve the recording file
    pass

@app.get("/tasks/{task_id}/report")
async def get_task_report(task_id: str):
    """Get a detailed report for a task"""
    if task_id not in active_tasks and task_id not in task_history:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    task = active_tasks.get(task_id) or task_history.get(task_id)
    
    # Generate a detailed report
    report = {
        "task_id": task_id,
        "task": task.task,
        "status": task.status,
        "start_time": task.start_time,
        "end_time": task.end_time,
        "duration": (task.end_time - task.start_time).total_seconds() if task.end_time else None,
        "result": task.result,
        "error": task.error,
        "metadata": task.metadata
    }
    
    return report

# WebSocket for real-time updates
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    connected_clients[client_id] = websocket
    
    try:
        while True:
            # Keep connection alive and handle client messages
            data = await websocket.receive_text()
            # Process any client commands
    except WebSocketDisconnect:
        if client_id in connected_clients:
            del connected_clients[client_id]

# Enhanced execute endpoint
@app.post("/execute")
async def execute_task(request: EnhancedTaskRequest):
    # Generate task ID if not provided
    task_id = request.task_id or str(uuid.uuid4())
    
    # Create task status
    task_status = TaskStatus(
        task_id=task_id,
        status="pending",
        start_time=datetime.now(),
        metadata={
            "recording_config": request.recording_config.dict() if request.recording_config else None,
            "options": request.options
        }
    )
    
    # Store in active tasks
    active_tasks[task_id] = task_status
    
    # Start task execution in background
    asyncio.create_task(
        execute_task_with_monitoring(task_id, request, task_status)
    )
    
    return {"task_id": task_id, "status": "pending"}

async def execute_task_with_monitoring(task_id: str, request: EnhancedTaskRequest, task_status: TaskStatus):
    """Execute task with monitoring and recording"""
    recording_process = None
    
    try:
        # Update task status
        task_status.status = "running"
        await broadcast_task_update(task_id, task_status)
        
        # Start recording if enabled
        if request.recording_config and request.recording_config.enabled:
            recording_path = f"recordings/{task_id}.{request.recording_config.format}"
            recording_process = start_recording(recording_path, request.recording_config)
            task_status.metadata["recording_path"] = recording_path
        
        # Initialize agent and execute task (similar to original code)
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.7
        )
        
        agent = Agent(
            task=request.task,
            llm=llm
        )
        
        # Execute with progress updates
        result = await execute_with_progress(agent, task_id, task_status, request.operation_timeout)
        
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
        if recording_process:
            stop_recording(recording_process)
        
        # Move from active to history
        if task_id in active_tasks:
            task_history[task_id] = active_tasks[task_id]
            del active_tasks[task_id]
        
        # Broadcast final update
        await broadcast_task_update(task_id, task_status)
    
    return task_status

async def execute_with_progress(agent, task_id, task_status, timeout):
    """Execute agent.run() with progress updates"""
    # Implementation to execute agent with progress updates
    pass

async def broadcast_task_update(task_id, task_status):
    """Broadcast task updates to connected WebSocket clients"""
    message = {
        "type": "task_update",
        "data": task_status.dict()
    }
    
    for client_id, websocket in connected_clients.items():
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending update to client {client_id}: {e}")

def start_recording(path, config):
    """Start recording browser session"""
    # Implementation to start ffmpeg recording
    pass

def stop_recording(process):
    """Stop recording process"""
    # Implementation to stop ffmpeg recording
    pass

async def capture_screenshot(task_id):
    """Capture screenshot from browser session"""
    # Implementation to capture screenshot
    pass
```

Phase 2: Create Browser-Use Client in Web App
Create Browser-Use Types:

```typescript
// src/app-types/browser-use.ts
export enum BrowserTaskStatus {
    Pending = 'pending',
    Running = 'running',
    Completed = 'completed',
    Failed = 'failed',
    Cancelled = 'cancelled',
    Cancelling = 'cancelling'
}

export interface BrowserTaskMetadata {
    recording_config?: {
        enabled: boolean;
        format: string;
        quality: string;
        frame_rate: number;
    };
    recording_path?: string;
    cancelled?: boolean;
    options?: Record<string, any>;

    [key: string]: any;
}

export interface BrowserTask {
    task_id: string;
    status: BrowserTaskStatus;
    progress: number;
    start_time?: string;
    end_time?: string;
    result?: string;
    error?: string;
    metadata?: BrowserTaskMetadata;
    task: string;
}

export interface BrowserTaskRequest {
    task: string;
    task_id?: string;
    options?: Record<string, any>;
    operation_timeout?: number;
    recording_config?: {
        enabled: boolean;
        format: string;
        quality: string;
        frame_rate: number;
    };
}

export interface BrowserScreenshotResponse {
    task_id: string;
    screenshot: string; // base64 encoded image
}

export interface BrowserRecordingResponse {
    task_id: string;
    recording_url: string;
}

export interface BrowserTaskReport {
    task_id: string;
    task: string;
    status: BrowserTaskStatus;
    start_time?: string;
    end_time?: string;
    duration?: number;
    result?: string;
    error?: string;
    metadata?: BrowserTaskMetadata;
}
```

2. Create Browser-Use Actions:

```typescript
// src/lib/actions/browser-use-actions.ts
'use server';

import { authCheck } from '@lib/actions/authentication-actions';
import {
    BrowserTask,
    BrowserTaskRequest,
    BrowserScreenshotResponse,
    BrowserRecordingResponse,
    BrowserTaskReport
} from '@app-types/browser-use';

const BROWSER_USE_API_URL = process.env.BROWSER_USE_API_URL || 'http://localhost:8000';

// Execute a new browser task
export const executeBrowserTask = async (
    request: BrowserTaskRequest
): Promise<{ task_id: string; status: string }> => {
    await authCheck();

    try {
        const response = await fetch(`${BROWSER_USE_API_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to execute browser task');
        }

        return await response.json();
    } catch (error) {
        console.error('Error executing browser task:', error);
        throw error;
    }
};

// Get all tasks
export const getBrowserTasks = async (): Promise<{
    active_tasks: BrowserTask[];
    recent_tasks: BrowserTask[];
}> => {
    await authCheck();

    try {
        const response = await fetch(`${BROWSER_USE_API_URL}/tasks`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to get browser tasks');
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting browser tasks:', error);
        throw error;
    }
};

// Get a specific task
export const getBrowserTask = async (taskId: string): Promise<BrowserTask> => {
    await authCheck();

    try {
        const response = await fetch(`${BROWSER_USE_API_URL}/tasks/${taskId}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to get browser task');
        }

        return await response.json();
    } catch (error) {
        console.error(`Error getting browser task ${taskId}:`, error);
        throw error;
    }
};

// Cancel a task
export const cancelBrowserTask = async (taskId: string): Promise<{ success: boolean; message: string }> => {
    await authCheck();

    try {
        const response = await fetch(`${BROWSER_USE_API_URL}/tasks/${taskId}/cancel`, {
            method: 'POST',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to cancel browser task');
        }

        return await response.json();
    } catch (error) {
        console.error(`Error cancelling browser task ${taskId}:`, error);
        throw error;
    }
};

// Get a task screenshot
export const getBrowserTaskScreenshot = async (taskId: string): Promise<BrowserScreenshotResponse> => {
    await authCheck();

    try {
        const response = await fetch(`${BROWSER_USE_API_URL}/tasks/${taskId}/screenshot`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to get browser task screenshot');
        }

        return await response.json();
    } catch (error) {
        console.error(`Error getting screenshot for task ${taskId}:`, error);
        throw error;
    }
};

// Get a task recording
export const getBrowserTaskRecording = async (taskId: string): Promise<BrowserRecordingResponse> => {
    await authCheck();

    try {
        const response = await fetch(`${BROWSER_USE_API_URL}/tasks/${taskId}/recording`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to get browser task recording');
        }

        return await response.json();
    } catch (error) {
        console.error(`Error getting recording for task ${taskId}:`, error);
        throw error;
    }
};

// Get a task report
export const getBrowserTaskReport = async (taskId: string): Promise<BrowserTaskReport> => {
    await authCheck();

    try {
        const response = await fetch(`${BROWSER_USE_API_URL}/tasks/${taskId}/report`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to get browser task report');
        }

        return await response.json();
    } catch (error) {
        console.error(`Error getting report for task ${taskId}:`, error);
        throw error;
    }
};
```

3. Create Browser-Use WebSocket Hook:

```typescript
// src/hooks/use-browser-use-websocket.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { BrowserTask, BrowserTaskStatus } from '@app-types/browser-use';

interface UseBrowserUseWebSocketProps {
    clientId?: string;
    onTaskUpdate?: (task: BrowserTask) => void;
}

export const useBrowserUseWebSocket = ({
    clientId = `client-${Math.random().toString(36).substring(2, 9)}`,
    onTaskUpdate
}: UseBrowserUseWebSocketProps = {}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const websocketRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        const wsUrl = process.env.NEXT_PUBLIC_BROWSER_USE_WS_URL ||
            `ws://${window.location.hostname}:8000`;

        try {
            const ws = new WebSocket(`${wsUrl}/ws/${clientId}`);

            ws.onopen = () => {
                setIsConnected(true);
                setError(null);
            };

            ws.onclose = () => {
                setIsConnected(false);
                // Try to reconnect after a delay
                setTimeout(() => connect(), 3000);
            };

            ws.onerror = (event) => {
                setError('WebSocket connection error');
                console.error('WebSocket error:', event);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'task_update' && onTaskUpdate) {
                        onTaskUpdate(message.data as BrowserTask);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            websocketRef.current = ws;
        } catch (error) {
            setError(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
            console.error('WebSocket connection error:', error);
        }
    }, [clientId, onTaskUpdate]);

    const disconnect = useCallback(() => {
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        error,
        connect,
        disconnect
    };
};
```

Phase 3: Enhance Agent Details Modal for Browser-Use Monitoring

1. Modify the AgentDetailsModal Component:

```tsx
// src/components/modals/agent-details-modal.tsx
import { ReactNode, useState, useEffect } from 'react';
import './modal.styles.css';
import { SearchIcon } from '@components/icons/search-icon';
import { CheckMarkIcon } from '@components/icons/check-mark-icon';
import { SaveDocumentIcon } from '@components/icons/save-document-icon';
import { LogCard } from '@components/log-card/log-card';
import { Button } from '@components/utils/button/button';
import { BrowserUseMonitor } from '@components/browser-use/browser-use-monitor';
import { useBrowserUseWebSocket } from '@hooks/use-browser-use-websocket';
import { BrowserTask } from '@app-types/browser-use';
import { useAgentStore } from '@stores/agent-store';

interface AgentDetailsModalProps {
    onClose: () => void;
    children?: ReactNode;
    parentNodeId?: string;
}

export const AgentDetailsModal = ({ children, parentNodeId }: AgentDetailsModalProps) => {
    const [activeTab, setActiveTab] = useState<'details' | 'browser'>('details');
    const [browserTask, setBrowserTask] = useState<BrowserTask | null>(null);
    const { getAgentData } = useAgentStore();
    const agentData = parentNodeId ? getAgentData(parentNodeId) : null;

    // Connect to WebSocket for real-time updates
    const { isConnected } = useBrowserUseWebSocket({
        onTaskUpdate: (task) => {
            // Only update if this is the task for our agent
            if (task.metadata?.options?.agentId === agentData?.id) {
                setBrowserTask(task);
            }
        }
    });

    // Fetch current task data on mount
    useEffect(() => {
        if (agentData?.id) {
            // Logic to fetch current task for this agent
            // This would call a function to get the active task for this agent
        }
    }, [agentData?.id]);

    return (
        <div className="agent-details-modal">
            <div className="agent-details-container">
                {/* Left Column */}
                <div className="agent-details-left-column">
                    <div className="left-column-top-section">
                        <div className="top-section-area">
                            {/* Agent info will go here */}
                            <div className="agent-details-section">
                                <div className="gap-4">
                                    <div className="avatar bg-[#111212] "></div>
                                    {/* Agent avatar */}
                                    <div className="agent-name items-start">
                                        <h3>{agentData?.name || 'Agent'}</h3>
                                        <h3>{agentData?.description || 'No description'}</h3>
                                    </div>
                                </div>
                                <div>
                                    <span className="agent-stat-title">Time on Task</span>
                                    <span className="agent-stat">
                                        {browserTask ? formatDuration(browserTask) : '00:00'}
                                    </span>
                                </div>
                                <div>
                                    <span className="agent-stat-title">Spend</span>
                                    <span className="agent-stat">$0.36</span>
                                </div>
                                <div>
                                    <span className="agent-stat-title">Accuracy</span>
                                    <span className="agent-stat">98%</span>
                                </div>
                                <div>
                                    <span className="agent-stat-title">Training Hours</span>
                                    <span className="agent-stat">342</span>
                                </div>
                            </div>
                            <Button variant="primary" size="md" fullWidth>
                                Settings
                            </Button>
                        </div>

                        {/* Tab navigation */}
                        <div className="tabs-container">
                            <button
                                className={`tab ${activeTab === 'details' ? 'active' : ''}`}
                                onClick={() => setActiveTab('details')}
                            >
                                Agent Details
                            </button>
                            <button
                                className={`tab ${activeTab === 'browser' ? 'active' : ''}`}
                                onClick={() => setActiveTab('browser')}
                            >
                                Browser Monitor
                            </button>
                        </div>

                        {/* Status indicator */}
                        <div className="connection-status">
                            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
                            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                        </div>
                    </div>
                    <div className="left-column-bottom-section">
                        {/* Task progress */}
                        {browserTask && (
                            <div className="task-progress">
                                <div className="progress-label">
                                    <span>Task Progress</span>
                                    <span>{Math.round(browserTask.progress * 100)}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${browserTask.progress * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="agent-details-right-column">
                    {/* Top Section with Search */}
                    <div className="agent-details-search">
                        <div className="search-container">
                            <div className="search-icon">
                                <SearchIcon color="#1C64F2" strokeWidth={1.5} />
                            </div>
                            <input type="text" placeholder="Search" className="search-input" />
                        </div>
                        {children}
                    </div>

                    {/* Middle Section - Flexible height */}
                    <div className="agent-details-content-section">
                        {activeTab === 'details' ? (
                            <>
                                <LogCard color="#ffffff">
                                    {/* Agent details content */}
                                    Agent details will go here...
                                </LogCard>
                                <LogCard>
                                    {'<-'} More agent info will go there soon...
                                </LogCard>
                            </>
                        ) : (
                            <BrowserUseMonitor
                                taskId={browserTask?.task_id}
                                agentId={agentData?.id}
                            />
                        )}
                    </div>

                    {/* Bottom Section - Buttons */}
                    <div className="agent-details-buttons">
                        {browserTask?.status === 'running' ? (
                            <Button
                                variant="danger"
                                size="md"
                                fullWidth
                                onClick={() => {
                                    // Cancel task logic
                                }}
                            >
                                Stop Task
                            </Button>
                        ) : (
                            <>
                                <Button variant="primary"
                                    size="md"
                                    fullWidth
                                    icon={<CheckMarkIcon width={18} height={18} color="white" />}>
                                    Check
                                </Button>
                                <Button variant="secondary"
                                    size="md"
                                    fullWidth
                                    icon={<SaveDocumentIcon width={18} height={18} />}>
                                    Save
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to format duration
function formatDuration(task: BrowserTask): string {
    if (!task.start_time) return '00:00';

    const start = new Date(task.start_time);
    const end = task.end_time ? new Date(task.end_time) : new Date();
    const durationMs = end.getTime() - start.getTime();

    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
```

2. Create Browser-Use Monitor Component:

```tsx
// src/components/browser-use/browser-use-monitor.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getBrowserTask,
    getBrowserTaskScreenshot,
    getBrowserTaskRecording,
    getBrowserTaskReport,
    cancelBrowserTask
} from '@lib/actions/browser-use-actions';
import { BrowserTask, BrowserTaskStatus } from '@app-types/browser-use';
import { Button } from '@components/utils/button/button';
import { LogCard } from '@components/log-card/log-card';

interface BrowserUseMonitorProps {
    taskId?: string;
    agentId?: string;
}

export const BrowserUseMonitor = ({ taskId, agentId }: BrowserUseMonitorProps) => {
    const [task, setTask] = useState<BrowserTask | null>(null);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch task data
    const fetchTaskData = useCallback(async () => {
        if (!taskId) return;

        try {
            setIsLoading(true);
            const taskData = await getBrowserTask(taskId);
            setTask(taskData);

            // Fetch screenshot if task is running
            if (taskData.status === BrowserTaskStatus.Running) {
                try {
                    const screenshotData = await getBrowserTaskScreenshot(taskId);
                    setScreenshot(screenshotData.screenshot);
                } catch (screenshotError) {
                    console.error('Error fetching screenshot:', screenshotError);
                }
            }
        } catch (error) {
            setError('Failed to fetch task data');
            console.error('Error fetching task data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [taskId]);

    // Set up polling for task updates
    useEffect(() => {
        if (!taskId) return;

        fetchTaskData();

        // Poll for updates every 2 seconds if task is running
        const interval = setInterval(() => {
            if (task?.status === BrowserTaskStatus.Running) {
                fetchTaskData();
            } else {
                clearInterval(interval);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [taskId, fetchTaskData, task?.status]);

    // Handle task cancellation
    const handleCancelTask = async () => {
        if (!taskId) return;

        try {
            await cancelBrowserTask(taskId);
            // Refresh task data after cancellation
            fetchTaskData();
        } catch (error) {
            console.error('Error cancelling task:', error);
            setError('Failed to cancel task');
        }
    };

    // Handle downloading recording
    const handleDownloadRecording = async () => {
        if (!taskId) return;

        try {
            const recordingData = await getBrowserTaskRecording(taskId);
            // Open recording URL in new tab
            window.open(recordingData.recording_url, '_blank');
        } catch (error) {
            console.error('Error downloading recording:', error);
            setError('Failed to download recording');
        }
    };

    // Handle downloading report
    const handleDownloadReport = async () => {
        if (!taskId) return;

        try {
            const reportData = await getBrowserTaskReport(taskId);
            // Create and download JSON file
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `task-report-${taskId}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading report:', error);
            setError('Failed to download report');
        }
    };

    if (!taskId) {
        return (
            <LogCard>
                <div className="flex flex-col items-center justify-center p-4">
                    <p className="text-gray-500">No active browser task</p>
                </div>
            </LogCard>
        );
    }

    if (isLoading && !task) {
        return (
            <LogCard>
                <div className="flex flex-col items-center justify-center p-4">
                    <p className="text-gray-500">Loading task data...</p>
                </div>
            </LogCard>
        );
    }

    if (error) {
        return (
            <LogCard>
                <div className="flex flex-col items-center justify-center p-4 text-red-500">
                    <p>{error}</p>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={fetchTaskData}
                        className="mt-2"
                    >
                        Retry
                    </Button>
                </div>
            </LogCard>
        );
    }

    return (
        <div className="browser-use-monitor">
            {/* Task Information */}
            <LogCard>
                <div className="p-4">
                    <h3 className="text-lg font-medium mb-2">Task Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="font-medium">Status:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                task?.status === BrowserTaskStatus.Running ? 'bg-blue-100 text-blue-800' :
                                    task?.status === BrowserTaskStatus.Completed ? 'bg-green-100 text-green-800' :
                                        task?.status === BrowserTaskStatus.Failed ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                            }`}>
                                {task?.status || 'Unknown'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">Progress:</span>
                            <span className="ml-2">{Math.round((task?.progress || 0) * 100)}%</span>
                        </div>
                        <div>
                            <span className="font-medium">Start Time:</span>
                            <span className="ml-2">
                                {task?.start_time ? new Date(task.start_time).toLocaleTimeString() : 'N/A'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">Duration:</span>
                            <span className="ml-2">
                                {task ? formatDuration(task) : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </LogCard>

            {/* Browser Screenshot */}
            <LogCard className="mt-4">
                <div className="p-4">
                    <h3 className="text-lg font-medium mb-2">Browser View</h3>
                    {screenshot ? (
                        <div className="relative border border-gray-200 rounded overflow-hidden">
                            <img
                                src={`data:image/png;base64,${screenshot}`}
                                alt="Browser Screenshot"
                                className="w-full h-auto"
                            />
                            <div className="absolute top-2 right-2">
                                <Button
                                    variant="secondary"
                                    size="xs"
                                    onClick={fetchTaskData}
                                >
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded">
                            <p className="text-gray-500">
                                {task?.status === BrowserTaskStatus.Running
                                    ? 'Loading screenshot...'
                                    : 'No screenshot available'}
                            </p>
                        </div>
                    )}
                </div>
            </LogCard>

            {/* Task Result/Error */}
            {(task?.result || task?.error) && (
                <LogCard className="mt-4">
                    <div className="p-4">
                        <h3 className="text-lg font-medium mb-2">
                            {task.result ? 'Task Result' : 'Task Error'}
                        </h3>
                        <pre className={`p-3 rounded text-sm overflow-auto max-h-[200px] ${
                            task.result ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                            {task.result || task.error}
                        </pre>
                    </div>
                </LogCard>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
                {task?.status === BrowserTaskStatus.Running && (
                    <Button
                        variant="danger"
                        size="sm"
                        fullWidth
                        onClick={handleCancelTask}
                    >
                        Cancel Task
                    </Button>
                )}

                {task?.status !== BrowserTaskStatus.Running && task?.metadata?.recording_path && (
                    <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={handleDownloadRecording}
                    >
                        Download Recording
                    </Button>
                )}

                {task?.status !== BrowserTaskStatus.Running && (
                    <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={handleDownloadReport}
                    >
                        Download Report
                    </Button>
                )}
            </div>
        </div>
    );
};

// Helper function to format duration
function formatDuration(task: BrowserTask): string {
    if (!task.start_time) return '00:00';

    const start = new Date(task.start_time);
    const end = task.end_time ? new Date(task.end_time) : new Date();
    const durationMs = end.getTime() - start.getTime();

    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
```

Phase 4: Update use-agent.ts Hook to Support Browser-Use Monitoring
Modify the existing use-agent.ts hook to integrate with the enhanced browser-use service:

```typescript
// src/hooks/use-agent.ts
import { useCallback } from 'react';
import { useState } from 'react';
import { Node } from '@xyflow/react';

import { AgentState } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';
import type { NodeData } from '@app-types/workflow';
import { NodeType } from '@app-types/workflow/node-types';
import { BrowserTaskRequest } from '@app-types/browser-use';

interface AgentHookResponse {
    isProcessing: boolean;
    executeAction: () => Promise<any>;
    result: string | null;
    error: string | null;
    taskId: string | null;
}

const isAgentNode = (node: Node): node is Node<NodeData> => {
    return node.type === NodeType.Agent;
};

export const useAgent = (agentId: string, onStatusChange?: (status: AgentState) => void): AgentHookResponse => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);

    const { getAgentState, getAgentData } = useAgentStore();
    const agentData = getAgentData(agentId);
    const agentRuntime = getAgentState(agentData?.id);

    const canExecute = !agentRuntime?.state || agentRuntime.state === AgentState.Working;

    const executeAction = useCallback(async () => {
        if (!canExecute) {
            console.log('Cannot execute - agentRuntime state:', agentRuntime?.state);
            return;
        }

        // Prevent double execution if already processing
        if (isProcessing) {
            console.log('Already processing, skipping execution');
            return;
        }

        try {
            setIsProcessing(true);
            setError(null);
            setResult(null);

            const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
            if (!browserUseEndpoint) {
                throw new Error('Browser use endpoint not configured');
            }

            console.log('Executing agent action with endpoint:', browserUseEndpoint);

            // Create task request with recording config
            const taskRequest: BrowserTaskRequest = {
                task: agentData?.description || 'Navigate to google and perform research on OpenAI 03 vs Anthropic 3.7 for use with the Windsurf IDE',
                options: {
                    agentId: agentData?.id,
                    speed: agentData?.speed,
                    memoryLimit: agentData?.memoryLimit,
                    models: agentData?.models,
                    tools: agentData?.tools
                },
                recording_config: {
                    enabled: true,
                    format: 'mp4',
                    quality: 'medium',
                    frame_rate: 5
                }
            };

            const response = await fetch(`${browserUseEndpoint}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskRequest)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();

            if (responseData.error) {
                throw new Error(responseData.error);
            }

            // Store task ID for monitoring
            if (responseData.task_id) {
                setTaskId(responseData.task_id);
            }

            setResult(responseData.result);

            // Update agent state based on metadata
            if (responseData.metadata?.state) {
                onStatusChange?.(responseData.metadata.state as AgentState);
            } else {
                onStatusChange?.(AgentState.Complete);
            }

        } catch (error) {
            console.error('Error executing action:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
            onStatusChange?.(AgentState.Error);
        } finally {
            setIsProcessing(false);
        }
    }, [agentData, agentRuntime?.state, canExecute, isProcessing, onStatusChange]);

    return {
        isProcessing,
        executeAction,
        result,
        error,
        taskId
    };
};
```

Phase 5: Update Working Agent Layout to Support Browser-Use Monitoring
Modify the WorkingAgentLayout component to integrate with the browser-use monitoring:

```tsx
// src/components/agents/layouts/working-agent-layout.tsx
import { useState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import Image from 'next/image';

import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { BaseAgentLayoutProps } from './base-agent-layout';
import { Button } from '@components/utils/button/button';
import { ChatIcon } from '@components/icons/chat-icon';
import { TaskStatusIcon } from '@components/icons/task-status-icon';
import { WatchIcon } from '@components/icons/watch-icon';
import { useAgent } from '@hooks/use-agent';
import { useAgentStore } from '@stores/agent-store';
import { useModalStore } from '@stores/modal-store';

export const WorkingAgentLayout = ({ agentId, agentData }: BaseAgentLayoutProps) => {
    const { getAgentData } = useAgentStore();
    const { openModal } = useModalStore();
    const data = agentData || getAgentData(agentId);
    const [result, setResult] = useState('');
    const hasExecuted = useRef(false);
    const { transition } = useAgentStore();
    const { executeAction, isProcessing, taskId } = useAgent(agentId, status => {
        transition(agentId, status);
    });

    // Start execution when component mounts, but only once
    useEffect(() => {
        if (hasExecuted.current) return;

        (async () => {
            console.log('🚀 Working agent mounted, executing action...');
            hasExecuted.current = true;
            setResult(await executeAction());
        })();
        // This needs to run only once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle opening the browser monitor
    const handleOpenBrowserMonitor = () => {
        if (taskId) {
            openModal({
                type: 'agent-details',
                parentNodeId: agentId,
                initialTab: 'browser',
                taskId
            });
        } else {
            // If no task ID is available, still open the modal but it will show no active task
            openModal({
                type: 'agent-details',
                parentNodeId: agentId,
                initialTab: 'browser'
            });
        }
    };

    return (
        <div className="working-agent-card">
            <div className="working-agent-wrapper">
                {/* Content */}
                <div className="agent-info-section">
                    <Image src={data?.image || cloudHeadImage}
                        alt={`Profile avatar of ${data?.name}`}
                        className="rounded-full"
                        width={48}
                        height={48} />
                    <div className="agent-name">
                        <span>{data?.name}</span>
                    </div>
                </div>

                {/* Status section */}
                <div className="agent-tasks-section">
                    <div className="agent-tasks-title">
                        <TaskStatusIcon />
                        <span>Current Task:</span>
                    </div>
                    <div className="agent-tasks-container">
                        <p>{isProcessing ? 'Processing...' : result || 'Ready'}</p>
                    </div>
                </div>
                <div className="buttons-container">
                    <Button customStyles={{ textColor: '#7d829a', backgroundColor: '#232629' }}
                        variant="primary"
                        size="sm"
                        radius="lg"
                        fullWidth
                        disabled={isProcessing && !taskId}
                        onClick={handleOpenBrowserMonitor}
                        icon={<WatchIcon />}>
                        Watch
                    </Button>
                    <Button variant="secondary"
                        size="sm"
                        radius="lg"
                        customStyles={{ textColor: '#2f3338', backgroundColor: '#56e8cd' }}
                        fullWidth
                        icon={<ChatIcon />}>
                        Meeting
                    </Button>
                </div>
            </div>
        </div>
    );
};
```

Phase 6: Add CSS Styles for Browser-Use Monitoring
Add the necessary CSS styles to support the new UI components:

```css
/* src/components/browser-use/browser-use-monitor.css */
.browser-use-monitor {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.tabs-container {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
}

.tab {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab.active {
  color: #1c64f2;
  border-bottom-color: #1c64f2;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.status-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.status-indicator.connected {
  background-color: #10b981;
}

.status-indicator.disconnected {
  background-color: #ef4444;
}

.task-progress {
  padding: 0.75rem;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.progress-bar {
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #1c64f2;
  transition: width 0.3s ease;
}
```

1. Implementation Roadmap

   Phase 1: Backend Enhancement (Week 1)
   Extend the browser-use service with monitoring capabilities
   Implement recording functionality using ffmpeg
   Add WebSocket support for real-time updates
   Create task management and history endpoints
   Phase 2: Frontend Integration (Week 2)
   Create browser-use types and API client
   Implement WebSocket hook for real-time updates
   Update the agent hook to support browser-use monitoring
   Enhance the AgentDetailsModal to support browser monitoring
   Phase 3: UI Components (Week 3)
   Create the BrowserUseMonitor component
   Update the WorkingAgentLayout to support browser monitoring
   Add CSS styles for browser monitoring components
   Implement recording and report download functionality
   Phase 4: Testing and Refinement (Week 4)
   Test the integration end-to-end
   Optimize performance and fix any issues
   Add error handling and recovery mechanisms
   Implement security measures for recordings and reports
2. Key Considerations
   Security
   Ensure all API endpoints are properly authenticated
   Implement secure storage for recordings and reports
   Add user-based access control for task data
   Scalability
   Design the system to handle multiple concurrent tasks
   Implement efficient storage and retrieval of recordings
   Consider using a message queue for task management
   User Experience
   Provide real-time feedback on task progress
   Implement intuitive controls for task management
   Ensure responsive design for all screen sizes
   Error Handling
   Implement robust error handling and recovery
   Provide clear error messages to users
   Log errors for debugging and monitoring
3. Conclusion
   This implementation plan provides a comprehensive approach to integrating browser-use monitoring and management into
   your existing application. By following this plan, you'll be able to:

Monitor browser-use tasks in real-time
Capture and view screenshots of browser sessions
Record browser sessions for later review
Generate detailed reports on task execution
Manage tasks (start, stop, view history)
The integration is designed to fit seamlessly with your existing workflow system and UI components, while providing the
enhanced functionality required by your users.