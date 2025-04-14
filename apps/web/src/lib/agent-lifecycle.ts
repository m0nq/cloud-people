import { AgentData } from '@app-types/agent';
import { AgentResult } from '@app-types/agent';
import { AgentState } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';
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

// Custom error class for assistance required
export class AgentAssistanceRequiredError extends AgentExecutionError {
    public assistanceMessage: string;
    constructor(message: string, assistanceMessage: string) {
        super(message);
        this.name = 'AgentAssistanceRequiredError';
        this.assistanceMessage = assistanceMessage;
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

// Utility function for sleep
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    previousAgentOutput?: Record<string, AgentResult | null>,
    pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
    maxPolls: number = DEFAULT_MAX_POLLS
): Promise<AgentResult> => {

    let taskId: string | null = agentData.activeTaskId || null;
    let taskStatus: TaskStatus | null = null;
    let taskNeedsPolling = false;
    let taskCreated = false;

    console.log(`[lifecycle] Starting lifecycle for agent ${agentData.id}. Initial activeTaskId: ${taskId}`);

    // 1. Check if we are resuming an existing task
    if (taskId) {
        try {
            console.log(`[lifecycle] Checking status for potentially existing task: ${taskId}`);
            taskStatus = await getTaskStatus(taskId);

            if (taskStatus) {
                console.log(`[lifecycle] Found existing task ${taskId} with status: ${taskStatus.status}`);
                if (taskStatus.status === 'running' || (taskStatus.status === 'paused' && agentData.isResuming)) {
                    console.log(`[lifecycle] Resuming polling for task ${taskId}.`);
                    taskNeedsPolling = true;
                } else if (taskStatus.status === 'completed' || taskStatus.status === 'failed') {
                    console.log(`[lifecycle] Existing task ${taskId} is already in terminal state (${taskStatus.status}). Will create a new one.`);
                    // Attempt cleanup, but don't worry if it fails
                    await closeSession(taskId).catch(err => console.warn(`[lifecycle] Non-critical error cleaning up terminal task ${taskId}:`, err));
                    taskId = null; // Force creation of a new task
                } else {
                    // Unexpected state, treat as needing a new task
                    console.warn(`[lifecycle] Existing task ${taskId} in unexpected state (${taskStatus.status}). Cleaning up and creating new.`);
                    await closeSession(taskId).catch(err => console.warn(`[lifecycle] Non-critical error cleaning up task ${taskId} in unexpected state:`, err));
                    taskId = null; // Force creation of a new task
                }
            } else {
                // Task ID existed in agentData, but 404 on status check - likely stale
                console.log(`[lifecycle] activeTaskId ${taskId} not found via getTaskStatus (404). Assuming stale, creating new task.`);
                taskId = null; // Force creation of a new task
            }
        } catch (error: any) {
            console.error(`[lifecycle] Error checking status for existing task ${taskId}:`, error);
            // If status check fails for existing ID, safer to try creating a new one
            // unless it was a specific AgentExecutionError we should bubble up.
            if (error instanceof AgentExecutionError) throw error;
            console.warn(`[lifecycle] Proceeding to create a new task due to error checking status for ${taskId}.`);
            taskId = null;
        }
    }

    // 2. Create a new task if necessary
    if (!taskNeedsPolling) {
        console.log('[lifecycle] Task does not exist or needs creation.');
        // Construct payload for task creation
        const providerType = getProviderTypeFromModel(agentData.model);
        const taskPayload: TaskRequest = {
            task: agentData.description,
            llm_provider: {
                type: providerType,
                model: agentData.model,
            },
            previous_agent_output: previousAgentOutput || undefined,
            // task_id: agentData.nodeId || agentData.id // DO NOT send nodeId as task_id on creation
        };

        try {
            console.log('[lifecycle] Creating new task with payload:', taskPayload);
            const creationResponse: TaskCreationResponse = await createTask(taskPayload);
            taskId = creationResponse.taskId;
            console.log(`[lifecycle] Task created successfully. New Task ID: ${taskId}`);
            taskNeedsPolling = true; // Now we need to poll this new task
            taskCreated = true;
            // IMPORTANT: The calling code (e.g., useAgent hook) is responsible for
            // updating the agent's activeTaskId in the store with this new taskId.

            // If we *just* created the task, wait a moment before the first poll
            if (taskCreated) {
                await sleep(2000); // Give backend more time (increased from 500ms)
            }

        } catch (error: any) {
            console.error(`[lifecycle] Error creating task:`, error);
            throw new AgentExecutionError(`Failed to create task: ${error.message}`);
        }
    }

    // Ensure we have a task ID before polling
    if (!taskId || !taskNeedsPolling) {
        console.error('[lifecycle] Logic error: No valid taskId obtained or polling not required. Cannot proceed.');
        throw new AgentExecutionError('Failed to obtain a valid task ID for polling.');
    }

    console.log(`[lifecycle] Task ID confirmed before polling loop: ${taskId}`);

    // 3. Poll for completion
    console.log(`[lifecycle] Starting polling for task ${taskId}...`);
    let pollCount = 0;
    while (pollCount < maxPolls) {
        let pollError: Error | null = null;
        taskStatus = null; // Reset status for this attempt
        try {
            console.log(`[lifecycle] >>> Polling attempt ${pollCount + 1} for taskId: ${taskId}`); // Log before call
            taskStatus = await getTaskStatus(taskId);
            console.log(`[lifecycle] <<< Poll attempt ${pollCount + 1} completed. Status object received:`, taskStatus); // Log after call

            if (!taskStatus) {
                // Task disappeared mid-polling? Treat as failure.
                console.error(`[lifecycle] Task ${taskId} disappeared during polling (getTaskStatus returned null/undefined, likely 404).`); // Updated log
                throw new AgentExecutionError(`Task ${taskId} not found during polling.`);
            }

            console.log(`[lifecycle] Poll ${pollCount + 1}: Task ${taskId} status: ${taskStatus.status}`);

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

            // --- Handle Assistance Required ---
            if (taskStatus.status === 'needs_assistance') {
                const assistanceMsg = taskStatus.assistance_message || 'Assistance required, but no message provided.';
                console.warn(`[lifecycle] Task ${taskId} requires assistance: ${assistanceMsg}`);

                // Update agent store
                const { updateAgentState, setAgentData } = useAgentStore.getState();
                updateAgentState(agentData.id, { state: AgentState.Assistance });

                // --- Fix: Get current data and merge before setting --- //
                const currentAgentData = useAgentStore.getState().getAgentData(agentData.id);
                const updatedAgentData: AgentData = {
                    ...(currentAgentData || agentData), // Use store data if available, else initial data
                    id: agentData.id, // Ensure ID is present
                    assistanceMessage: assistanceMsg
                };
                setAgentData(agentData.id, updatedAgentData); // Pass the full object
                // --- End Fix --- //

                // Throw specific error to signal assistance needed
                throw new AgentAssistanceRequiredError(
                    `Task ${taskId} requires assistance.`,
                    assistanceMsg
                );
            }
            // --- End Added Block ---

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
            pollError = error;
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
