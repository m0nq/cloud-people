import { useCallback } from 'react';
import { useState } from 'react';

import { AgentState } from '@app-types/agent';
import { AgentData } from '@app-types/agent/config';
import { AgentResult } from '@app-types/agent';

import { useAgentStore } from '@stores/agent-store';
import { useWorkflowStore } from '@stores/workflow';
import { updateState } from '@stores/workflow';
// Rename imported function to avoid name collision
import { pauseAgentExecution as pauseAgentOp } from '@lib/agent-operations';

// Helper function to get provider type from model name
const getProviderTypeFromModel = (modelName: string | undefined): string => {
    if (!modelName) return 'gemini'; // Default to gemini if model isn't specified
    const lowerModelName = modelName.toLowerCase();
    if (lowerModelName.includes('gpt')) return 'openai';
    if (lowerModelName.includes('claude')) return 'anthropic';
    if (lowerModelName.includes('gemini')) return 'gemini';
    console.warn(`Could not determine LLM provider type for model: ${modelName}. Defaulting to gemini.`);
    return 'gemini'; // Fallback default
};

interface AgentHookResponse {
    isProcessing: boolean;
    executeTask: () => Promise<any>;
    pauseAgentExecution: () => Promise<boolean>;
    result: string | null;
    error: string | null;
}

