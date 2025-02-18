import { useCallback } from 'react';
import { useState } from 'react';
import { Node } from '@xyflow/react';
import { AgentState } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';
import type { NodeData } from '@app-types/workflow';
import { useWorkflowStore } from '@stores/workflow';
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

    const { getAgent } = useAgentStore();
    const { nodes } = useWorkflowStore();
    const agent = getAgent(agentId);

    const node = nodes.find(node => node.id === agentId);
    const agentNode = node && isAgentNode(node) ? node : undefined;
    const agentCapability = agentNode?.data?.capabilities?.[0];

    const canExecute = !agent?.state || agent.state === AgentState.Working;

    const executeAction = useCallback(async () => {
        if (!canExecute) {
            console.log('Cannot execute - agent state:', agent?.state);
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

            // Prepare the task based on agent capabilities
            const task = agentCapability?.parameters?.url
                ? `Navigate to ${agentCapability.parameters.url} and analyze the page content`
                : agentCapability?.parameters?.task
                    ? agentCapability.parameters.task
                    : 'Navigate to google.com and analyze the page content';

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
    }, [agent?.state, canExecute, agentCapability, agentId, onStatusChange, isProcessing]);

    return {
        isProcessing,
        executeAction,
        result,
        error
    };
};
