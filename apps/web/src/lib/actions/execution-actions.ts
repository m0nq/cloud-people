'use server';

import { authCheck } from '@lib/actions/authentication-actions';
import type { QueryConfig } from '@app-types/api';
import { connectToDB } from '@lib/utils';

export interface ExecutionHistoryEntry {
    status: string;
    timestamp: string;
    metadata?: { [key: string]: any };
    input: { [key: string]: any } | null;
    output: { [key: string]: any } | null;
    errors: { [key: string]: any } | null;
}

export interface ExecutionRecord {
    id: string;
    agent_id: string;
    session_id: string;
    input: { [key: string]: any } | null;
    output: { [key: string]: any } | null;
    errors: { [key: string]: any } | null;
    metrics: { [key: string]: any } | null;
    current_status: string;
    history: ExecutionHistoryEntry[];
    created_at: string;
    updated_at: string;
    created_by: string;
}

export interface ExecutionInput {
    agentId: string;
    sessionId: string;
    input: { [key: string]: any } | null;
    current_status: string;
    history?: ExecutionHistoryEntry[];
    output: { [key: string]: any } | null;
    errors: { [key: string]: any } | null;
    metrics: { [key: string]: any } | null;
}

export interface ExecutionFilter {
    sessionId?: string;
    agentId?: string;
}

export const createExecution = async (input: ExecutionInput): Promise<ExecutionRecord> => {
    const user = await authCheck();

    try {
        const historyEntry: ExecutionHistoryEntry = {
            timestamp: new Date().toISOString(),
            status: input.current_status,
            input: input.input,
            output: input.output,
            errors: input.errors
        };

        const createExecutionMutation = `
            mutation CreateExecutionMutation($data: ExecutionsInsertInput!) {
                collection: insertIntoExecutionsCollection(objects: [$data]) {
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
                        created_by
                    }
                }
            }
        `;

        try {
            const [execution] = await connectToDB(createExecutionMutation, {
                data: {
                    session_id: input.sessionId,
                    agent_id: input.agentId,
                    input: input.input,
                    current_status: input.current_status,
                    history: [historyEntry],
                    metrics: input.metrics || {},
                    output: input.output,
                    errors: input.errors,
                    created_by: user.id
                }
            });

            if (!execution?.id) {
                throw new Error('No execution ID returned');
            }

            return execution;
        } catch (error) {
            console.error('Failed to create execution:', error);
            throw error;
        }
    } catch (error) {
        console.error('Failed to verify agent:', error);
        throw error;
    }
};

export const updateExecution = async (input: ExecutionInput): Promise<ExecutionRecord> => {
    await authCheck();

    if (!input.sessionId || !input.agentId) {
        throw new Error('Session ID and Agent ID are required to update an execution record');
    }

    try {
        const historyEntry: ExecutionHistoryEntry = {
            status: input.current_status,
            timestamp: new Date().toISOString(),
            input: input.input,
            errors: input.errors,
            output: input.output
        };

        // First, get the current execution record to append to history
        const currentExecution = await fetchExecutions({ sessionId: input.sessionId, agentId: input.agentId });
        const existingHistory = currentExecution[0]?.history || [];

        // Build the set object with only defined values
        const setData: {
            input: string;
            current_status: string;
            history: string;
            updated_at: string;
            output?: string;
            errors?: string;
            metrics?: string;
        } = {
            input: JSON.stringify(input.input),
            current_status: input.current_status,
            history: JSON.stringify([...existingHistory, historyEntry]),
            updated_at: new Date().toISOString()
        };

        // Only add optional fields if they have values
        if (input.output !== null) setData.output = JSON.stringify(input.output);
        if (input.errors !== null) setData.errors = JSON.stringify(input.errors);
        if (input.metrics !== null) setData.metrics = JSON.stringify(input.metrics);

        const updateExecutionMutation = `
            mutation UpdateExecutionMutation(
                $session_id: UUID!,
                $agent_id: UUID!,
                $set: ExecutionsUpdateInput!
            ) {
                collection: updateExecutionsCollection(
                    filter: {
                        session_id: { eq: $session_id },
                        agent_id: { eq: $agent_id }
                    },
                    set: $set
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

        const queryConfig: QueryConfig = {
            data: {
                session_id: input.sessionId,
                agent_id: input.agentId,
                set: setData
            }
        };

        const [execution] = await connectToDB(updateExecutionMutation, queryConfig);
        return {
            ...execution,
            input: execution.input ? JSON.parse(execution.input) : null,
            output: execution.output ? JSON.parse(execution.output) : null,
            errors: execution.errors ? JSON.parse(execution.errors) : null,
            metrics: execution.metrics ? JSON.parse(execution.metrics) : null,
            history: execution.history ? JSON.parse(execution.history) : []
        };
    } catch (error) {
        console.error('Failed to verify agent:', error);
        throw error;
    }
};

export const fetchExecutions = async (filter: ExecutionFilter): Promise<ExecutionRecord[]> => {
    await authCheck();

    const fetchExecutionsQuery = `
        query ExecutionsQuery($filter: ExecutionsFilter) {
            collection: executionsCollection(
                filter: $filter
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
                        created_by
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
        input: execution.node.input ? JSON.parse(execution.node.input) : null,
        output: execution.node.output ? JSON.parse(execution.node.output) : null,
        errors: execution.node.errors ? JSON.parse(execution.node.errors) : null,
        metrics: execution.node.metrics ? JSON.parse(execution.node.metrics) : null,
        history: execution.node.history ? JSON.parse(execution.node.history) : []
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
