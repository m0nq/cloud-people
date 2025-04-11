import { useCallback } from 'react';
import { useState } from 'react';

import { AgentState } from '@app-types/agent';
import { AgentData } from '@app-types/agent/config';

import { useAgentStore } from '@stores/agent-store';
import { useWorkflowStore } from '@stores/workflow';
import { updateState } from '@stores/workflow';
import { pauseAgentExecution } from '@lib/agent-operations';

interface AgentHookResponse {
    isProcessing: boolean;
    executeTask: () => Promise<any>;
    pauseAgentExecution: (agentId: string, agentData: AgentData, onStatusChange?: (status: AgentState) => void) => Promise<boolean>;
    result: string | null;
    error: string | null;
    state: AgentState;
    provideAssistance: (assistanceData: any) => Promise<void>;
    pauseExecution: () => Promise<void>;
    resumeExecution: () => Promise<void>;
    cancelExecution: () => Promise<void>;
    canExecute: boolean;
}

export const useAgent = (agentId: string, onStatusChange?: (status: AgentState) => void): AgentHookResponse => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { getAgentState, getAgentData } = useAgentStore();
    const agentData = getAgentData(agentId);
    const agentRuntime = getAgentState(agentData!.id);

    const canExecute = !agentRuntime?.state || agentRuntime.state === AgentState.Working;

    const executeTask = useCallback(async () => {
        if (!agentData!.id) {
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
            // Update agent state to working immediately for better UX
            useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Working });
            onStatusChange?.(AgentState.Working);

            const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
            if (!browserUseEndpoint) {
                throw new Error('Browser use endpoint not configured');
            }

            // Determine the initial task ID for resume attempts or fallback
            let taskId = agentData!.activeTaskId || agentData!.nodeId || agentData!.id;
            let finalTaskId = taskId; // This will hold the ID used for polling
            let initialResponseData;

            if (!taskId) {
                throw new Error('Task ID not available - cannot determine ID for execution or resume');
            }

            // --- Simplified Logic ---            
            if (agentData!.isResuming) {
                // --- Attempt to Resume ---                
                console.log(`Attempting to resume execution for task ID ${taskId}`);
                try {
                    const resumeResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}/resume`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (resumeResponse.ok) {
                        initialResponseData = await resumeResponse.json();
                        finalTaskId = initialResponseData.task_id || taskId; // Use returned ID if available
                        console.log(`Resumed execution for task ID ${finalTaskId}:`, initialResponseData);
                        // Clear pause metadata in the agent store
                        const { updateAgentState, setAgentData } = useAgentStore.getState();
                        updateAgentState(agentId, { state: AgentState.Working });
                        setAgentData(agentId, { ...agentData!, isResuming: false });
                    } else {
                        // Handle non-OK resume response (e.g., 404 if task not found/not paused)
                        const errorText = await resumeResponse.text();
                        throw new Error(`Failed to resume task ${taskId}. Status: ${resumeResponse.status}. Details: ${errorText}`);
                    }
                } catch (resumeError) {
                    console.error('Error resuming task:', resumeError);
                    setError(`Failed to resume task: ${resumeError instanceof Error ? resumeError.message : String(resumeError)}`);
                    useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Error });
                    onStatusChange?.(AgentState.Error);
                    setIsProcessing(false);
                    return ''; // Stop execution
                }
            } else {
                // --- Create New Task ---
                console.log(`Executing new task for agent ${agentId}`);
                // Construct request body according to TaskRequest model using fields from AgentData
                const requestBody = {
                    task: agentData?.description, // REQUIRED: Use the description from AgentData
                    llm_provider: agentData?.model ? { type: 'gemini', model: agentData.model } : undefined, // Use 'gemini' type
                    previous_agent_output: agentData?.previousAgentOutput, // Map previous output
                    // task_id is optional, backend generates if missing
                    // Map other relevant optional fields from agentData if they exist
                    // e.g., operation_timeout: agentData?.timeout, 
                    //       options: agentData?.options
                };

                // Ensure the required 'task' field is present
                if (!requestBody.task) {
                    throw new Error("Cannot execute task: 'description' (task description) not found in agentData.");
                }

                console.log("Sending TaskRequest:", JSON.stringify(requestBody, null, 2));

                try {
                    const response = await fetch(`${browserUseEndpoint}/execute`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    });

                    if (response.ok) {
                        initialResponseData = await response.json();
                        finalTaskId = initialResponseData.task_id; // CRITICAL: Use the ID returned by the backend
                        console.log(`Task created with ID ${finalTaskId}:`, initialResponseData);
                        // Update agent store with the definitive task ID
                        useAgentStore.getState().setAgentData(agentId, { ...agentData!, activeTaskId: finalTaskId });
                    } else {
                        const errorText = await response.text();
                        throw new Error(`Failed to execute task. Status: ${response.status}. Details: ${errorText}`);
                    }
                } catch (createError) {
                    console.error('Error creating task:', createError);
                    setError(`Failed to create task: ${createError instanceof Error ? createError.message : String(createError)}`);
                    useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Error });
                    onStatusChange?.(AgentState.Error);
                    setIsProcessing(false);
                    return ''; // Stop execution
                }
            }

            // --- Start Polling ---            
            if (finalTaskId && initialResponseData) {
                // Update state based on initial response
                updateStateFromStatus(initialResponseData);
                // Start polling only if the initial status is not terminal
                if (initialResponseData.status !== 'completed' && initialResponseData.status !== 'failed') {
                    pollTaskStatus(finalTaskId);
                } else {
                    setIsProcessing(false); // Already done
                }
            } else {
                 throw new Error('Failed to obtain task ID or initial response data after execution/resume.');
            }

        } catch (err) {
            console.error('Execution failed:', err);
            setError(err instanceof Error ? err.message : String(err));
            useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Error });
            onStatusChange?.(AgentState.Error);
            setIsProcessing(false);
        }
    }, [agentId, agentData, agentRuntime, isProcessing, onStatusChange]);

    // Helper function to update state based on task status
    const updateStateFromStatus = (taskStatus: any) => {
        switch (taskStatus.status) {
            case 'running':
            case 'pending':
                useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Working });
                onStatusChange?.(AgentState.Working);
                break;
            case 'paused':
                useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Paused });
                onStatusChange?.(AgentState.Paused);
                setIsProcessing(false); // Stop processing indicator if paused
                break;
            case 'completed':
                setResult(taskStatus.result || 'Completed successfully');
                useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Complete, result: taskStatus.result });
                onStatusChange?.(AgentState.Complete);
                setIsProcessing(false);
                break;
            case 'failed':
                setError(taskStatus.error || 'Task failed');
                useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Error, error: taskStatus.error });
                onStatusChange?.(AgentState.Error);
                setIsProcessing(false);
                break;
             case 'needs_assistance': // Changed from 'waiting_for_assistance'
                useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Assistance });
                onStatusChange?.(AgentState.Assistance);
                setIsProcessing(false); // Stop processing indicator if waiting
                break;
            default:
                const unknownStatusError = `Unknown task status received: ${taskStatus.status}`;
                console.error(unknownStatusError); // Log as error
                setError(unknownStatusError);
                useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Error, error: unknownStatusError }); 
                onStatusChange?.(AgentState.Error);
                setIsProcessing(false); // Also stop processing on unknown status
                break;
        }
    };

    // Polling function
    const pollTaskStatus = useCallback((taskId: string) => {
        console.log(`Starting polling for task ID: ${taskId}`);

        const intervalId = setInterval(async () => {
            try {
                const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
                const statusResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}`);

                if (statusResponse.ok) {
                    const taskStatus = await statusResponse.json();
                    console.log(`Poll status for ${taskId}:`, taskStatus.status);
                    updateStateFromStatus(taskStatus);

                    // Stop polling if task is completed, failed, paused, or needs assistance
                    if (taskStatus.status === 'completed' || 
                        taskStatus.status === 'failed' || 
                        taskStatus.status === 'paused' || 
                        taskStatus.status === 'needs_assistance') {
                        console.log(`Stopping polling for task ID: ${taskId} due to status: ${taskStatus.status}`);
                        clearInterval(intervalId);
                    }
                } else {
                    // Handle non-OK polling response (e.g., 404 if task disappeared?)
                    console.error(`Polling error for ${taskId}: Status ${statusResponse.status}`);
                    setError(`Polling failed with status ${statusResponse.status}`);
                     useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Error });
                     onStatusChange?.(AgentState.Error);
                    clearInterval(intervalId);
                    setIsProcessing(false);
                }
            } catch (pollError) {
                console.error(`Polling failed for ${taskId}:`, pollError);
                setError(`Polling failed: ${pollError instanceof Error ? pollError.message : String(pollError)}`);
                 useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Error });
                 onStatusChange?.(AgentState.Error);
                clearInterval(intervalId);
                setIsProcessing(false);
            }
        }, 2000); // Poll every 2 seconds

    }, [agentId, onStatusChange]);
    
    // Provide functions to interact with the agent
    const provideAssistance = useCallback(async (assistanceData: any) => {
        const taskId = agentData?.activeTaskId || agentData?.nodeId || agentId;
        if (!taskId) {
             console.error('Cannot provide assistance - task ID not available');
             return;
        }
        console.log(`Providing assistance for task ${taskId}`);
        try {
            const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
            const response = await fetch(`${browserUseEndpoint}/execute/${taskId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(assistanceData)
            });
            if (response.ok) {
                const taskStatus = await response.json();
                updateStateFromStatus(taskStatus); // Should update state back to Working
                // Resume polling if needed
                if (taskStatus.status === 'running' || taskStatus.status === 'pending') {
                    pollTaskStatus(taskId);
                }
            } else {
                throw new Error(`Failed to provide assistance. Status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error providing assistance:', error);
            setError(`Failed to provide assistance: ${error instanceof Error ? error.message : String(error)}`);
             useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Error });
             onStatusChange?.(AgentState.Error);
        }
    }, [agentId, agentData, onStatusChange, pollTaskStatus, updateStateFromStatus]); // Added dependencies

    // Renamed function to have complex signature for pauseAgentExecution property
    const pauseAgentExecutionInternal = useCallback(async (_agentId?: string, _agentData?: AgentData, _onStatusChange?: (status: AgentState) => void): Promise<boolean> => {
        // Note: Using agentId, agentData, onStatusChange from hook scope, not parameters
        const taskId = agentData?.activeTaskId || agentData?.nodeId || agentId;
        if (!taskId) {
             console.error('Cannot pause - task ID not available');
             return false; // Return boolean failure
        }
        console.log(`Pausing task ${taskId}`);
        try {
            const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
            const response = await fetch(`${browserUseEndpoint}/execute/${taskId}/pause`, { method: 'POST' });
            if (response.ok) {
                const taskStatus = await response.json();
                updateStateFromStatus(taskStatus); // Should update state to Paused
                return true; // Return boolean success
            } else {
                throw new Error(`Failed to pause task. Status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error pausing task:', error);
            setError(`Failed to pause task: ${error instanceof Error ? error.message : String(error)}`);
             useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Error });
             onStatusChange?.(AgentState.Error);
             return false; // Return boolean failure
        }
    }, [agentId, agentData, onStatusChange, updateStateFromStatus]); // Dependencies remain the same

    // Create a wrapper function with the simple signature for pauseExecution property
    const pauseExecution = useCallback(async (): Promise<void> => {
        // Call the internal function using scope variables and ignore boolean result
        await pauseAgentExecutionInternal(agentId, agentData, onStatusChange);
    }, [agentId, agentData, onStatusChange, pauseAgentExecutionInternal]);

    const resumeExecution = useCallback(async () => { // Made function async
        if (agentRuntime?.state === AgentState.Paused) {
            console.log(`Requesting resume for agent ${agentId}`);
            // Set the isResuming flag before calling executeTask
            useAgentStore.getState().setAgentData(agentId, { ...agentData!, isResuming: true });
            executeTask(); // executeTask will now handle the resume logic
        } else {
             console.warn(`Cannot resume agent ${agentId} from state ${agentRuntime?.state}`);
        }
    }, [agentId, agentData, agentRuntime?.state, executeTask]); // Added dependencies

    const cancelExecution = useCallback(async () => {
        const taskId = agentData?.activeTaskId || agentData?.nodeId || agentId;
        if (!taskId) {
             console.error('Cannot cancel - task ID not available');
             return;
        }
        console.log(`Canceling task ${taskId}`);
        setIsProcessing(false); // Stop processing indicator immediately

        try {
            const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
            const response = await fetch(`${browserUseEndpoint}/execute/${taskId}/cancel`, { method: 'POST' });
            if (response.ok) {
                // const taskStatus = await response.json(); // Backend might return final status
                // updateStateFromStatus(taskStatus);
                 useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Idle, error: 'Cancelled by user' });
                 onStatusChange?.(AgentState.Idle);
                 setError('Cancelled by user');
            } else {
                throw new Error(`Failed to cancel task. Status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error canceling task:', error);
            setError(`Failed to cancel task: ${error instanceof Error ? error.message : String(error)}`);
             useAgentStore.getState().updateAgentState(agentId, { state: AgentState.Error, error: `Cancel failed: ${error instanceof Error ? error.message : String(error)}` });
             onStatusChange?.(AgentState.Error);
        }
    }, [agentId, agentData, onStatusChange]); // Added dependencies

    // Return the complete hook response object
    return { 
        executeTask,
        isProcessing,
        result,
        error,
        state: agentRuntime?.state ?? AgentState.Idle, // Changed Unknown to Idle
        provideAssistance, 
        pauseAgentExecution: pauseAgentExecutionInternal, // Assign internal func (complex signature)
        pauseExecution: pauseExecution,                 // Assign wrapper func (simple signature)
        resumeExecution,   
        cancelExecution,   
        canExecute
    }; 
};