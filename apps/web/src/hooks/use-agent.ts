import { ChangeEvent } from 'react';
import { useCallback } from 'react';
import { FormEvent } from 'react';
import { useState } from 'react';
import { Node } from '@xyflow/react';
import { useChat } from 'ai/react';

import { AgentStatus } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';
import type { NodeData } from '@app-types/workflow';
import { useWorkflowStore } from '@stores/workflow';
import { Config } from '@config/constants';
import { navigateToUrl } from '@lib/agents/browser/navigation';

const { WorkflowNode } = Config;

interface AgentResponse {
    messages: any[];
    input: string;
    handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
    setMessages: (messages: any[]) => void;
    isLoading: boolean;
    isProcessing: boolean;
    executeAction: () => void;
}

const isAgentNode = (node: Node): node is Node<NodeData> => {
    return node.type === WorkflowNode.AgentNode;
};

export const useAgent = (agentId: string, onStatusChange?: (status: AgentStatus) => void): AgentResponse => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { getAgentState, updateAgent } = useAgentStore();
    const { nodes } = useWorkflowStore();
    const agentState = getAgentState(agentId);

    const node = nodes.find(node => node.id === agentId);
    const agentNode = node && isAgentNode(node) ? node : undefined;
    const agentCapability = agentNode?.data?.capabilities?.[0];

    // Only allow execution if agent is in Idle state
    const canExecute = agentState?.status === AgentStatus.Idle;

    const handleProgress = useCallback((progress: number) => {
        updateAgent(agentId, {
            progress,
            status: progress === 100 ? AgentStatus.Complete : AgentStatus.Working
        });
    }, [agentId, updateAgent]);

    // Handle browser navigation commands
    const handleBrowserAction = useCallback(async (
        action: { type: string; command: string; url?: string },
        onProgress?: (progress: number) => void
    ) => {
        console.log('Handling browser action:', action);
        if (action.type !== 'browser') return;

        try {
            switch (action.command) {
                case 'navigate':
                    if (action.url) {
                        console.log('Navigating to URL:', action.url);
                        await navigateToUrl(action.url, onProgress);
                    }
                    break;
                default:
                    console.warn(`Unknown browser command: ${action.command}`);
            }
        } catch (error) {
            console.error('Browser action error:', error);
            updateAgent(agentId, {
                status: AgentStatus.Error,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }, [agentId, updateAgent]);

    const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
        api: '/api/agent',
        body: {
            agentId,
            action: agentCapability?.action || 'navigate_to_google',
            parameters: agentCapability?.parameters,
            currentProgress: agentState?.progress,
            assistanceMessage: agentState?.assistanceMessage,
            error: agentState?.error
        },
        onResponse: async (response) => {
            console.log('Agent onResponse:', response, 'Current state:', agentState);

            try {
                const data = await response.json();
                console.log('Agent response data:', data);

                // Handle tool response if present
                if (data.toolResponse?.action) {
                    console.log('Found tool response with action:', data.toolResponse.action);
                    setIsProcessing(true);
                    onStatusChange?.(AgentStatus.Working);
                    await handleBrowserAction(data.toolResponse.action, handleProgress);
                }
            } catch (err) {
                console.error('Error parsing response:', err);
                updateAgent(agentId, {
                    status: AgentStatus.Error,
                    error: err instanceof Error ? err.message : 'Unknown error'
                });
            }
        },
        onFinish: (message) => {
            console.log('Agent onFinish:', message, 'Current state:', agentState);
            setIsProcessing(false);
            if (agentState?.status !== AgentStatus.Error) {
                onStatusChange?.(AgentStatus.Complete);
            }
        },
        onError: (error) => {
            console.error('Agent onError:', error, 'Current state:', agentState);
            setIsProcessing(false);
            updateAgent(agentId, {
                status: AgentStatus.Error,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            onStatusChange?.(AgentStatus.Error);
        }
    });

    return {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        setMessages,
        isLoading,
        isProcessing,
        executeAction: () => handleSubmit(new Event('submit') as any)
    };
};
