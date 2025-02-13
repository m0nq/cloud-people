import { ChangeEvent } from 'react';
import { useCallback } from 'react';
import { FormEvent } from 'react';
import { useState } from 'react';
import { Node } from '@xyflow/react';
import { useChat } from 'ai/react';
import { nanoid } from 'nanoid';

import { AgentStatus } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';
import type { NodeData } from '@app-types/workflow';
import { useWorkflowStore } from '@stores/workflow';
import { NodeType } from '@app-types/workflow/node-types';

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
    return node.type === NodeType.Agent;
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

    const handleProgress = useCallback(
        (progress: number) => {
            updateAgent(agentId, {
                progress,
                status: progress === 100 ? AgentStatus.Complete : AgentStatus.Working
            });
        },
        [agentId, updateAgent]
    );

    console.log('Before useChat ->');
    const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
        api: '/api/agent',
        initialMessages: [
            {
                id: nanoid(),
                role: 'user',
                content: agentCapability?.parameters?.url
                    ? `Navigate to ${agentCapability.parameters.url}`
                    : 'Navigate to Google'
            }
        ],
        body: {
            agentId,
            action: agentCapability?.action || 'navigate_to_google',
            parameters: agentCapability?.parameters,
            currentProgress: agentState?.progress,
            assistanceMessage: agentState?.assistanceMessage,
            error: agentState?.error
        },
        async onToolCall({ toolCall }) {
            console.log('Tool call received:', toolCall);
            setIsProcessing(true);
            onStatusChange?.(AgentStatus.Working);

            console.log('Tool call received:', toolCall);
            try {
                if (toolCall.toolName === 'navigateToUrl') {
                    // Client-side navigation in a new tab
                    // const { url } = toolCall.args;
                    console.log('toolCall.args ->', toolCall.args);
                    // window.open(url, '_blank');
                    handleProgress(50);
                    return { success: true };
                }
            } catch (error) {
                console.error('Tool execution error:', error);
                updateAgent(agentId, {
                    status: AgentStatus.Error,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                throw error;
            }
        },
        onResponse: async response => {
            console.log('Agent onResponse:', response);
        },
        onFinish: message => {
            console.log('Agent onFinish:', message, 'Current state:', agentState);
            setIsProcessing(false);
            if (agentState?.status !== AgentStatus.Error) {
                onStatusChange?.(AgentStatus.Complete);
            }
        },
        onError: error => {
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
