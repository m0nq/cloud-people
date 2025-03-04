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
                    
                    // Update the agent state to reflect that it's no longer running
                    onStatusChange?.(AgentState.Complete);
                    
                    // Since the task doesn't exist, we consider the pause "successful" in the sense
                    // that the agent is no longer running
                    return true;
                } else {
                    console.error(`[DEBUG] Task not found or cannot be accessed: HTTP ${checkResponse.status}`);
                    throw new Error(`Task not found or cannot be accessed: HTTP ${checkResponse.status}`);
                }
            }
            
            const taskStatus = await checkResponse.json();
            console.log(`[DEBUG] Task status:`, taskStatus);
            
            if (taskStatus.status !== 'running') {
                console.log(`[DEBUG] Task ${taskId} is not in running state (current state: ${taskStatus.status}), marking as complete`);
                onStatusChange?.(AgentState.Complete);
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
                
                // Update the agent state to reflect that it's no longer running
                onStatusChange?.(AgentState.Complete);
                
                // Since the task doesn't exist, we consider the pause "successful" in the sense
                // that the agent is no longer running
                return true;
            }
            
            // Re-throw other errors
            throw error;
        }
    } catch (error) {
        console.error(`[DEBUG] Error pausing agent ${agentId}:`, error);
        
        // Update agent state to Error
        onStatusChange?.(AgentState.Error);
        
        return false;
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
        const { getAgentData } = useAgentStore.getState();
        const agentData = getAgentData(agentId);
        
        if (!agentData) {
            console.error(`[DEBUG] Agent data not found for agent ID ${agentId}`);
            return {
                nodeId,
                agentId,
                success: false,
                error: `Agent data not found for agent ID ${agentId}`
            };
        }
        
        console.log(`[DEBUG] Retrieved agent data for ${agentId}:`, agentData);
        
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
            return {
                nodeId,
                agentId,
                success: false,
                error: 'Failed to pause agent execution'
            };
        }
    } catch (error) {
        console.error(`[DEBUG] Error pausing agent node ${nodeId}:`, error);
        return {
            nodeId,
            agentId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}; 