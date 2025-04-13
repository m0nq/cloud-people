import { AgentData } from '@app-types/agent';
import { AgentResult } from '@app-types/agent';
import { createTask } from './agent-api';
import { getTaskStatus } from './agent-api';
import { closeSession } from './agent-api';
import { TaskStatus } from './agent-api'; // Added back
import { TaskCreationResponse } from './agent-api'; // Added back
import { TaskRequest } from './agent-api'; // Import locally defined type

// Default polling parameters (can be adjusted)
const DEFAULT_POLL_INTERVAL_MS = 1500; // Increased from 1s to 1.5s
const DEFAULT_MAX_POLLS = 100; // ~2.5 minutes total polling time

// Custom error class for lifecycle failures
export class AgentExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AgentExecutionError';
    }
}

// Helper function (consider moving to a shared util)
const getProviderTypeFromModel = (modelName: string | undefined): string => {
    if (!modelName) return 'gemini';
    const lowerModelName = modelName.toLowerCase();
    if (lowerModelName.includes('gpt')) return 'openai';
    if (lowerModelName.includes('claude')) return 'anthropic';
    if (lowerModelName.includes('gemini')) return 'gemini';
    console.warn(`Could not determine LLM provider type for model: ${modelName}. Defaulting to gemini.`);
    return 'gemini';
};

/**
 * Orchestrates the execution lifecycle of an agent task:
 * - Checks existing task status.
 * - Cleans up old tasks if necessary.
 * - Creates a new task if needed.
 * - Polls for task completion or failure.
 * - Returns the final result or throws an AgentExecutionError.
 *
 * @param agentData The configuration and data for the agent.
 * @param previousAgentOutput Optional output from a previous agent in the workflow.
 * @param pollIntervalMs Interval for polling task status.
 * @param maxPolls Maximum number of polling attempts.
 * @returns The final AgentResult upon successful completion.
 * @throws {AgentExecutionError} If the task fails, times out, or encounters an unrecoverable error.
 */
