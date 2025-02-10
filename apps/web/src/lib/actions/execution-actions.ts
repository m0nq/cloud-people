'use server';

import { authCheck } from '@lib/actions/authentication-actions';
import { type QueryConfig } from '@lib/definitions';
import { connectToDB } from '@lib/utils';

export type ExecutionHistoryEntry = {
    status: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
};

export type ExecutionRecord = {
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
};

export type ExecutionInput = {
    sessionId: string;
    agentId: string;
    input: Record<string, unknown>;
    status: string;
    metadata?: Record<string, unknown>;
    output?: Record<string, unknown>;
    errors?: Record<string, unknown>;
    metrics?: Record<string, unknown>;
};

export type ExecutionFilter = {
    sessionId?: string;
    agentId?: string;
};

export const createExecution = async (input: ExecutionInput): Promise<ExecutionRecord> => {
    await authCheck();

    if (!input.sessionId || !input.agentId) {
        throw new Error('Session ID and Agent ID are required to create an execution record');
    }

    const historyEntry: ExecutionHistoryEntry = {
        status: input.status,
        timestamp: new Date().toISOString(),
        metadata: input.metadata
    };

    const createExecutionMutation = `
        mutation CreateExecutionMutation($object: ExecutionsInsertInput!) {
            collection: insertIntoExecutionsCollection(objects: [$object]) {
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
            filter: {},
            data: JSON.stringify({
                object: {
                    session_id: input.sessionId,
                    agent_id: input.agentId,
                    input: input.input,
                    current_status: input.status,
                    history: [historyEntry],
                    metrics: input.metrics
                }
            })
        };

        const [execution] = await connectToDB(createExecutionMutation, queryConfig);

        if (!execution?.id) {
            throw new Error('No execution ID returned');
        }

        return {
            ...execution,
            input: JSON.parse(execution.input),
            output: execution.output ? JSON.parse(execution.output) : undefined,
            errors: execution.errors ? JSON.parse(execution.errors) : undefined,
            metrics: execution.metrics ? JSON.parse(execution.metrics) : undefined,
            history: JSON.parse(execution.history)
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
        status: input.status,
        timestamp: new Date().toISOString(),
        metadata: input.metadata
    };

    const updateExecutionMutation = `
        mutation UpdateExecutionMutation($filter: ExecutionsFilter!, $set: ExecutionsUpdateInput!) {
            collection: updateExecutionsCollection(
                set: $set,
                filter: $filter
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
            filter: {
                session_id: { eq: input.sessionId },
                agent_id: { eq: input.agentId }
            },
            data: JSON.stringify({
                set: {
                    current_status: input.status,
                    history: [...existingHistory, historyEntry],
                    output: input.output,
                    errors: input.errors,
                    metrics: input.metrics,
                    updated_at: new Date().toISOString()
                }
            })
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
        filter: queryFilter,
        data: null
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
