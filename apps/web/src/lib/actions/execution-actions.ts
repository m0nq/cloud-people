'use server';

import { authCheck } from '@lib/actions/authentication-actions';
import type { QueryConfig } from '@app-types/api';
import { connectToDB } from '@lib/utils';

export interface ExecutionHistoryEntry {
    status: string;
    timestamp: string;
    metadata?: { [key: string]: any };
    errors: { [key: string]: any } | null;
}

export interface ExecutionRecord {
    id: string;
    errors: { [key: string]: any } | null;
    metrics: { [key: string]: any } | null;
    current_status: string;
    created_at: string;
    updated_at: string;
}

export interface ExecutionInput {
    id?: string;
    nodeId: string;
    workflowId?: string;
    current_status: string;
    metrics?: { [key: string]: any } | null;
    errors?: { [key: string]: any } | null;
}

export interface ExecutionFilter {
    sessionId?: string;
    agentId?: string;
}

export const createExecution = async (input: ExecutionInput): Promise<ExecutionRecord> => {
    const user = await authCheck();

    try {
        const createExecutionMutation = `
            mutation CreateExecutionMutation($data: ExecutionsInsertInput!) {
                collection: insertIntoExecutionsCollection(objects: [$data]) {
                    records {
                        id
                        node_id
                        errors
                        metrics
                        current_status
                        created_at
                        updated_at
                    }
                }
            }
        `;

        try {
            const [execution] = await connectToDB(createExecutionMutation, {
                data: {
                    node_id: input.nodeId,
                    current_status: input.current_status,
                    metrics: input.metrics || {},
                    errors: input.errors,
                    created_by: user.id
                }
            });

            return execution;
        } catch (error) {
            console.error('Failed to create execution:', error);
            throw error;
        }
    } catch (error) {
        console.error('Failed to create execution:', error);
        throw error;
    }
};

export const updateExecution = async (input: ExecutionInput): Promise<ExecutionRecord> => {
    await authCheck();

    if (!input.id) {
        throw new Error('An execution id is required to update an execution record');
    }

    try {
        // Build the set object with only defined values
        const setData: {
            current_status: string;
            updated_at: string;
            errors?: string;
            metrics?: string;
        } = {
            current_status: input.current_status,
            updated_at: new Date().toISOString()
        };

        if (!input.errors) {
            setData.errors = JSON.stringify(input.errors);
        }

        if (!input.metrics) {
            setData.metrics = JSON.stringify(input.metrics);
        }

        const updateExecutionMutation = `
            mutation UpdateExecutionMutation(
                $id: UUID!,
                $set: ExecutionsUpdateInput!
            ) {
                collection: updateExecutionsCollection(
                    filter: {
                        id: { eq: $id }
                    },
                    set: $set
                ) {
                    records {
                        id
                        node_id
                        errors
                        metrics
                        current_status
                        created_at
                        updated_at
                    }
                }
            }
        `;

        const queryConfig: QueryConfig = {
            data: {
                id: input.id,
                set: setData
            }
        };

        const [execution] = await connectToDB(updateExecutionMutation, queryConfig);
        return {
            ...execution,
            errors: execution.errors ? JSON.parse(execution.errors) : null,
            metrics: execution.metrics ? JSON.parse(execution.metrics) : null
        };
    } catch (error) {
        console.error('Failed to update execution:', error);
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
                        node_id
                        errors
                        metrics
                        current_status
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

    const queryConfig: QueryConfig = {
        data: {
            filter: queryFilter
        }
    };

    const executions = await connectToDB(fetchExecutionsQuery, queryConfig);
    return executions.map((execution: any) => ({
        ...execution,
        errors: execution.node.errors ? JSON.parse(execution.node.errors) : null,
        metrics: execution.node.metrics ? JSON.parse(execution.node.metrics) : null
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