export const runAgentTaskLifecycle = async (
    agentData: AgentData,
    previousAgentOutput?: AgentResult,
    pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
    maxPolls: number = DEFAULT_MAX_POLLS
): Promise<AgentResult> => {

    let taskId = agentData.activeTaskId || agentData.nodeId || agentData.id;
    console.log(`[lifecycle] Starting lifecycle for agent ${agentData.id}. Initial Task ID candidate: ${taskId}`);

    if (!taskId) {
        throw new AgentExecutionError('Task ID not available - cannot run agent lifecycle.');
    }

    let taskStatus: TaskStatus | null = null;
    let needsCreation = true;

    // 1. Check initial status and cleanup if necessary
    try {
        taskStatus = await getTaskStatus(taskId);

        if (taskStatus) {
            console.log(`[lifecycle] Found existing task ${taskId} with status: ${taskStatus.status}`);
            if (taskStatus.status === 'completed' || taskStatus.status === 'failed') {
                console.log(`[lifecycle] Existing task ${taskId} is in terminal state (${taskStatus.status}). Cleaning up.`);
                await closeSession(taskId); // Attempt cleanup, ignore errors
            } else if (taskStatus.status === 'paused' && agentData.isResuming) {
                console.log(`[lifecycle] Resuming paused task ${taskId}.`);
                needsCreation = false; // Resume existing task
            } else if (taskStatus.status === 'running') {
                // This might happen if the UI refreshed mid-execution.
                // Treat it like resuming for polling purposes.
                console.warn(`[lifecycle] Found task ${taskId} already running. Attempting to poll status.`);
                needsCreation = false;
            } else {
                 // Unexpected state (e.g., maybe 'pending'?), clean up and create new.
                 console.warn(`[lifecycle] Existing task ${taskId} in unexpected state (${taskStatus.status}). Cleaning up.`);
                 await closeSession(taskId);
            }
        } else {
             console.log(`[lifecycle] No existing task found for ID ${taskId} (404). Proceeding to create.`);
        }
    } catch (error: any) {
        // Errors from getTaskStatus (non-404)
        console.error(`[lifecycle] Error checking initial status for task ${taskId}:`, error);
        throw new AgentExecutionError(`Failed during initial task status check: ${error.message}`);
    }

    // 2. Create task if needed
    if (needsCreation) {
        console.log(`[lifecycle] Creating new task for agent ${agentData.id}.`);
        const llmProvider = {
            type: getProviderTypeFromModel(agentData.model),
            model: agentData.model,
        };
        const payload: TaskRequest = {
            task: agentData.description,
            llm_provider: llmProvider,
            previous_agent_output: previousAgentOutput ?? agentData.previousAgentOutput ?? undefined, // Use passed-in first, then agentData
            task_id: taskId, // Provide the intended Task ID
            // Add other relevant fields from agentData if needed by backend
            // e.g., operation_timeout: agentData.operationTimeout
        };

        try {
            const creationResponse = await createTask(payload);
            // Backend might assign a new ID, even if we suggested one. Use the returned ID.
            taskId = creationResponse.taskId;
             console.log(`[lifecycle] Task created successfully. New Task ID: ${taskId}`);
             // Update agentData's activeTaskId? This logic belongs in the hook/store later.
        } catch (error: any) {
             console.error(`[lifecycle] Error creating task:`, error);
             throw new AgentExecutionError(`Failed to create task: ${error.message}`);
        }
    }

    // 3. Poll for completion
    console.log(`[lifecycle] Starting polling for task ${taskId}...`);
    let pollCount = 0;
    while (pollCount < maxPolls) {
        try {
            taskStatus = await getTaskStatus(taskId);

            if (!taskStatus) {
                // Task disappeared mid-polling? Treat as failure.
                 console.error(`[lifecycle] Task ${taskId} disappeared during polling (status 404).`);
                 throw new AgentExecutionError(`Task ${taskId} disappeared unexpectedly during execution.`);
            }

            console.log(`[lifecycle] Poll ${pollCount + 1}/${maxPolls}: Task ${taskId} status: ${taskStatus.status}`);

            if (taskStatus.status === 'completed') {
                console.log(`[lifecycle] Task ${taskId} completed successfully.`);
                // --- Result Extraction ---
                // Assuming the result is included in the final status response
                // If not, we'd need a separate getTaskResult(taskId) call here.
                 if (!taskStatus.result) {
                     console.warn(`[lifecycle] Task ${taskId} completed but no result found in status. Attempting fallback fetch (if implemented).`);
                     // Potentially call getTaskResult(taskId) here if it's needed
                     throw new AgentExecutionError(`Task ${taskId} completed but result was missing.`);
                 }
                 // TODO: Validate taskStatus.result against AgentResult schema if needed
                return taskStatus.result as AgentResult; // Cast needed if type isn't precise
            }

            if (taskStatus.status === 'failed') {
                const errorMsg = taskStatus.error || taskStatus.message || 'Task failed with unknown error';
                console.error(`[lifecycle] Task ${taskId} failed: ${errorMsg}`);
                throw new AgentExecutionError(errorMsg);
            }

            // If running or paused (and we're still polling), wait and continue
            if (taskStatus.status === 'running' || taskStatus.status === 'paused') {
                await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
                pollCount++;
            } else {
                // Should not happen if states are handled above, but safety check.
                console.error(`[lifecycle] Task ${taskId} in unexpected state during polling: ${taskStatus.status}`);
                throw new AgentExecutionError(`Task ${taskId} entered unexpected state: ${taskStatus.status}`);
            }

        } catch (error: any) {
             // Handle errors from getTaskStatus or errors thrown within the loop
             if (error instanceof AgentExecutionError) {
                 throw error; // Re-throw specific lifecycle errors
             }
             console.error(`[lifecycle] Error during polling for task ${taskId}:`, error);
             // Throw generic error for polling issues (e.g., network errors during poll)
             throw new AgentExecutionError(`Polling failed for task ${taskId}: ${error.message}`);
        }
    }

    // 4. Handle Timeout
    console.error(`[lifecycle] Task ${taskId} timed out after ${maxPolls} polls.`);
    // Attempt cleanup even on timeout
    await closeSession(taskId);
    throw new AgentExecutionError(`Task ${taskId} did not complete within the time limit.`);
};
