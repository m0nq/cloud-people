import { useCallback } from 'react';
import { useState } from 'react';
import { Node } from '@xyflow/react';

import { AgentState } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';
import type { NodeData } from '@app-types/workflow';
import { NodeType } from '@app-types/workflow/node-types';
import { useWorkflowStore } from '@stores/workflow/store';

interface AgentHookResponse {
    isProcessing: boolean;
    executeAction: () => Promise<any>;
    result: string | null;
    error: string | null;
}

const isAgentNode = (node: Node): node is Node<NodeData> => {
    return node.type === NodeType.Agent;
};

export const useAgent = (agentId: string, onStatusChange?: (status: AgentState) => void): AgentHookResponse => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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

            // Check if this node has any outgoing connections (children)
            // If it does, we should keep the browser session open
            const workflowState = useWorkflowStore.getState();
            // Simplified approach: directly check if there are any edges where this node is the source
            const hasChildren = workflowState.edges.some(edge => edge.source === agentId);

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
                        // Include any additional agent configuration from data that might be relevant
                        speed: agentData?.speed,
                        memoryLimit: agentData?.memoryLimit,
                        models: agentData?.models,
                        tools: agentData?.tools
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
            }

            const initialResponseData = await response.json();
            
            if (initialResponseData.error) {
                throw new Error(initialResponseData.error);
            }
            
            // Set initial result
            setResult(initialResponseData.result || 'Task started...');
            
            // Get the task_id from the response
            const taskId = initialResponseData.task_id;
            
            // Poll for task completion
            let taskCompleted = initialResponseData.status === 'completed';
            let pollCount = 0;
            const maxPolls = 300; // Maximum number of polls (5 minutes at 1-second intervals)
            let consecutiveErrors = 0;
            const maxConsecutiveErrors = 5; // Maximum number of consecutive polling errors before giving up
            
            while (!taskCompleted && pollCount < maxPolls) {
                // Wait 1 second between polls
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                try {
                    // Check task status
                    const statusResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}`);
                    
                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json();
                        consecutiveErrors = 0; // Reset consecutive errors counter
                        
                        // Update result with latest information
                        if (statusData.result) {
                            setResult(statusData.result);
                        }
                        
                        // Check if task is completed or failed
                        if (statusData.status === 'completed' || statusData.status === 'failed' || statusData.status === 'needs_assistance') {
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
                                setResult(prev => 
                                    `${prev ? prev : 'Processing'} (${Math.round(statusData.progress * 100)}%)`
                                );
                            }
                        }
                    } else {
                        console.warn(`Failed to get status for task ${taskId}: ${statusResponse.status}`);
                        consecutiveErrors++;
                        
                        // If too many consecutive failures, break out of the loop
                        if (consecutiveErrors >= maxConsecutiveErrors) {
                            throw new Error(`Failed to get task status after ${maxConsecutiveErrors} consecutive attempts`);
                        }
                    }
                } catch (pollError) {
                    console.error(`Error polling task status:`, pollError);
                    consecutiveErrors++;
                    
                    // If too many consecutive failures, break out of the loop
                    if (consecutiveErrors >= maxConsecutiveErrors) {
                        throw new Error(`Error polling task status: ${pollError instanceof Error ? pollError.message : 'Unknown error'}`);
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
        } finally {
            // Always ensure we reset the processing state
            setIsProcessing(false);
        }
    }, [agentData, agentRuntime?.state, canExecute, isProcessing, onStatusChange, agentId]);

    return {
        isProcessing,
        executeAction,
        result,
        error
    };
};