export const useAgent = (agentData: AgentData, onStatusChange?: (status: AgentState) => void): AgentHookResponse => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { getAgentState, updateAgentState } = useAgentStore();
    const agentRuntime = getAgentState(agentData.id);

    const canExecute = !agentRuntime?.state || agentRuntime.state === AgentState.Working;

    const executeTask = useCallback(async () => {
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

            // Use activeTaskId if available, otherwise use nodeId, then fall back to agent ID
            let taskId = agentData.activeTaskId || agentData.nodeId || agentData.id;

            if (!taskId) {
                throw new Error('Task ID not available - neither node ID nor agent ID is set');
            }

            let initialResponseData;
            let shouldCreateNewTask = true;

            // First, check if there's an existing task and clean up if needed
            try {
                // Check if the task exists using the task ID
                const checkResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}/status`);

                if (checkResponse.ok) {
                    const taskStatus = await checkResponse.json();
                    console.log(`Found existing task for agent ${agentData.id} with task ID ${taskId}:`, taskStatus);

                    // If the task is in a terminal state or not in a resumable state, close the session
                    if (taskStatus.status === 'completed' ||
                        taskStatus.status === 'failed' ||
                        (taskStatus.status !== 'paused' && agentData.isResuming)) {

                        console.log(`Task is in state ${taskStatus.status}, cleaning up before proceeding`);

                        // Try to close the session
                        try {
                            await fetch(`${browserUseEndpoint}/sessions/${taskId}/close`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    force: true
                                })
                            });
                            console.log(`Closed existing session for task ID ${taskId}`);
                        } catch (closeError) {
                            console.error('Error closing session:', closeError);
                        }
                    } else if (taskStatus.status === 'paused' && agentData.isResuming) {
                        // If the task is paused and we're resuming, don't create a new task
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
                console.log(`Attempting to resume execution for task ID ${taskId}`);

                try {
                    // Try to resume the task using the consistent task ID
                    const resumeResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}/resume`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (resumeResponse.ok) {
                        initialResponseData = await resumeResponse.json();
                        console.log(`Resumed execution for task ID ${taskId}:`, initialResponseData);

                        // Clear pause metadata in the agent store
                        const { updateAgentState, setAgentData } = useAgentStore.getState();
                        updateAgentState(agentData.id, {
                            metadata: {
                                resumedAt: new Date().toISOString()
                            }
                        });

                        // Store the taskId used for resuming to ensure consistency
                        setAgentData(agentData.id, {
                            ...agentData,
                            activeTaskId: taskId
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
                            setAgentData(agentData.id, { ...agentData, isResuming: false });
                        }
                    }
                } catch (resumeError) {
                    console.error('Error resuming task:', resumeError);
                    shouldCreateNewTask = true;

                    // Reset the isResuming flag since we can't resume
                    if (agentData) {
                        const { setAgentData } = useAgentStore.getState();
                        setAgentData(agentData.id, { ...agentData, isResuming: false });
                    }
                }
            }

            // If we need to create a new task
            if (shouldCreateNewTask) {
                console.log(`Creating new task for agent ${agentData.id} with task ID ${taskId}`);

                // Check if this node has any outgoing connections (children)
                const workflowStore = useWorkflowStore.getState();
                const hasChildren = workflowStore.edges.some(edge => edge.source === agentData.nodeId ||
                    (edge.data && edge.data.fromNodeId === agentData.nodeId));

                console.log(`Node ${agentData.nodeId} has children: ${hasChildren}`);

                try {
                    // Create a new task
                    const createTask = async (currentTaskId: string, retryCount = 0): Promise<any> => {
                        if (retryCount > 3) {
                            throw new Error('Maximum retry count exceeded when creating task');
                        }

                        try {
                            const executeResponse = await fetch(`${browserUseEndpoint}/execute`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    task: agentData.description || 'Navigate to google and perform research',
                                    task_id: currentTaskId,
                                    persistent_session: hasChildren, // Only keep session open if this node has children
                                    headless: false,
                                    // Add llm_provider according to backend expectations
                                    llm_provider: {
                                        type: getProviderTypeFromModel(agentData.model),
                                        model: agentData.model
                                    },
                                    previous_agent_output: agentData.previousAgentOutput
                                })
                            });

                            if (!executeResponse.ok) {
                                const errorData = await executeResponse.json().catch(() => null);
                                const errorMessage = errorData?.detail || `HTTP error! status: ${executeResponse.status}`;

                                // If task already exists, generate a new unique ID and retry
                                if (errorMessage.includes('already exists')) {
                                    console.log(`Task with ID ${currentTaskId} already exists. Generating new ID and retrying...`);

                                    // Generate a new unique ID by combining the original ID with a timestamp
                                    const newTaskId = `${agentData.nodeId || agentData.id}_${Date.now()}`;
                                    console.log(`Generated new task ID: ${newTaskId}`);

                                    // Update the agent data with the new task ID
                                    const { setAgentData } = useAgentStore.getState();
                                    setAgentData(agentData.id, {
                                        ...agentData,
                                        activeTaskId: newTaskId
                                    });

                                    // Retry with the new ID
                                    return createTask(newTaskId, retryCount + 1);
                                } else {
                                    throw new Error(errorMessage);
                                }
                            }

                            const responseData = await executeResponse.json();
                            console.log(`Created new task for agent ${agentData.id} with task ID ${currentTaskId}:`, responseData);
                            return responseData;
                        } catch (error) {
                            console.error(`Error creating task (attempt ${retryCount + 1}):`, error);
                            throw error;
                        }
                    };

                    // Start the task creation process
                    initialResponseData = await createTask(taskId);

                    // Store the final taskId used for execution to ensure consistency
                    const { setAgentData } = useAgentStore.getState();
                    
                    // Make sure we're using the task_id from the response
                    const finalTaskId = initialResponseData.task_id || taskId;
                    console.log(`[DEBUG] Storing final task ID in agent data: ${finalTaskId}`);
                    
                    setAgentData(agentData.id, {
                        ...agentData,
                        activeTaskId: finalTaskId
                    });

                    // Also update the workflow store to ensure the currentNodeId is set
                    // This is critical for pause/resume operations
                    if (agentData.nodeId) {
                        const workflowStore = useWorkflowStore.getState();
                        const { workflowExecution } = workflowStore;
                        
                        if (workflowExecution) {
                            // Use updateState utility function from @stores/workflow
                            updateState(useWorkflowStore.setState, {
                                workflowExecution: {
                                    ...workflowExecution,
                                    currentNodeId: agentData.nodeId
                                }
                            });
                            console.log(`[DEBUG] Updated workflow execution with currentNodeId: ${agentData.nodeId}`);
                        }
                    }

                    // Update the result with task information
                    setResult(`Task created: ${finalTaskId}`);
                } catch (error) {
                    console.error('Error creating task:', error);
                    setError(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
                    onStatusChange?.(AgentState.Error);
                    setIsProcessing(false);
                    return '';
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
                try {
                    console.log(`[${pollCount + 1}/${maxPolls}] Polling status for task ${taskId}...`);
                    const statusResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}/status`);
                    const statusData = await statusResponse.json();

                    console.log(`Status received for task ${taskId}:`, statusData);

                    if (!statusResponse.ok) {
                        // If the status endpoint itself returns an error (e.g., 404, 500)
                        throw new Error(`Status check failed: ${statusResponse.status} ${statusResponse.statusText} - ${statusData.detail || JSON.stringify(statusData)}`);
                    }

                    // Reset consecutive errors count on successful poll
                    consecutiveErrors = 0;

                    updateAgentState(agentData.id, { state: statusData.status });
                    setResult(JSON.stringify(statusData.output, null, 2)); // Update result with output

                    switch (statusData.status) {
                        case AgentState.Complete:
                            console.log(`Task ${taskId} completed successfully.`);
                            updateAgentState(agentData.id, { result: statusData.output }); // Store final result
                            onStatusChange?.(AgentState.Complete);
                            taskCompleted = true;
                            break;
                        case AgentState.Error:
                        case 'failed': // Handle backend 'failed' state
                            console.error(`Task ${taskId} failed: ${statusData.error || 'Unknown error'}`);
                            setError(statusData.error || 'Task failed');
                            updateAgentState(agentData.id, { state: AgentState.Error, error: statusData.error });
                            onStatusChange?.(AgentState.Error);
                            taskCompleted = true; // Stop polling on failure
                            break;
                        case AgentState.Working:
                        case AgentState.Paused:
                            // Continue polling for these states
                            console.log(`Task ${taskId} is ${statusData.status}. Continuing poll.`);
                            onStatusChange?.(statusData.status as AgentState); // Update intermediate status
                            break;
                        default:
                            // Handle unexpected status
                            console.warn(`Received unexpected status '${statusData.status}' for task ${taskId}`);
                            break;
                    }
                } catch (error) {
                    lastError = error instanceof Error ? error.message : 'Unknown status check error';
                    console.error(`Error during status poll for task ${taskId}:`, error);
                    consecutiveErrors++;
                    // Exponential backoff
                    const pollInterval = Math.min(1000 * 2 ** consecutiveErrors, 30000); // 30 seconds max
                    console.warn(`Polling interval increased to ${pollInterval}ms due to error.`);

                    // Log consecutive errors if they occur
                    console.error(`Error checking task status (${consecutiveErrors}/${maxConsecutiveErrors}):`, lastError);

                    // If we've had too many consecutive errors, stop polling
                    if (consecutiveErrors >= maxConsecutiveErrors) {
                        throw new Error(`Too many consecutive errors checking task status: ${lastError}`);
                    }
                } finally {
                    // Wait before the next poll, only if the task isn't finished
                    if (!taskCompleted) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
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
                // Use the same taskId that was used for execution
                const taskId = agentData.activeTaskId || agentData.nodeId || agentData.id;

                await fetch(`${browserUseEndpoint}/sessions/${taskId}/close`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        force: true
                    })
                });
                console.log(`Closed browser session for task ID ${taskId} after error`);
            } catch (closeError) {
                console.error('Error closing browser session after error:', closeError);
            }

            return error instanceof Error ? error.message : 'An unknown error occurred';
        } finally {
            // Always ensure we reset the processing state
            setIsProcessing(false);
        }
    }, [agentData, isProcessing, onStatusChange]);

    const pauseAgentExecution = useCallback(async (): Promise<boolean> => {
        if (!agentData?.id) {
            console.warn("[useAgent] Cannot pause: Agent data or ID unavailable.");
            return false;
        }
        // Use activeTaskId from store state or fallback
        const currentRuntime = getAgentState(agentData.id);
        const taskId = currentRuntime?.activeTaskId || agentData.activeTaskId || agentData.nodeId;

        if (!taskId) {
            console.warn('[useAgent] Cannot pause agent: Task ID not available.');
            return false;
        }

        console.log(`[useAgent] Requesting pause for task ${taskId}`);
        try {
            // Call the standalone pause operation utility using the alias
            const success = await pauseAgentOp(taskId, agentData);
            if (success) {
                // Update state locally via store - pauseAgentOp handles the API call
                updateAgentState(agentData.id, { state: AgentState.Paused, activeTaskId: taskId });
                onStatusChange?.(AgentState.Paused); // Use onStatusChange from hook scope
                return true;
            } else {
                setError(`Failed to pause task ${taskId}`);
                return false;
            }
        } catch (err) {
            console.error('[useAgent] Error pausing task:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            return false;
        }
        // Depend on agentData, store functions, and callbacks
    }, [agentData, getAgentState, updateAgentState, onStatusChange, setError]);

    return {
        isProcessing,
        executeTask,
        pauseAgentExecution,
        result,
        error
    };
};