import { useCallback } from 'react';
import { useState } from 'react';

import { AgentState } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';
import { useWorkflowStore } from '@stores/workflow/store';

interface AgentHookResponse {
    isProcessing: boolean;
    executeAction: () => Promise<any>;
    pauseExecution: () => Promise<boolean>;
    resumeExecution: () => Promise<boolean>;
    result: string | null;
    error: string | null;
}

export const useAgent = (agentId: string, onStatusChange?: (status: AgentState) => void): AgentHookResponse => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { getAgentState, getAgentData } = useAgentStore();
    const agentData = getAgentData(agentId);
    const agentRuntime = getAgentState(agentData?.id);

    const canExecute = !agentRuntime?.state || agentRuntime.state === AgentState.Working;

    const pauseExecution = useCallback(async (): Promise<boolean> => {
        if (!agentData?.id) {
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
    }, [agentData?.id, onStatusChange]);

    const resumeExecution = useCallback(async (): Promise<boolean> => {
        if (!agentData?.id) {
            console.error('Cannot resume - agent ID not available');
            return false;
        }

        try {
            const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
            const response = await fetch(`${browserUseEndpoint}/execute/${agentData.id}/resume`, {
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
            console.log(`Resumed execution for agent ${agentData.id}:`, responseData);

            // Update the agent state to Working
            onStatusChange?.(AgentState.Working);

            // Clear pause metadata in the agent store
            const { updateAgentState } = useAgentStore.getState();
            updateAgentState(agentData.id, {
                metadata: {
                    resumedAt: new Date().toISOString()
                }
            });

            // Update the result with resume information
            setResult(prev => `${prev ? prev : ''}\n\nResumed: ${responseData.message || 'Execution resumed by user'}`);

            return true;
        } catch (error) {
            console.error('Error resuming execution:', error);
            setError(error instanceof Error ? error.message : 'Failed to resume execution');
            return false;
        }
    }, [agentData?.id, onStatusChange]);

    const executeAction = useCallback(async () => {
        if (!canExecute) {
            console.log('Cannot execute - agentRuntime state:', agentRuntime?.state);
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

            console.log('Executing agent action with endpoint:', browserUseEndpoint);

            // Check if this node has any outgoing connections (children)
            // If it does, we should keep the browser session open
            const workflowState = useWorkflowStore.getState();
            // Simplified approach: directly check if there are any edges where this node is the source
            const hasChildren = workflowState.edges.some(edge => edge.source === agentId);

            // First, try to create the task
            const response = await fetch(`${browserUseEndpoint}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    task: agentData?.description || 'Navigate to google and perform research on OpenAI 03 vs Anthropic 3.7 for use with the Windsurf IDE',
                    task_id: agentData?.id, // Use the agent ID as the session ID for persistence
                    persistent_session: hasChildren, // Keep session open if this node has children
                    options: {
                        agentId: agentData?.id,
                        speed: agentData?.speed,
                        memoryLimit: agentData?.memoryLimit,
                        model: agentData?.model,
                        tools: agentData?.tools
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => null);
                console.error('Failed to create task:', response.status, errorText);
                throw new Error(`Failed to create task: ${response.status} ${errorText || 'Unknown error'}`);
            }

            let initialResponseData;
            try {
                initialResponseData = await response.json();
            } catch (e) {
                console.error('Failed to parse initial response:', e);
                throw new Error('Failed to parse task creation response');
            }

            if (initialResponseData.error) {
                throw new Error(initialResponseData.error);
            }

            // Set initial result
            setResult(initialResponseData.result || 'Task started...');

            // Get the task_id from the response
            const taskId = initialResponseData.task_id;
            if (!taskId) {
                throw new Error('No task ID returned from task creation');
            }

            console.log('Task created successfully:', { taskId, initialStatus: initialResponseData.status });

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

                            // If task needs assistance, transition to assistance state
                            if (statusData.status === 'needs_assistance') {
                                console.log(`Task ${taskId} needs assistance: ${statusData.assistance_message}`);
                                setResult(prev => `${prev ? prev : ''}\n\nNeeds assistance: ${statusData.assistance_message}`);
                                onStatusChange?.(AgentState.Assistance);
                                return statusData.assistance_message || 'Having some trouble. Little help?';
                            }

                            // Update final result
                            if (statusData.result) {
                                setResult(statusData.result);
                            }

                            // Update agent state based on metadata
                            onStatusChange?.((statusData.metadata?.state as AgentState || AgentState.Complete));
                        } else {
                            // Task is still running, update progress if available
                            console.log(`Task ${taskId} status: ${statusData.status}, progress: ${statusData.progress}`);

                            // Optionally update UI with progress information
                            if (statusData.progress) {
                                setResult(prev => `${prev ? prev : 'Processing'} (${Math.round(statusData.progress * 100)}%)`);
                            }
                        }
                    } else {
                        const errorText = await statusResponse.text().catch(() => 'Failed to get error details');
                        console.warn(`Failed to get status for task ${taskId}: ${statusResponse.status}`, errorText);
                        consecutiveErrors++;
                        lastError = `HTTP ${statusResponse.status}: ${errorText}`;

                        // If too many consecutive failures, break out of the loop
                        if (consecutiveErrors >= maxConsecutiveErrors) {
                            throw new Error(`Failed to get task status after ${maxConsecutiveErrors} consecutive attempts. Last error: ${lastError}`);
                        }
                    }
                } catch (pollError) {
                    console.error(`Error polling task status:`, pollError);
                    consecutiveErrors++;
                    lastError = pollError instanceof Error ? pollError.message : 'Unknown error';

                    // If too many consecutive failures, break out of the loop
                    if (consecutiveErrors >= maxConsecutiveErrors) {
                        throw new Error(`Failed to get task status after ${maxConsecutiveErrors} consecutive attempts. Last error: ${lastError}`);
                    }
                }

                pollCount++;
            }

            // If we reached max polls without completion, consider it a timeout
            if (!taskCompleted) {
                const timeoutError = new Error(`Task ${taskId} did not complete within the expected time`);
                console.error(timeoutError);
                // Explicitly set the agent state to Error
                onStatusChange?.(AgentState.Error);
                throw timeoutError;
            }

            // Cleanup for successful completion
            // If this was the last node in the workflow (no children) and we used a persistent session,
            // explicitly close the session to clean up resources
            if (!hasChildren && initialResponseData.metadata?.persistent_session) {
                try {
                    await fetch(`${browserUseEndpoint}/sessions/${agentData?.id}/close`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log(`Closed browser session for agent ${agentData?.id}`);
                } catch (closeError) {
                    console.error('Error closing browser session:', closeError);
                    // Don't throw here, as the main task was successful
                }
            }

            return result || 'Task completed successfully';

        } catch (error) {
            console.error('Error executing action:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');

            // Let the agent store handle the error state transition
            onStatusChange?.(AgentState.Error);

            // If there was an error, try to close the session to clean up resources
            try {
                const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
                await fetch(`${browserUseEndpoint}/sessions/${agentData?.id}/close`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        force: true
                    })
                });
                console.log(`Closed browser session for agent ${agentData?.id} after error`);
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
        resumeExecution,
        result,
        error
    };
};
