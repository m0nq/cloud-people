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

            console.log(' Executing agent action with endpoint:', browserUseEndpoint);

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

            const responseData = await response.json();

            if (responseData.error) {
                throw new Error(responseData.error);
            }

            setResult(responseData.result);

            // Update agent state based on metadata
            // Let the agent store handle the state transition, which will trigger workflow progression
            onStatusChange?.((responseData.metadata?.state as AgentState || AgentState.Complete));

            // If this was the last node in the workflow (no children) and we used a persistent session,
            // explicitly close the session to clean up resources
            if (!hasChildren && responseData.metadata?.persistent_session) {
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
            console.error(' Error executing action:', error);
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
