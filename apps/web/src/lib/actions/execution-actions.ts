'use server';

import { authCheck } from '@lib/actions/authentication-actions';
import { type QueryConfig } from '@lib/definitions';
import { connectToDB } from '@lib/utils';

export interface ExecutionHistoryEntry {
    status: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

export interface ExecutionRecord {
    id: string;
    agent_id: string;
    session_id: string;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    errors?: Record<string, unknown>;
    metrics?: Record<string, unknown>;
    current_status: string;
    history: ExecutionHistoryEntry[];
    created_at: string;
    updated_at: string;
}

export interface ExecutionInput {
    agentId: string;
    sessionId: string;
    input: Record<string, unknown>;
    current_status: string;
    history?: ExecutionHistoryEntry[];
    output?: { [key: string]: any } | null;
    errors?: { [key: string]: any } | null;
    metrics?: { [key: string]: any } | null;
}

export interface ExecutionFilter {
    sessionId?: string;
    agentId?: string;
}

export const createExecution = async (input: ExecutionInput): Promise<ExecutionRecord> => {
    await authCheck();

    if (!input.sessionId || !input.agentId) {
        throw new Error('Session ID and Agent ID are required to create an execution record');
    }

    const historyEntry: ExecutionHistoryEntry = {
        status: input.current_status,
        timestamp: new Date().toISOString(),
        metadata: undefined
    };

    const createExecutionMutation = `
        mutation CreateExecutionMutation(
            $session_id: UUID!,
            $agent_id: UUID!,
            $input: JSON!,
            $current_status: String!,
            $history: JSON!,
            $output: JSON,
            $errors: JSON,
            $metrics: JSON
        ) {
            collection: insertIntoExecutionsCollection(objects: [{
                session_id: $session_id,
                agent_id: $agent_id,
                input: $input,
                current_status: $current_status,
                history: $history,
                output: $output,
                errors: $errors,
                metrics: $metrics
            }]) {
                records {
                    id
                    agent_id
                    session_id
                    input
                    output
                    errors
                    metrics
                    current_status
                    history
                    created_at
                    updated_at
                }
            }
        }
    `;

    try {
        const queryConfig: QueryConfig = {
            data: {
                session_id: input.sessionId,
                agent_id: input.agentId,
                input: input.input,
                current_status: input.current_status,
                history: [historyEntry],
                ...(input.metrics && { metrics: input.metrics }),
                ...(input.output && { output: input.output }),
                ...(input.errors && { errors: input.errors })
            }
        };

        const [execution] = await connectToDB(createExecutionMutation, queryConfig);

        if (!execution?.id) {
            throw new Error('No execution ID returned');
        }

        return {
            ...execution,
            input: execution.input,
            output: execution.output,
            errors: execution.errors,
            metrics: execution.metrics,
            history: execution.history
        };
    } catch (error) {
        console.error('Failed to create execution record:', error);
        throw error;
    }
};

export const updateExecution = async (input: ExecutionInput): Promise<ExecutionRecord> => {
    await authCheck();

    if (!input.sessionId || !input.agentId) {
        throw new Error('Session ID and Agent ID are required to update an execution record');
    }

    const historyEntry: ExecutionHistoryEntry = {
        status: input.current_status,
        timestamp: new Date().toISOString(),
        metadata: undefined
    };

    const updateExecutionMutation = `
        mutation UpdateExecutionMutation(
            $session_id: UUID!,
            $agent_id: UUID!,
            $input: JSON!,
            $current_status: String!,
            $history: JSON!,
            $output: JSON,
            $errors: JSON,
            $metrics: JSON,
            $updated_at: Datetime!
        ) {
            collection: updateExecutionsCollection(
                filter: {
                    session_id: { eq: $session_id },
                    agent_id: { eq: $agent_id }
                },
                set: {
                    input: $input,
                    current_status: $current_status,
                    history: $history,
                    output: $output,
                    errors: $errors,
                    metrics: $metrics,
                    updated_at: $updated_at
                }
            ) {
                records {
                    id
                    agent_id
                    session_id
                    input
                    output
                    errors
                    metrics
                    current_status
                    history
                    created_at
                    updated_at
                }
            }
        }
    `;

    try {
        // First, get the current execution record to append to history
        const currentExecution = await fetchExecutions({ sessionId: input.sessionId, agentId: input.agentId });
        const existingHistory = currentExecution[0]?.history || [];

        const queryConfig: QueryConfig = {
            data: {
                session_id: input.sessionId,
                agent_id: input.agentId,
                input: input.input,
                current_status: input.current_status,
                history: [...existingHistory, historyEntry],
                ...(input.output && { output: input.output }),
                ...(input.errors && { errors: input.errors }),
                ...(input.metrics && { metrics: input.metrics }),
                updated_at: new Date().toISOString()
            }
        };

        const [execution] = await connectToDB(updateExecutionMutation, queryConfig);
        return {
            ...execution,
            input: JSON.parse(execution.input),
            output: execution.output ? JSON.parse(execution.output) : undefined,
            errors: execution.errors ? JSON.parse(execution.errors) : undefined,
            metrics: execution.metrics ? JSON.parse(execution.metrics) : undefined,
            history: JSON.parse(execution.history)
        };
    } catch (error) {
        console.error('Failed to update execution record:', error);
        throw error;
    }
};

export const fetchExecutions = async (filter: ExecutionFilter): Promise<ExecutionRecord[]> => {
    await authCheck();

    const fetchExecutionsQuery = `
        query ExecutionsQuery($filter: ExecutionsFilter) {
            collection: executionsCollection(
                filter: $filter,
                orderBy: { created_at: DESC }
            ) {
                records: edges {
                    node {
                        id
                        agent_id
                        session_id
                        input
                        output
                        errors
                        metrics
                        current_status
                        history
                        created_at
                        updated_at
                    }
                }
            }
        }
    `;

    const queryFilter: Record<string, { eq: string }> = {};
    if (filter.sessionId) {
        queryFilter.session_id = { eq: filter.sessionId };
    }
    if (filter.agentId) {
        queryFilter.agent_id = { eq: filter.agentId };
    }

    const queryConfig: QueryConfig = {
        data: {
            filter: queryFilter
        }
    };

    const executions = await connectToDB(fetchExecutionsQuery, queryConfig);
    return executions.map((execution: any) => ({
        ...execution.node,
        input: JSON.parse(execution.input),
        output: execution.output ? JSON.parse(execution.output) : undefined,
        errors: execution.errors ? JSON.parse(execution.errors) : undefined,
        metrics: execution.metrics ? JSON.parse(execution.metrics) : undefined,
        history: JSON.parse(execution.history)
    })) as ExecutionRecord[];
};

export const fetchLatestExecution = async (sessionId: string): Promise<ExecutionRecord | null> => {
    await authCheck();

    if (!sessionId) {
        throw new Error('Session ID is required to fetch latest execution');
    }

    const executions = await fetchExecutions({ sessionId });
    return executions[0] || null;
};
