import { ChangeEvent } from 'react';
import { useCallback } from 'react';
import { FormEvent } from 'react';
import { useState } from 'react';

import { useChat } from 'ai/react';

import { AgentStatus } from '@lib/definitions';
import { useAgentStore } from '@stores/agent-store';
import { useGraphStore } from '@stores/workflow-store';
import { NodeData } from '@lib/definitions';
import { Node } from '@xyflow/react';
import { Config } from '@config/constants';

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

// Handle browser navigation commands
const handleBrowserAction = async (action: { type: string; command: string; url?: string }) => {
    console.log('Handling browser action:', action);
    if (action.type !== 'browser') return;

    switch (action.command) {
        case 'navigate':
            if (action.url) {
                console.log('Opening URL in new tab:', action.url);
                // Open in a new tab to avoid disrupting the workflow
                window.open(action.url, '_blank', 'noopener,noreferrer');
            }
            break;
        // Add other browser commands here
        default:
            console.warn(`Unknown browser command: ${action.command}`);
    }
};

export const useAgent = (agentId: string, onStatusChange?: (status: AgentStatus) => void): AgentResponse => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { getAgentState } = useAgentStore();
    const { nodes } = useGraphStore();
    const agentState = getAgentState(agentId);

    const node = nodes.find(node => node.id === agentId);
    const agentNode = node && isAgentNode(node) ? node : undefined;
    const agentCapability = agentNode?.data.capability;

    // Only allow execution if agent is in Idle state
    const canExecute = agentState?.status === AgentStatus.Idle;

    const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
        api: '/api/agent',
        body: {
            agentId,
            action: agentCapability?.action || 'navigate_to_google',
            parameters: agentCapability?.parameters,
            // Include current state information
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
                    await handleBrowserAction(data.toolResponse.action);
                }
            } catch (err) {
                console.error('Error parsing response:', err);
            }
            
            setIsProcessing(true);
            onStatusChange?.(AgentStatus.Working);
        },
        onFinish: (message) => {
            console.log('Agent onFinish:', message, 'Current state:', agentState);
            setIsProcessing(false);
            onStatusChange?.(AgentStatus.Complete);
        },
        onError: (error) => {
            console.error('Agent onError:', error, 'Current state:', agentState);
            setIsProcessing(false);
            onStatusChange?.(AgentStatus.Error);
        }
    });

    const executeAction = useCallback(async () => {
        if (isProcessing) return;
        if (!canExecute) {
            console.warn(`Cannot execute action: agent must be in Idle state (current state: ${agentState?.status})`);
            return;
        }

        try {
            console.log('Starting agent action execution...');
            setIsProcessing(true);
            onStatusChange?.(AgentStatus.Activating);

            // Clear previous messages
            setMessages([]);

            // Start the action
            await handleSubmit(new Event('submit'));
        } catch (error) {
            console.error('Error executing agent action:', error);
            onStatusChange?.(AgentStatus.Error);
        }
    }, [handleSubmit, isProcessing, onStatusChange, setMessages, canExecute, agentState?.status]);

    return {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        setMessages,
        isLoading,
        isProcessing,
        executeAction
    };
};
