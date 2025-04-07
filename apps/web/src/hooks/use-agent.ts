import { useCallback } from 'react';
import { useState } from 'react';

import { AgentState } from '@app-types/agent';
import { AgentData } from '@app-types/agent/config';
import { AgentResult } from '@app-types/agent';

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
}

// Helper function for telemetry
const trackDataPassingEvent = (taskId: string, operation: string, success: boolean) => {
    // Implementation would depend on your analytics system
    console.log(`[Telemetry] Data passing ${operation} for task ${taskId}: ${success ? 'Success' : 'Failure'}`);
    
    // In a real implementation, you would send this to your analytics system
    // analyticsClient.track('workflow_data_passing', { taskId, operation, success });
};

export const useAgent = (agentId: string, onStatusChange?: (status: AgentState) => void): AgentHookResponse => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { getAgentState, getAgentData, setAgentResult } = useAgentStore();
    const agentData = getAgentData(agentId);
    const agentRuntime = getAgentState(agentData?.id || '');

    const canExecute = !agentRuntime?.state || agentRuntime.state === AgentState.Working;

    const executeTask = useCallback(async () => {
        if (!agentData?.id) {
            console.error('Cannot execute - agent ID not available');
            return '';
        }

        // Prevent double execution if already processing
        if (isProcessing) {
            console.log('Already processing, skipping execution');
            return '';
        }

        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
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
                    const checkResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}`);

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
                            console.log(`Resuming existing paused task with ID ${taskId}`);
                        }
                    }
                } catch (checkError) {
                    console.error('Error checking task status:', checkError);
                    // Continue with creating a new task
                }

                // Create a new task or resume an existing one
                if (shouldCreateNewTask) {
                    console.log(`Creating new task for agent ${agentData.id} with task ID ${taskId}`);
                    initialResponseData = await createTask(taskId);
                } else {
                    console.log(`Resuming task for agent ${agentData.id} with task ID ${taskId}`);
                    // Resume the task
                    const resumeResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}/resume`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            operation_timeout: 300,
                            headless: true
                        })
                    });

                    if (!resumeResponse.ok) {
                        throw new Error(`HTTP error! status: ${resumeResponse.status}`);
                    }

                    initialResponseData = await resumeResponse.json();
                    console.log(`Successfully resumed task ${taskId}:`, initialResponseData);
                }

                // Poll for task status until completion
                const maxPolls = 100;
                const pollInterval = 2000; // 2 seconds
                let pollCount = 0;
                let taskCompleted = false;
                let consecutiveErrors = 0;
                const maxConsecutiveErrors = 5;
                let lastError = '';

                while (pollCount < maxPolls && !taskCompleted) {
                    // Wait for the poll interval
                    await new Promise(resolve => setTimeout(resolve, pollInterval));

                    try {
                        // Check task status
                        const statusResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}`);

                        if (statusResponse.ok) {
                            // Reset consecutive errors counter on success
                            consecutiveErrors = 0;

                            const statusData = await statusResponse.json();
                            console.log(`Task ${taskId} status:`, statusData.status);

                            // If task is completed or failed, stop polling
                            if (statusData.status === 'completed' || statusData.status === 'failed') {
                                taskCompleted = true;
                                console.log(`Task ${taskId} ${statusData.status}:`, statusData);

                                // Update agent state based on task status
                                if (statusData.status === 'completed') {
                                    // Store the result in agent state
                                    if (statusData.result) {
                                        setAgentResult(agentData.id, statusData.result);
                                        trackDataPassingEvent(taskId, 'store_result', true);
                                        console.log(`[DEBUG] Stored result for agent ${agentData.id}:`, statusData.result);
                                    }
                                    
                                    onStatusChange?.(AgentState.Complete);
                                    setResult(statusData.result);
                                } else {
                                    onStatusChange?.(AgentState.Error);
                                    setError(statusData.error || 'Task failed');
                                    trackDataPassingEvent(taskId, 'store_result', false);
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
                retryCount++;
                console.error(`Error executing task (attempt ${retryCount}/${maxRetries}):`, error);
                
                // Track failed data passing
                trackDataPassingEvent(agentData.id, 'execute', false);
                
                if (retryCount >= maxRetries) {
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
                }
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
            } finally {
                // Always ensure we reset the processing state
                setIsProcessing(false);
            }
        }
        
        return 'Task completed with retries';
    }, [agentData, isProcessing, onStatusChange, setAgentResult]);

    // Create a new task
    const createTask = async (currentTaskId: string, retryCount = 0): Promise<any> => {
        const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
        
        try {
            // Serialize previous output for transmission if available
            let previousOutput: AgentResult | undefined = undefined;
            if (agentData?.previousAgentOutput) {
                try {
                    previousOutput = agentData.previousAgentOutput;
                    console.log(`[DEBUG] Including previous agent output in task request:`, previousOutput);
                    trackDataPassingEvent(currentTaskId, 'include_previous_output', true);
                } catch (serializeError) {
                    console.error('Error serializing previous output:', serializeError);
                    trackDataPassingEvent(currentTaskId, 'include_previous_output', false);
                }
            }
            
            // Create task request with previous agent output
            const taskRequest: any = {
                task: agentData?.description,
                task_id: currentTaskId,
                operation_timeout: 300,
                headless: true,
                persistent_session: true,
            };
            
            // Only add previous_output if it exists
            if (previousOutput) {
                taskRequest.previous_output = previousOutput;
            }
            
            console.log(`Creating task with request:`, taskRequest);
            
            const response = await fetch(`${browserUseEndpoint}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskRequest)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log(`Successfully created task ${currentTaskId}:`, responseData);
            
            // Track successful task creation
            trackDataPassingEvent(currentTaskId, 'create_task', true);
            
            return responseData;
        } catch (error) {
            console.error(`Error creating task (attempt ${retryCount + 1}):`, error);
            
            // Track failed task creation
            trackDataPassingEvent(currentTaskId, 'create_task', false);
            
            // Retry a few times with exponential backoff
            if (retryCount < 2) {
                const backoffTime = Math.pow(2, retryCount) * 1000;
                console.log(`Retrying in ${backoffTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                return createTask(currentTaskId, retryCount + 1);
            }
            
            throw error;
        }
    };

    return {
        isProcessing,
        executeTask,
        pauseAgentExecution,
        result,
        error
    };
};
