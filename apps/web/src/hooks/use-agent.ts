import { useCallback } from 'react';
import { useState } from 'react';
import { AgentState } from '@app-types/agent';
import { AgentData } from '@app-types/agent';
import { AgentResult } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';
import { useWorkflowStore } from '@stores/workflow';
import { updateState } from '@stores/workflow';
import { pauseAgentExecution as pauseAgentOp } from '@lib/agent-operations';
import { runAgentTaskLifecycle } from '@lib/agent-lifecycle';
import { AgentExecutionError } from '@lib/agent-lifecycle';

interface AgentHookResponse {
    isProcessing: boolean;
    executeTask: () => Promise<AgentResult | null>;
    pauseAgentExecution: () => Promise<boolean>;
    result: AgentResult | null;
    error: string | null;
    // Expose agentRuntime state if needed by consumer
    // agentRuntime: ReturnType<typeof useAgentStore['getState']>;
}

export const useAgent = (agentData: AgentData, onStatusChange?: (status: AgentState) => void): AgentHookResponse => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<AgentResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { getAgentState, updateAgentState, setAgentResult, setAgentData, getAgentData } = useAgentStore();
    const agentRuntime = getAgentState(agentData.id);

    const executeTask = useCallback(async (): Promise<AgentResult | null> => {
        if (!agentData.id) {
            const errorMsg = 'Cannot execute - agent ID not available';
            console.error(`[useAgent] ${errorMsg}`);
            setError(errorMsg);
            onStatusChange?.(AgentState.Error);
            return null;
        }

        // Prevent double execution if already processing
        if (isProcessing) {
            console.log('[useAgent] Already processing, skipping execution');
            return null;
        }

        let finalResult: AgentResult | null = null;
        let finalTaskId: string | undefined = undefined;

        try {
            setIsProcessing(true);
            setError(null);
            setResult(null);
            updateAgentState(agentData.id, { state: AgentState.Working });
            // Clear previous error message in AgentData
            const currentAgentData = getAgentData(agentData.id);
            if (currentAgentData && currentAgentData.errorMessage) {
                setAgentData(agentData.id, { ...currentAgentData, errorMessage: undefined });
            }
            onStatusChange?.(AgentState.Working);

            console.log(`[useAgent] Calling runAgentTaskLifecycle for agent ${agentData.id}`);

            // Determine task ID candidate (might be refined in lifecycle)
            finalTaskId = agentData.activeTaskId || agentData.nodeId || agentData.id;

            // Delegate the complex logic
            finalResult = await runAgentTaskLifecycle(
                agentData,
                agentData.previousAgentOutput
                // Can pass polling params here if needed: pollIntervalMs, maxPolls
            );

            console.log(`[useAgent] runAgentTaskLifecycle completed successfully for task associated with agent ${agentData.id}. Result:`, finalResult);

            // --- Success Handling ---
            setResult(finalResult);
            // Update store with final result and Completed state
            // Note: runAgentTaskLifecycle provides the definitive taskId it used/created
            // We might want to update the store with *that* task ID if different
            // from initial estimate, but currently lifecycle doesn't return it.
            // For now, assume the initial taskId was sufficient or updated internally.
            updateAgentState(agentData.id, { state: AgentState.Complete });
            setAgentResult(agentData.id, finalResult);
            onStatusChange?.(AgentState.Complete);

            return finalResult;

        } catch (error: any) {
            console.error(`[useAgent] Error during agent execution: ${error.message}`, error);
            const errorMsg = error instanceof AgentExecutionError ? error.message : 'An unexpected error occurred';
            setError(errorMsg);
            // Update AgentData with the error message
            const currentData = getAgentData(agentData.id);
            setAgentData(agentData.id, { ...(currentData || agentData), errorMessage: errorMsg });

            // Update runtime state to Error, without errorMessage field
            updateAgentState(agentData.id, {
                state: AgentState.Error,
                // activeTaskId: undefined // Keep task ID for potential retry/debug?
            });

            setIsProcessing(false);
            onStatusChange?.(AgentState.Error);
            return null;
        } finally {
            // Ensure isProcessing is always reset
            setIsProcessing(false);
            console.log(`[useAgent] executeTask finished for agent ${agentData.id}. Processing: ${isProcessing}`);
        }

    }, [agentData, isProcessing, getAgentState, updateAgentState, setAgentResult, setAgentData, getAgentData, onStatusChange]);

    const pauseAgentExecution = useCallback(async (): Promise<boolean> => {
        if (!agentData?.id) {
            console.warn("[useAgent] Cannot pause: Agent data or ID unavailable.");
            return false;
        }
        // Use activeTaskId from store state or fallback
        const currentRuntime = getAgentState(agentData.id);
        // Task ID determination should ideally match the logic in lifecycle start
        const taskId = currentRuntime?.activeTaskId || agentData.activeTaskId || agentData.nodeId || agentData.id;

        if (!taskId) {
            console.warn('[useAgent] Cannot pause agent: Task ID not available.');
            setError('Cannot pause: Task ID is missing.');
            return false;
        }

        console.log(`[useAgent] Requesting pause for task ${taskId}`);
        setError(null);

        try {
            // Call the standalone pause operation utility using the alias
            const success = await pauseAgentOp(taskId, agentData);
            if (success) {
                // Update state locally via store - pauseAgentOp handles the API call
                updateAgentState(agentData.id, { state: AgentState.Paused, activeTaskId: taskId });
                onStatusChange?.(AgentState.Paused);
                console.log(`[useAgent] Task ${taskId} paused successfully.`);
                return true;
            } else {
                // pauseAgentOp should ideally throw on failure, but handle boolean false too
                const pauseErrorMsg = `Failed to pause task ${taskId}.`;
                const currentData = getAgentData(agentData.id);
                setAgentData(agentData.id, { ...(currentData || agentData), errorMessage: pauseErrorMsg });
                setError(pauseErrorMsg);
                // Optionally update store state to Error?
                // updateAgentState(agentData.id, { state: AgentState.Error, errorMessage: pauseErrorMsg });
                // onStatusChange?.(AgentState.Error);
                return false;
            }
        } catch (error: any) {
            console.error(`[useAgent] Error pausing task ${taskId}:`, error);
            const pauseCatchErrorMsg = `Error pausing task: ${error.message}`;
            const currentData = getAgentData(agentData.id);
            setAgentData(agentData.id, { ...(currentData || agentData), errorMessage: pauseCatchErrorMsg });
            setError(pauseCatchErrorMsg);
            return false;
        }
        // Depend on agentData, store functions, and callbacks
    }, [agentData, getAgentState, updateAgentState, setAgentData, getAgentData, onStatusChange, setError]);

    return {
        isProcessing,
        executeTask,
        pauseAgentExecution,
        result,
        error
    };
};