'use server';

import { authCheck } from '@lib/actions/authentication-actions';
import type { QueryConfig } from '@app-types/api';
import { connectToDB } from '@lib/utils';
import { WorkflowState } from '@app-types/workflow';
import type { WorkflowExecution } from '@app-types/workflow';

export interface ExecutionRecord {
    id: string;
    node_id: string;
    workflow_id: string;
    errors: string;
    metrics: string;
    current_status: WorkflowState;
    created_at: string;
    updated_at: string;
}

export interface ExecutionQuery {
    currentStatus: WorkflowState;
    errors?: { [key: string]: any } | null;
    id?: string;
    metrics?: { [key: string]: any } | null;
    nodeId: string;
    workflowId: string;
}

export interface ExecutionFilter {
    sessionId?: string;
    agentId?: string;
}

export const createExecution = async (query: ExecutionQuery): Promise<WorkflowExecution> => {
    const user = await authCheck();

    if (!query.workflowId) {
        throw new Error('A workflow ID is required to create an execution record');
    }

    try {
        const createExecutionMutation = `
            mutation CreateExecutionMutation($data: ExecutionsInsertInput!) {
                collection: insertIntoExecutionsCollection(objects: [$data]) {
                    records {
                        id
                        completed_at
                        created_at
                        created_by
                        current_status
                        errors
                        metrics
                        node_id
                        updated_at
                        workflow_id
                    }
                }
            }
        `;

        try {
            const queryConfig: QueryConfig = {
                data: {
                    node_id: query.nodeId,
                    workflow_id: query.workflowId,
                    current_status: query.currentStatus,
                    metrics: query.metrics ? JSON.stringify(query.metrics) : JSON.stringify({}),
                    errors: query.errors ? JSON.stringify(query.errors) : null,
                    created_by: user.id
                }
            };

            const [execution]: ExecutionRecord[] = await connectToDB(createExecutionMutation, queryConfig);

            return {
                id: execution.id,
                workflowId: execution.workflow_id,
                state: execution.current_status,
                currentNodeId: execution.node_id,
                startedAt: new Date(execution.created_at)
            };
        } catch (error) {
            console.error('Failed to create execution:', error);
            throw error;
        }
    } catch (error) {
        console.error('Failed to create execution:', error);
        throw error;
    }
};

export const updateExecution = async (query: ExecutionQuery): Promise<WorkflowExecution> => {
    const user = await authCheck();

    if (!query.id) {
        throw new Error('An execution id is required to update an execution record');
    }

    try {
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
                        completed_at
                        created_at
                        created_by
                        current_status
                        errors
                        metrics
                        node_id
                        updated_at
                        workflow_id
                    }
                }
            }
        `;

        // Build the set object with only updatable fields
        const setData: {
            current_status: WorkflowState;
            updated_at: string;
            created_by: string;
            node_id: string;
            workflow_id: string;
            errors?: string;
            metrics?: string;
        } = {
            current_status: query.currentStatus,
            updated_at: new Date().toISOString(),
            created_by: user.id,
            node_id: query.nodeId,
            workflow_id: query.workflowId,
            // Convert errors and metrics to strings if present
            ...(query.errors && { errors: JSON.stringify(query.errors) }),
            ...(query.metrics && { metrics: JSON.stringify(query.metrics) })
        };

        // Validate required fields
        if (!setData.node_id || !setData.workflow_id) {
            throw new Error('node_id and workflow_id are required for execution updates');
        }

        const config: QueryConfig = {
            variables: {
                id: query.id,
                set: setData
            }
        };

        const [execution]: ExecutionRecord[] = await connectToDB(updateExecutionMutation, config.variables);
        return {
            id: execution.id,
            workflowId: execution.workflow_id,
            state: execution.current_status,
            currentNodeId: execution.node_id,
            startedAt: new Date(execution.created_at),
            errors: execution.errors ? JSON.parse(execution.errors) : null,
            metrics: execution.metrics ? JSON.parse(execution.metrics) : null
        };
    } catch (error) {
        console.error('Failed to update execution:', error);
        throw error;
    }
};

export const fetchExecutions = async (filter: ExecutionFilter): Promise<WorkflowExecution[]> => {
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
                        workflow_id
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

    const queryConfig: QueryConfig = {
        data: {
            filter
        }
    };

    const executions: ExecutionRecord[] = await connectToDB(fetchExecutionsQuery, queryConfig);
    return executions.map((execution: ExecutionRecord) => ({
        id: execution.id,
        workflowId: execution.workflow_id,
        state: execution.current_status,
        currentNodeId: execution.node_id,
        startedAt: new Date(execution.created_at),
        errors: execution.errors ? JSON.parse(execution.errors) : null,
        metrics: execution.metrics ? JSON.parse(execution.metrics) : null
    })) as WorkflowExecution[];
};
