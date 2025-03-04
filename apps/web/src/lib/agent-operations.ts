import { AgentState } from '@app-types/agent';
import { AgentData } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';

/**
 * Interface for tracking the result of a pause operation
 */
export interface PauseResult {
    nodeId: string;
    agentId?: string;
    success: boolean;
    error: string | null;
}

/**
 * Centralized function to pause an agent's execution
 * This function contains the same logic as the useAgent hook's pauseExecution function
 * but can be called from anywhere, not just React components
 */
export const pauseAgentExecution = async (
    agentId: string,
    agentData: AgentData,
    onStatusChange?: (status: AgentState) => void
): Promise<boolean> => {
    try {
        // Use activeTaskId if available, otherwise use nodeId, then fall back to agent ID
        const taskId = agentData.activeTaskId || agentData.nodeId || agentId;
        
        console.log(`[DEBUG] Attempting to pause execution for agent ${agentId}`, {
            agentData,
            taskId,
            activeTaskId: agentData.activeTaskId,
            nodeId: agentData.nodeId
        });
        
        if (!taskId) {
            console.error('Cannot pause - no valid task ID available');
            return false;
        }

        const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
        console.log(`[DEBUG] Using browser-use endpoint: ${browserUseEndpoint}`);
        
        if (!browserUseEndpoint) {
            throw new Error('Browser use endpoint not configured');
        }

        // First check if the task exists and is in a valid state
        console.log(`[DEBUG] Checking if task ${taskId} exists at ${browserUseEndpoint}/execute/${taskId}`);
        
        try {
            // First, try to list all active tasks to see if our task is among them
            try {
                const listResponse = await fetch(`${browserUseEndpoint}/tasks`);
                if (listResponse.ok) {
                    const tasks = await listResponse.json();
                    console.log(`[DEBUG] Active tasks:`, tasks);
                    
                    // Check if our task is in the list
                    const ourTask = tasks.find((task: any) => task.task_id === taskId);
                    if (ourTask) {
                        console.log(`[DEBUG] Found our task in active tasks list:`, ourTask);
                    } else {
                        console.warn(`[DEBUG] Our task ${taskId} not found in active tasks list`);
                    }
                } else {
                    console.warn(`[DEBUG] Failed to list active tasks: ${listResponse.status}`);
                }
            } catch (listError) {
                console.warn(`[DEBUG] Error listing active tasks:`, listError);
            }
            
            const checkResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}`);
            
            console.log(`[DEBUG] Check response status: ${checkResponse.status}`);
            
            if (!checkResponse.ok) {
                if (checkResponse.status === 404) {
                    console.warn(`[DEBUG] Task ${taskId} not found (404). The task may have completed or been closed.`);
                    
                    // Update the agent state to Paused instead of Complete during a pause operation
                    // This ensures the workflow remains paused and doesn't progress to the next node
                    onStatusChange?.(AgentState.Paused);
                    
                    // Store pause metadata in the agent store
                    const { updateAgentState } = useAgentStore.getState();
                    updateAgentState(agentId, {
                        metadata: {
                            pausedAt: new Date().toISOString(),
                            pauseReason: 'Task not found during pause operation'
                        }
                    });
                    
                    // Since the task doesn't exist, we consider the pause "successful"
                    return true;
                } else {
                    console.error(`[DEBUG] Task not found or cannot be accessed: HTTP ${checkResponse.status}`);
                    throw new Error(`Task not found or cannot be accessed: HTTP ${checkResponse.status}`);
                }
            }
            
            const taskStatus = await checkResponse.json();
            console.log(`[DEBUG] Task status:`, taskStatus);
            
            if (taskStatus.status !== 'running') {
                console.log(`[DEBUG] Task ${taskId} is not in running state (current state: ${taskStatus.status}), marking as paused`);
                
                // Update the agent state to Paused instead of Complete during a pause operation
                onStatusChange?.(AgentState.Paused);
                
                // Store pause metadata in the agent store
                const { updateAgentState } = useAgentStore.getState();
                updateAgentState(agentId, {
                    metadata: {
                        pausedAt: new Date().toISOString(),
                        pauseReason: `Task was in ${taskStatus.status} state during pause operation`
                    }
                });
                
                return true;
            }

            console.log(`[DEBUG] Sending pause request to ${browserUseEndpoint}/execute/${taskId}/pause`);
            const response = await fetch(`${browserUseEndpoint}/execute/${taskId}/pause`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`[DEBUG] Pause response status: ${response.status}`);
            
            if (!response.ok) {
                // Try to parse the error response
                const errorText = await response.text();
                console.error(`[DEBUG] Error response text:`, errorText);
                
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    console.error(`[DEBUG] Failed to parse error response as JSON:`, e);
                }
                
                const errorMessage = errorData?.detail || `HTTP error! status: ${response.status}`;
                console.error(`[DEBUG] Error message:`, errorMessage);
                
                // Check for specific session lost error
                if (errorMessage.includes('session was lost') || errorMessage.includes('cannot be paused')) {
                    console.error(`[DEBUG] Browser session was lost for task ${taskId}`);
                    
                    // Update the agent state to Error with metadata
                    onStatusChange?.(AgentState.Error);
                    
                    // Store error metadata in the agent store
                    const { updateAgentState } = useAgentStore.getState();
                    
                    // Return false to indicate pause failed
                    return false;
                }
                
                throw new Error(errorMessage);
            }
            
            // Successfully paused
            const pauseData = await response.json();
            console.log(`[DEBUG] Pause successful:`, pauseData);
            
            // Update agent state to Paused
            onStatusChange?.(AgentState.Paused);
            
            return true;
        } catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                console.warn(`[DEBUG] Task ${taskId} not found (404) during pause operation. The task may have completed or been closed.`);
                
                // Update the agent state to Paused instead of Complete during a pause operation
                onStatusChange?.(AgentState.Paused);
                
                // Store pause metadata in the agent store
                const { updateAgentState } = useAgentStore.getState();
                updateAgentState(agentId, {
                    metadata: {
                        pausedAt: new Date().toISOString(),
                        pauseReason: 'Task not found during pause operation'
                    }
                });
                
                // Since the task doesn't exist, we consider the pause "successful"
                return true;
            }
            
            // Re-throw other errors
            throw error;
        }
    } catch (error) {
        console.error(`[DEBUG] Error pausing agent ${agentId}:`, error);
        
        // Update agent state to Paused instead of Error during a pause operation
        // This ensures the workflow remains paused and doesn't progress to the next node
        onStatusChange?.(AgentState.Paused);
        
        // Store error metadata in the agent store
        const { updateAgentState } = useAgentStore.getState();
        updateAgentState(agentId, {
            metadata: {
                pausedAt: new Date().toISOString(),
                pauseReason: `Error during pause operation: ${error instanceof Error ? error.message : String(error)}`,
                pauseError: error instanceof Error ? error.message : String(error)
            }
        });
        
        // Return true to indicate the pause was "successful" in the sense that the workflow is now paused
        return true;
    }
};

/**
 * Function to pause a specific agent node in a workflow
 * This is used by the workflow execution system to pause individual agent nodes
 */
export const pauseAgentNode = async (
    nodeId: string,
    agentId: string,
    onStatusChange?: (status: AgentState) => void
): Promise<PauseResult> => {
    console.log(`[DEBUG] Pausing agent node ${nodeId} with agent ID ${agentId}`);
    
    try {
        // Get agent data from the store
        const { getAgentData, getAgentState } = useAgentStore.getState();
        const agentData = getAgentData(agentId);
        
        if (!agentData) {
            console.error(`[DEBUG] Agent data not found for agent ID ${agentId}`);
            
            // Even if agent data is not found, we should still transition the node to Paused
            // to ensure the workflow remains paused
            onStatusChange?.(AgentState.Paused);
            
            return {
                nodeId,
                agentId,
                success: true, // Consider this "successful" in terms of pausing the workflow
                error: `Agent data not found for agent ID ${agentId}, but node transitioned to Paused state`
            };
        }
        
        console.log(`[DEBUG] Retrieved agent data for ${agentId}:`, agentData);
        console.log(`[DEBUG] Current agent state: ${getAgentState(agentId)?.state || 'unknown'}`);
        
        // Ensure the nodeId is set in the agent data
        const updatedAgentData = {
            ...agentData,
            nodeId: nodeId
        };
        
        // Pause the agent execution
        const success = await pauseAgentExecution(agentId, updatedAgentData, onStatusChange);
        
        if (success) {
            console.log(`[DEBUG] Successfully paused agent node ${nodeId}`);
            return {
                nodeId,
                agentId,
                success: true,
                error: null
            };
        } else {
            console.error(`[DEBUG] Failed to pause agent node ${nodeId}`);
            
            // Even if pauseAgentExecution returns false, we should still transition the node to Paused
            // to ensure the workflow remains paused
            onStatusChange?.(AgentState.Paused);
            
            return {
                nodeId,
                agentId,
                success: true, // Consider this "successful" in terms of pausing the workflow
                error: 'Failed to pause agent execution, but node transitioned to Paused state'
            };
        }
    } catch (error) {
        console.error(`[DEBUG] Error pausing agent node ${nodeId}:`, error);
        
        // Even if an error occurs, we should still transition the node to Paused
        // to ensure the workflow remains paused
        onStatusChange?.(AgentState.Paused);
        
        return {
            nodeId,
            agentId,
            success: true, // Consider this "successful" in terms of pausing the workflow
            error: `Error during pause operation, but node transitioned to Paused state: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}; 