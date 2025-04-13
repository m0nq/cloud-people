import { AgentResult } from '@app-types/agent';

// Define TaskStatus locally
export type TaskStatus = {
    status: 'running' | 'paused' | 'completed' | 'failed';
    message?: string;
    result?: AgentResult; // Assuming result might be part of the status on completion
    error?: string; // Assuming error details might be part of the status on failure
};

// Define TaskCreationResponse locally
export type TaskCreationResponse = {
    taskId: string;
};

// Define TaskRequest locally based on usage in agent-lifecycle.ts
export type TaskRequest = {
    task: string;
    llm_provider: {
        type: string;
        model?: string;
    };
    previous_agent_output?: AgentResult;
    task_id?: string;
};

const BROWSER_SERVICE_ENDPOINT = process.env.NEXT_PUBLIC_BROWSER_USE_ENDPOINT || 'http://localhost:8000';

/**
 * Fetches the status of a specific agent task.
 * @param taskId The ID of the task.
 * @returns The task status object, or null if the task is not found (404).
 * @throws Error for non-404 fetch errors or unexpected status codes.
 */
export const getTaskStatus = async (taskId: string): Promise<TaskStatus | null> => {
    if (!BROWSER_SERVICE_ENDPOINT) {
        throw new Error('Browser service endpoint not configured');
    }
    if (!taskId) {
        throw new Error('Task ID is required to fetch status');
    }

    const url = `${BROWSER_SERVICE_ENDPOINT}/execute/${taskId}/status`;

    try {
        const response = await fetch(url);

        if (response.ok) {
            const data: TaskStatus = await response.json();
            return data;
        }

        if (response.status === 404) {
            console.log(`[agent-api] Task status for ${taskId} returned 404 (Not Found).`);
            return null; // Task doesn't exist or is no longer tracked
        }

        // Handle other non-OK statuses
        console.error(`[agent-api] Unexpected status ${response.status} fetching status for task ${taskId}.`);
        throw new Error(`Unexpected status ${response.status} fetching task status.`);

    } catch (error) {
        // Handle fetch errors (network issues, etc.)
        console.error(`[agent-api] Error fetching status for task ${taskId}:`, error);
        // Re-throw fetch errors, but avoid re-throwing the custom error above
        if (!(error instanceof Error && error.message.startsWith('Unexpected status'))) {
             throw new Error(`Network or fetch error fetching task status: ${error instanceof Error ? error.message : String(error)}`);
        }
        throw error; // Re-throw the original 'Unexpected status' error
    }
};

/**
 * Attempts to gracefully close a session associated with a task ID.
 * Logs errors but does not throw them, as cleanup failure is often non-critical.
 * @param taskId The ID of the task whose session should be closed.
 */
export const closeSession = async (taskId: string): Promise<void> => {
    if (!BROWSER_SERVICE_ENDPOINT) {
        console.error('[agent-api] Cannot close session: Browser service endpoint not configured');
        return;
    }
    if (!taskId) {
        console.error('[agent-api] Cannot close session: Task ID is required');
        return;
    }

    const url = `${BROWSER_SERVICE_ENDPOINT}/sessions/${taskId}/close`;
    console.log(`[agent-api] Attempting to close session for task ID: ${taskId}`);

    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ force: true })
        });
        // We don't strictly need to check the response status if we're just trying to clean up
        console.log(`[agent-api] Session close request sent for task ID ${taskId}.`);
    } catch (error) {
        console.error(`[agent-api] Error sending close session request for task ${taskId}:`, error);
        // Do not re-throw, allow main flow to continue
    }
};

/**
 * Creates a new agent task.
 * @param payload The task creation payload (locally defined TaskRequest type).
 * @returns The task creation response object (locally defined TaskCreationResponse type).
 * @throws Error for fetch errors or non-200 status codes.
 */
export const createTask = async (payload: TaskRequest): Promise<TaskCreationResponse> => {
    console.log('[agent-api] createTask called with payload:', payload);
    if (!BROWSER_SERVICE_ENDPOINT) {
        throw new Error('Browser service endpoint not configured');
    }
    if (!payload || !payload.task) {
        throw new Error('Task description is required to create a task');
    }

    const url = `${BROWSER_SERVICE_ENDPOINT}/execute`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const data: TaskCreationResponse = await response.json();
            if (!data || !data.taskId) {
                 console.error('[agent-api] Invalid response received from createTask:', data);
                 throw new Error('Invalid response received after creating task (missing taskId)');
            }
            console.log(`[agent-api] Task created successfully with ID: ${data.taskId}`);
            return data;
        }

        // Handle specific errors like 422 Unprocessable Entity
        if (response.status === 422) {
            const errorData = await response.json().catch(() => ({ detail: 'Unable to parse 422 error body' }));
            console.error(`[agent-api] createTask failed with 422:`, errorData);
            throw new Error(`Failed to create task (422 Unprocessable Entity): ${JSON.stringify(errorData.detail || errorData)}`);
        }

        // Handle other non-OK statuses
        const errorText = await response.text();
        console.error(`[agent-api] createTask failed with status ${response.status}: ${errorText}`);
        throw new Error(`Failed to create task (status ${response.status}): ${errorText}`);

    } catch (error) {
        // Handle fetch errors or errors thrown from response handling
        console.error('[agent-api] Error during createTask:', error);
        // Re-throw fetch errors, but avoid re-throwing the custom error above
        if (error instanceof Error && error.message.startsWith('Failed to create task')) {
            throw error; // Re-throw specific creation errors
        }
        throw new Error(`Network or fetch error creating task: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Fetches the final result of a completed agent task.
 * @param taskId The ID of the completed task.
 * @returns The final agent result.
 * @throws Error on failure or if the task is not complete.
 */
export const getTaskResult = async (taskId: string): Promise<AgentResult> => {
    // TODO: Implement GET to /execute/{taskId}/result (or adapt based on actual backend)
    // Based on analysis, result is likely returned with the final 'completed' status.
    // This function might not be needed if runAgentTaskLifecycle extracts it from the status poll.
    console.log('[agent-api] getTaskResult called for taskId:', taskId);
    throw new Error('getTaskResult not implemented (potentially unnecessary - check polling logic)');
};
