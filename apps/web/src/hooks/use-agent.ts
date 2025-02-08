import { ChangeEvent } from 'react';
import { useCallback } from 'react';
import { FormEvent } from 'react';
import { useState } from 'react';

import { useChat } from 'ai/react';

import { AgentStatus } from '@lib/definitions';

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

export const useAgent = (agentId: string, onStatusChange?: (status: AgentStatus) => void): AgentResponse => {
    const [isProcessing, setIsProcessing] = useState(false);

    const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
        api: '/api/agent',
        body: {
            action: 'navigate_to_google'
        },
        onResponse: () => {
            setIsProcessing(true);
            onStatusChange?.(AgentStatus.Working);
        },
        onFinish: () => {
            setIsProcessing(false);
            onStatusChange?.(AgentStatus.Complete);
        },
        onError: () => {
            setIsProcessing(false);
            onStatusChange?.(AgentStatus.Error);
        }
    });

    const executeAction = useCallback(async () => {
        if (isProcessing) return;

        try {
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
    }, [handleSubmit, isProcessing, onStatusChange, setMessages]);

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
