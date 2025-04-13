import { useCallback, useState } from 'react';
import { AgentState, AgentData, AgentResult } from '@app-types/agent';
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

    const { getAgentState, updateAgentState, setAgentResult } = useAgentStore();
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

            console.log(`[useAgent] Initial taskId determined: ${taskId}`);

            if (!taskId) {
                throw new Error('Task ID not available - neither node ID nor agent ID is set');
            }

            let initialResponseData;
            let shouldCreateNewTask = true;

            console.log(`[useAgent] Checking existing task status for taskId: ${taskId}`);

            // First, check if there's an existing task and clean up if needed
            try {
                // Check if the task exists using the task ID
                const initialStatusResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}/status`);

                console.log(`[useAgent] Initial GET status response status: ${initialStatusResponse.status}`);

                if (initialStatusResponse.ok) {
                    const taskStatus = await initialStatusResponse.json();
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
                } else if (initialStatusResponse.status !== 404) {
                    console.error(
                        `[useAgent] Unexpected status ${initialStatusResponse.status} during initial task check.`
                    );
                    throw new Error(
                        `Unexpected status ${initialStatusResponse.status} during initial task check.`
                    );
                } else {
                    console.log('[useAgent] Initial GET status returned 404, proceeding to create task.');
                }
            } catch (error) {
                // If fetch itself fails or status is not OK and not 404
                console.error('[useAgent] Error during initial task status check:', error);
                // Check if the error is because of a non-404 status code handled above
                if (error instanceof Error && error.message.startsWith('Unexpected status')) {
                    // Already logged, just re-throw
                    throw error;
                } else if (error instanceof Response && error.status === 404) {
                    // This case might occur if the fetch promise rejects with a Response object on 404
                    // Treat 404 as non-fatal for the initial check
                    console.log('[useAgent] Initial GET status check caught 404 error, proceeding to create task.');
                } else {
                    // Network error or other unexpected issue
                    console.error('[useAgent] Network or unexpected error during initial task status check:', error);
                    setError(
                        'Failed to check initial task status. Network error or unexpected issue.'
                    );
                    updateAgentState(agentData.id, { state: AgentState.Error });
                    setIsProcessing(false);
                    // Re-throw or handle as appropriate, maybe return early
                    throw error; // Re-throw for now to see if it's caught higher up
                }
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

                            console.log(`[useAgent] POST /execute successful, response status: ${executeResponse.status}`);
                            initialResponseData = await executeResponse.json();
                            console.log(`[useAgent] POST /execute response data:`, initialResponseData);

                            // Extract the actual task ID returned by the backend
                            if (initialResponseData && initialResponseData.task_id) {
                                taskId = initialResponseData.task_id; // Update taskId with the one from the backend
                                console.log(`[useAgent] Updated taskId from backend response: ${taskId}`);
                                // Update agent store with the active task ID
                                updateAgentState(agentData.id, { activeTaskId: taskId });
                            }

                            return initialResponseData;
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

            console.log(`[useAgent] Starting status polling loop for taskId: ${taskId}`);

            // Poll for task completion
            let taskCompleted = initialResponseData.status === 'completed';
            let pollCount = 0;
            const maxPolls = 300; // Maximum number of polls (5 minutes at 1-second intervals)
            let consecutiveErrors = 0;
            const maxConsecutiveErrors = 5; // Maximum number of consecutive polling errors before giving up
            let lastError: string | null = null;

            let activeTaskId = taskId; // Store the final task ID used for polling
            while (!taskCompleted && pollCount < maxPolls) {
                try {
                    console.log(`[${pollCount + 1}/${maxPolls}] Polling status for task ${activeTaskId}...`);
                    const statusResponse = await fetch(`${browserUseEndpoint}/execute/${activeTaskId}/status`);

                    if (statusResponse.ok) {
                        consecutiveErrors = 0; // Reset error count on success
                        const statusData = await statusResponse.json();
                        console.log(`Status received for task ${activeTaskId}:`, statusData);

                        switch (statusData.status) {
                            case 'running':
                                updateAgentState(agentData.id, { state: AgentState.Working });
                                break;
                            case 'paused':
                                console.log(`Task ${activeTaskId} is paused.`);
                                updateAgentState(agentData.id, { state: AgentState.Assistance });
                                // Store assistance message
                                const currentDataPaused = useAgentStore.getState().getAgentData(agentData.id);
                                if (currentDataPaused) {
                                    useAgentStore.getState().setAgentData(agentData.id, {
                                        ...currentDataPaused,
                                        assistanceMessage: statusData?.message || 'Task paused, requires intervention',
                                        errorMessage: undefined // Clear any previous error
                                    });
                                }
                                setIsProcessing(false);
                                onStatusChange?.(AgentState.Assistance);
                                return ''; // Exit polling
                            case 'completed':
                                console.log(`Task ${activeTaskId} completed successfully.`);
                                updateAgentState(agentData.id, { state: AgentState.Complete });
                                // Store the result
                                const finalResultData = statusData.result || null; // Use null if result is missing

                                const formattedResult: AgentResult = {
                                    version: '1.0', // Or read from config/constants
                                    timestamp: new Date().toISOString(),
                                    data: finalResultData,
                                    // metadata: {} // Optional: Add any relevant metadata if available
                                };

                                // Store the formatted result in the AgentStore
                                console.log(`[useAgent] Storing final result:`, formattedResult);
                                useAgentStore.getState().setAgentResult(agentData.id, formattedResult);
                                setResult(JSON.stringify(statusData.result)); // Store result
                                setIsProcessing(false);
                                onStatusChange?.(AgentState.Complete);
                                return JSON.stringify(statusData.result);
                            case 'failed':
                                console.error(`Task ${activeTaskId} failed:`, statusData.error);
                                const failMsg = statusData?.error || 'Task execution failed';
                                setError(failMsg);
                                updateAgentState(agentData.id, { state: AgentState.Error });
                                // Store error message
                                const currentDataFailed = useAgentStore.getState().getAgentData(agentData.id);
                                if (currentDataFailed) {
                                    useAgentStore.getState().setAgentData(agentData.id, {
                                        ...currentDataFailed,
                                        errorMessage: failMsg,
                                        assistanceMessage: undefined // Clear any previous assistance msg
                                    });
                                }
                                setIsProcessing(false);
                                onStatusChange?.(AgentState.Error);
                                return ''; // Exit polling
                            case 'needs_assistance':
                                console.log(`Task ${activeTaskId} needs assistance.`);
                                const assistanceMsg = statusData?.message || 'Task requires assistance.';
                                // Store assistance message
                                const currentDataAssist = useAgentStore.getState().getAgentData(agentData.id);
                                if (currentDataAssist) {
                                    useAgentStore.getState().setAgentData(agentData.id, {
                                        ...currentDataAssist,
                                        assistanceMessage: assistanceMsg,
                                        errorMessage: undefined // Clear any previous error
                                    });
                                }
                                updateAgentState(agentData.id, { state: AgentState.Assistance });
                                onStatusChange?.(AgentState.Assistance);
                                setIsProcessing(false);
                                return ''; // Exit polling
                            default:
                                console.warn(`Unhandled task status: ${statusData.status}`);
                        }
                    } else {
                        consecutiveErrors++;
                        const errorMessage = `Error checking task status (${consecutiveErrors}/${maxConsecutiveErrors}): "Status check failed: ${statusResponse.status} ${statusResponse.statusText} - ${await statusResponse.text()}"`;
                        console.error(errorMessage);

                        if (consecutiveErrors >= maxConsecutiveErrors) {
                            const finalErrorMsg = `Too many consecutive errors checking task status: ${errorMessage}`;
                            console.error(finalErrorMsg);
                            setError(finalErrorMsg);
                            updateAgentState(agentData.id, { state: AgentState.Error });
                            // Store error message
                            const currentDataPollingMaxError = useAgentStore.getState().getAgentData(agentData.id);
                            if (currentDataPollingMaxError) {
                                useAgentStore.getState().setAgentData(agentData.id, {
                                    ...currentDataPollingMaxError,
                                    errorMessage: finalErrorMsg,
                                    assistanceMessage: undefined
                                });
                            }
                            setIsProcessing(false);
                            onStatusChange?.(AgentState.Error);
                            // Re-throw to be caught by the outer catch block
                            throw new Error(finalErrorMsg);
                        }
                    }
                } catch (pollError) {
                    // This catches errors *within* the polling loop's try block (e.g., network error on fetch)
                    // Also catches the re-thrown error from max consecutive errors
                    consecutiveErrors++; // Increment here too for fetch errors
                    const errorMsg = `Error during polling loop (${consecutiveErrors}/${maxConsecutiveErrors}): ${pollError instanceof Error ? pollError.message : String(pollError)}`;
                    console.error(errorMsg);

                    if (consecutiveErrors >= maxConsecutiveErrors) {
                        const finalErrorMsg = `Too many consecutive errors during polling: ${errorMsg}`;
                        setError(finalErrorMsg);
                        updateAgentState(agentData.id, { state: AgentState.Error });
                        // Store error message
                        const currentDataPollingMaxError = useAgentStore.getState().getAgentData(agentData.id);
                        if (currentDataPollingMaxError) {
                            useAgentStore.getState().setAgentData(agentData.id, {
                                ...currentDataPollingMaxError,
                                errorMessage: finalErrorMsg,
                                assistanceMessage: undefined
                            });
                        }
                        setIsProcessing(false);
                        onStatusChange?.(AgentState.Error);
                        // Re-throw to be caught by the outer catch block
                        throw new Error(finalErrorMsg);
                    }
                    // If not max errors yet, loop will continue after delay
                }

                // Wait before the next poll
                await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every 1 second

                pollCount++;
            }

            // If we've reached the maximum number of polls without completing, throw an error
            if (!taskCompleted) {
                throw new Error(`Task did not complete within the maximum number of polls (${maxPolls})`);
            }

            return 'Task completed successfully';
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            console.error('Error executing task:', message);
            setError(message);
            updateAgentState(agentData.id, { state: AgentState.Error });
            // Store error message in the main catch block
            const currentDataCatch = useAgentStore.getState().getAgentData(agentData.id);
            if (currentDataCatch) {
                useAgentStore.getState().setAgentData(agentData.id, {
                    ...currentDataCatch,
                    errorMessage: message,
                    assistanceMessage: undefined
                });
            }
            setIsProcessing(false);
            onStatusChange?.(AgentState.Error);
            return '';
        }
    }, [agentData, isProcessing, getAgentState, updateAgentState, setAgentResult, onStatusChange]);

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