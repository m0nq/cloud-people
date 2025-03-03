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
        
        if (!taskId) {
            console.error('Cannot pause - no valid task ID available');
            return false;
        }

        const browserUseEndpoint = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';
        if (!browserUseEndpoint) {
            throw new Error('Browser use endpoint not configured');
        }

        // First check if the task exists and is in a valid state
        const checkResponse = await fetch(`${browserUseEndpoint}/execute/${taskId}`);
        
        if (!checkResponse.ok) {
            throw new Error(`Task not found or cannot be accessed: HTTP ${checkResponse.status}`);
        }
        
        const taskStatus = await checkResponse.json();
        
        if (taskStatus.status !== 'running') {
            console.log(`Task ${taskId} is not in running state (current state: ${taskStatus.status}), cannot pause`);
            return false;
        }

        const response = await fetch(`${browserUseEndpoint}/execute/${taskId}/pause`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // Try to parse the error response
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.detail || `HTTP error! status: ${response.status}`;
            
            // Check for specific session lost error
            if (errorMessage.includes('session was lost') || errorMessage.includes('cannot be paused')) {
                console.error(`Browser session was lost for task ${taskId}`);
                
                // Update the agent state to Error with metadata
                onStatusChange?.(AgentState.Error);
                
                // Store error metadata in the agent store
                const { updateAgentState } = useAgentStore.getState();
                updateAgentState(agentId, {
                    metadata: {
                        errorAt: new Date().toISOString(),
                        errorMessage: 'Browser session was lost and cannot be paused. The task may need to be restarted.'
                    }
                });
                
                return false;
            }
            
            throw new Error(errorMessage);
        }

        const responseData = await response.json();
        console.log(`Paused execution for agent ${taskId}:`, responseData);

        // Update the agent state to Paused with metadata
        onStatusChange?.(AgentState.Paused);

        // Store pause metadata in the agent store
        const { updateAgentState, setAgentData } = useAgentStore.getState();
        updateAgentState(agentId, {
            metadata: {
                pausedAt: new Date().toISOString(),
                pauseReason: responseData.message || 'Execution paused by user',
                pauseScreenshot: responseData.metadata?.screenshot
            }
        });
        
        // Store the taskId used for pausing to ensure consistency
        setAgentData(agentId, {
            ...agentData,
            activeTaskId: taskId
        });

        return true;
    } catch (error) {
        console.error('Error pausing execution:', error);
        return false;
    }
};

/**
 * Pause a single agent node and return a PauseResult
 * This function handles all the error handling and logging for pausing a single agent
 */
export const pauseAgentNode = async (
    nodeId: string,
    agentId: string | undefined,
    onStatusChange?: (status: AgentState) => void
): Promise<PauseResult> => {
    // If no agent ID, return failure result
    if (!agentId) {
        console.warn(`Node ${nodeId} has no agent ID, skipping pause`);
        return {
            nodeId,
            success: false,
            error: 'No agent ID found'
        };
    }

    try {
        // Get the agent data from the store
        const agentStore = useAgentStore.getState();
        const agentData = agentStore.getAgentData(agentId);

        // Debug logging for agent data
        console.log(`Agent data for ${agentId}:`, {
            nodeId,
            activeTaskId: agentData?.activeTaskId
        });

        // Call the centralized pause function
        const pauseResult = await pauseAgentExecution(agentId, agentData, onStatusChange);

        const result = {
            nodeId,
            agentId,
            success: pauseResult,
            error: pauseResult ? null : 'Failed to pause execution'
        };

        console.log(`Pause result for agent ${agentId} (node ${nodeId}): ${pauseResult ? 'Success' : 'Failed'}`);
        
        return result;
    } catch (error) {
        console.error(`Error pausing agent execution for node ${nodeId}:`, error);
        return {
            nodeId,
            agentId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}; 