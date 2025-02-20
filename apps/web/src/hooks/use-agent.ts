import { useCallback } from 'react';
import { useState } from 'react';
import { Node } from '@xyflow/react';
import { AgentState } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';
import type { NodeData } from '@app-types/workflow';
import { NodeType } from '@app-types/workflow/node-types';

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
    const agentRuntime = getAgentState(agentId);

    const agentNode = getAgentData(agentId);

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

            // Prepare the task based on agentRuntime capabilities
            const task = `Navigate to google.com and perform a web page audit`;

            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: {
                        id: agentId,
                        content: task,
                        role: 'user'
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Response ->', response);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            console.log('Data ->', data);

            setResult(data.result);
            onStatusChange?.(AgentState.Complete);
        } catch (error) {
            console.error('❌ Error executing action:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
            onStatusChange?.(AgentState.Error);
        } finally {
            setIsProcessing(false);
        }
    }, [agentId, agentRuntime?.state, canExecute, isProcessing, onStatusChange]);

    return {
        isProcessing,
        executeAction,
        result,
        error
    };
};
