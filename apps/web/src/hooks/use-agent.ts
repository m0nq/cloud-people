import { useCallback } from 'react';
import { useState } from 'react';

import { AgentState } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';
import { useWorkflowStore } from '@stores/workflow/store';

interface AgentHookResponse {
    isProcessing: boolean;
    executeAction: () => Promise<any>;
    pauseExecution: () => Promise<boolean>;
    result: string | null;
    error: string | null;
}

export const useAgent = (agentId: string, onStatusChange?: (status: AgentState) => void): AgentHookResponse => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { getAgentState, getAgentData } = useAgentStore();
    const agentData = getAgentData(agentId);
    const agentRuntime = getAgentState(agentData.id);

    const canExecute = !agentRuntime?.state || agentRuntime.state === AgentState.Working;

    const pauseExecution = useCallback(async (): Promise<boolean> => {
        if (!agentData.id) {
            console.error('Cannot pause - agent ID not available');
            return false;
        }

        try {
            const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
            const response = await fetch(`${browserUseEndpoint}/execute/${agentData.id}/pause`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log(`Paused execution for agent ${agentData.id}:`, responseData);

            // Update the agent state to Paused with metadata
            onStatusChange?.(AgentState.Paused);

            // Store pause metadata in the agent store
            const { updateAgentState } = useAgentStore.getState();
            updateAgentState(agentData.id, {
                metadata: {
                    pausedAt: new Date().toISOString(),
                    pauseReason: responseData.message || 'Execution paused by user',
                    pauseScreenshot: responseData.metadata?.screenshot
                }
            });

            // Update the result with pause information
            setResult(prev => `${prev ? prev : ''}\n\nPaused: ${responseData.message || 'Execution paused by user'}`);

            return true;
        } catch (error) {
            console.error('Error pausing execution:', error);
            setError(error instanceof Error ? error.message : 'Failed to pause execution');
            return false;
        }
    }, [agentData.id, onStatusChange]);

    const executeAction = useCallback(async () => {
        if (!agentData.id) {
            console.error('Cannot execute - agent ID not available');
            return '';
        }

        // Prevent double execution if already processing
        if (isProcessing) {
            console.log('Already processing, skipping execution');
            return '';
        }

        try {
            setIsProcessing(true);
            setError(null);
            setResult(null);

            const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
            if (!browserUseEndpoint) {
                throw new Error('Browser use endpoint not configured');
            }

            let taskId = agentData.id;
            let initialResponseData;
            let shouldCreateNewTask = true;

            // First, check if there's an existing task and clean up if needed
            try {
                // Check if the task exists
                const checkResponse = await fetch(`${browserUseEndpoint}/execute/${agentData.id}`);
                
                if (checkResponse.ok) {
                    const taskStatus = await checkResponse.json();
                    console.log(`Found existing task for agent ${agentData.id}:`, taskStatus);
                    
                    // If the task is in a terminal state or not in a resumable state, close the session
                    if (taskStatus.status === 'completed' || 
                        taskStatus.status === 'failed' || 
                        (taskStatus.status !== 'paused' && agentData.isResuming)) {
                        
                        console.log(`Task is in state ${taskStatus.status}, cleaning up before proceeding`);
                        
                        // Try to close the session
                        try {
                            await fetch(`${browserUseEndpoint}/sessions/${agentData.id}/close`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    force: true
                                })
                            });
                            console.log(`Closed existing session for agent ${agentData.id}`);
                            
                            // Wait a moment for the session to close
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } catch (closeError) {
                            console.error('Error closing existing session:', closeError);
                        }
                    } else if (taskStatus.status === 'paused' && agentData.isResuming) {
                        // If the task is paused and we're resuming, we'll try to resume it
                        shouldCreateNewTask = false;
                    }
                } else if (checkResponse.status !== 404) {
                    // If the response is not 404 (not found), log the error
                    console.error('Error checking task status:', checkResponse.status);
                }
            } catch (checkError) {
                console.error('Error checking for existing task:', checkError);
            }

            // If we should resume an existing task
            if (agentData.isResuming && !shouldCreateNewTask) {
                console.log(`Attempting to resume execution for agent ${agentData.id}`);
                
                try {
                    // Try to resume the task
                    const resumeResponse = await fetch(`${browserUseEndpoint}/execute/${agentData.id}/resume`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (resumeResponse.ok) {
                        initialResponseData = await resumeResponse.json();
                        console.log(`Resumed execution for agent ${agentData.id}:`, initialResponseData);

                        // Clear pause metadata in the agent store
                        const { updateAgentState } = useAgentStore.getState();
                        updateAgentState(agentData.id, {
                            metadata: {
                                resumedAt: new Date().toISOString()
                            }
                        });

                        // Update the result with resume information
                        setResult(`Resumed: ${initialResponseData.message || 'Execution resumed by user'}`);
                        
                        // We successfully resumed, so we don't need to create a new task
                        shouldCreateNewTask = false;
                    } else {
                        // If resume fails, check the error
                        const errorText = await resumeResponse.text().catch(() => null);
                        console.log('Resume failed:', resumeResponse.status, errorText);
                        
                        // For any resume error, we'll create a new task
                        console.log('Could not resume task, will create a new task');
                        shouldCreateNewTask = true;
                        
                        // Reset the isResuming flag since we can't resume
                        if (agentData) {
                            const { setAgentData } = useAgentStore.getState();
                            setAgentData(agentId, {
                                ...agentData,
                                isResuming: false
                            });
                        }
                    }
                } catch (resumeError) {
                    // If there's an exception during resume, log it and continue to create a new task
                    console.error('Error during resume attempt:', resumeError);
                    shouldCreateNewTask = true;
                }
            }

            // If we need to create a new task (either we weren't resuming or resume failed)
            if (shouldCreateNewTask) {
                console.log('Creating new task with endpoint:', browserUseEndpoint);

                // Check if this node has any outgoing connections (children)
                const workflowState = useWorkflowStore.getState();
                const hasChildren = workflowState.edges.some(edge => edge.source === agentId);

                try {
                    const response = await fetch(`${browserUseEndpoint}/execute`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            task: agentData.description || 'Navigate to google and perform research',
                            task_id: agentData.id, // Use the agent ID as the session ID for persistence
                            persistent_session: hasChildren, // Keep session open if this node has children
                            options: {
                                agentId: agentData.id,
                                speed: agentData.speed,
                                memoryLimit: agentData.memoryLimit,
                                model: agentData.model,
                                tools: agentData.tools
                            }
                        })
                    });

                    if (!response.ok) {
                        const errorText = await response.text().catch(() => null);
                        
                        // If we get a "task already exists" error, try to close and recreate
                        if (errorText && errorText.includes('already exists')) {
                            console.log('Task already exists, attempting to close and recreate...');
                            
                            // Try to create the task again with force option
                            const retryResponse = await fetch(`${browserUseEndpoint}/execute`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    task: agentData?.description || 'Navigate to google and perform research',
                                    task_id: agentData?.id,
                                    persistent_session: hasChildren,
                                    options: {
                                        agentId: agentData?.id,
                                        speed: agentData?.speed,
                                        memoryLimit: agentData?.memoryLimit,
                                        model: agentData?.model,
                                        tools: agentData?.tools,
                                        force: true // Add force option to clean up existing task
                                    }
                                })
                            });
                            
                            if (!retryResponse.ok) {
                                const retryErrorText = await retryResponse.text().catch(() => null);
                                throw new Error(`Failed to create task after retry: ${retryResponse.status} ${retryErrorText || 'Unknown error'}`);
                            }
                            
                            initialResponseData = await retryResponse.json();
                            console.log(`Created new task with force option for agent ${agentData.id}:`, initialResponseData);
                        } else {
                            // If it's not a "task already exists" error, throw the original error
                            console.error('Failed to create task:', response.status, errorText);
                            throw new Error(`Failed to create task: ${response.status} ${errorText || 'Unknown error'}`);
                        }
                    } else {
                        // Parse the response for a new task
                        try {
                            initialResponseData = await response.json();
                        } catch (e) {
                            console.error('Failed to parse initial response:', e);
                            throw new Error('Failed to parse task creation response');
                        }

                        if (initialResponseData.error) {
                            throw new Error(initialResponseData.error);
                        }

                        // Set initial result for a new task
                        setResult(initialResponseData.result || 'Task started...');
                    }
                } catch (error) {
                    // Handle errors from task creation
                    throw error;
                }
            }

            // At this point, we should have initialResponseData from either creating a new task or resuming

            // Get the task_id from the response or use the agent ID
            taskId = initialResponseData.task_id || agentData.id;
            if (!taskId) {
                throw new Error('No task ID returned from task creation or resume');
            }

            console.log('Task running:', { taskId, initialStatus: initialResponseData.status });

            // Poll for task completion
            let taskCompleted = initialResponseData.status === 'completed';
            let pollCount = 0;
            const maxPolls = 300; // Maximum number of polls (5 minutes at 1-second intervals)
            let consecutiveErrors = 0;
            const maxConsecutiveErrors = 5; // Maximum number of consecutive polling errors before giving up
            let lastError: string | null = null;

            while (!taskCompleted && pollCount < maxPolls) {
                // Wait 1 second between polls
                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    // Check task status
                    const statusResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}`);

                    // Log the raw response for debugging
                    console.log(`Status response for task ${taskId}:`, {
                        status: statusResponse.status,
                        ok: statusResponse.ok
                    });

                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json();
                        console.log(`Status data for task ${taskId}:`, statusData);

                        consecutiveErrors = 0; // Reset consecutive errors counter
                        lastError = null; // Clear last error

                        // Update result with latest information
                        if (statusData.result) {
                            setResult(statusData.result);
                        }

                        // Check if task is completed, failed, needs assistance, or paused
                        if (statusData.status === 'completed' ||
                            statusData.status === 'failed' ||
                            statusData.status === 'needs_assistance' ||
                            statusData.status === 'paused') {

                            // If task is paused, update state but don't mark as completed
                            if (statusData.status === 'paused') {
                                console.log(`Task ${taskId} is paused: ${statusData.metadata?.pause_reason}`);

                                // Store pause metadata in the agent store
                                const { updateAgentState } = useAgentStore.getState();
                                updateAgentState(agentData?.id || '', {
                                    metadata: {
                                        pausedAt: new Date().toISOString(),
                                        pauseReason: statusData.metadata?.pause_reason || 'Execution paused',
                                        pauseScreenshot: statusData.metadata?.screenshot
                                    }
                                });

                                setResult(prev => `${prev ? prev : ''}\n\nPaused: ${statusData.metadata?.pause_reason || 'Execution paused'}`);
                                onStatusChange?.(AgentState.Paused);
                                // Don't mark as completed, continue polling
                                pollCount++;
                                continue;
                            }

                            taskCompleted = true;

                            // If task failed, throw an error
                            if (statusData.status === 'failed' && statusData.error) {
                                throw new Error(statusData.error);
                            }

                            // If task needs assistance, update state
                            if (statusData.status === 'needs_assistance') {
                                console.log(`Task ${taskId} needs assistance: ${statusData.assistance_message}`);

                                // Store assistance metadata in the agent store
                                const { updateAgentState } = useAgentStore.getState();
                                updateAgentState(agentData.id || '', {
                                    metadata: {
                                        assistanceNeededAt: new Date().toISOString(),
                                        assistanceMessage: statusData.assistance_message || 'Assistance needed',
                                        assistanceScreenshot: statusData.metadata?.screenshot
                                    }
                                });

                                setResult(prev => `${prev ? prev : ''}\n\nNeeds assistance: ${statusData.assistance_message || 'Assistance needed'}`);
                                onStatusChange?.(AgentState.Assistance);
                            } else if (statusData.status === 'completed') {
                                // Task completed successfully
                                console.log(`Task ${taskId} completed successfully`);
                                onStatusChange?.(AgentState.Complete);

                                // Store completion metadata in the agent store
                                const { updateAgentState } = useAgentStore.getState();
                                updateAgentState(agentData.id || '', {
                                    metadata: {
                                        completedAt: new Date().toISOString(),
                                        result: statusData.result
                                    }
                                });
                            }
                        } else {
                            // Task is still running, update progress if available
                            if (statusData.progress !== undefined) {
                                // Update progress in the agent store
                                const { updateAgentState } = useAgentStore.getState();
                                updateAgentState(agentData.id || '', {
                                    progress: statusData.progress
                                });
                            }
                        }
                    } else {
                        // Handle HTTP error in status check
                        consecutiveErrors++;
                        lastError = `HTTP error! status: ${statusResponse.status}`;
                        console.error(`Error checking task status (${consecutiveErrors}/${maxConsecutiveErrors}):`, lastError);

                        // If we've had too many consecutive errors, stop polling
                        if (consecutiveErrors >= maxConsecutiveErrors) {
                            throw new Error(`Too many consecutive errors checking task status: ${lastError}`);
                        }
                    }
                } catch (error) {
                    // Handle error in status check
                    consecutiveErrors++;
                    lastError = error instanceof Error ? error.message : 'Unknown error checking task status';
                    console.error(`Error checking task status (${consecutiveErrors}/${maxConsecutiveErrors}):`, lastError);

                    // If we've had too many consecutive errors, stop polling
                    if (consecutiveErrors >= maxConsecutiveErrors) {
                        throw new Error(`Too many consecutive errors checking task status: ${lastError}`);
                    }
                }

                pollCount++;
            }

            // If we've reached the maximum number of polls without completing, throw an error
            if (!taskCompleted) {
                throw new Error(`Task did not complete within the maximum number of polls (${maxPolls})`);
            }

            return 'Task completed successfully';
        } catch (error) {
            console.error('Error executing action:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');

            // Let the agent store handle the error state transition
            onStatusChange?.(AgentState.Error);

            // If there was an error, try to close the session to clean up resources
            try {
                const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
                await fetch(`${browserUseEndpoint}/sessions/${agentData.id}/close`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        force: true
                    })
                });
                console.log(`Closed browser session for agent ${agentData.id} after error`);
            } catch (closeError) {
                console.error('Error closing browser session after error:', closeError);
            }

            return error instanceof Error ? error.message : 'An unknown error occurred';
        } finally {
            // Always ensure we reset the processing state
            setIsProcessing(false);
        }
    }, [agentData, agentRuntime?.state, canExecute, isProcessing, onStatusChange, agentId]);

    return {
        isProcessing,
        executeAction,
        pauseExecution,
        result,
        error
    };
};
