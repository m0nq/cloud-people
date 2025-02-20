'use server';

import { authCheck } from '@lib/actions/authentication-actions';
import type { QueryConfig } from '@app-types/api';
import { connectToDB } from '@lib/utils';
import { WorkflowState } from '@app-types/workflow';
import type { WorkflowExecution } from '@app-types/workflow';
import { updateWorkflow } from './workflow-actions';

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
                $nodeId: UUID!,
                $currentStatus: String!,
                $metrics: Json,
                $errors: Json,
                $updatedAt: Timestamp!
            ) {
                collection: updateExecutionsCollection(
                    set: {
                        node_id: $nodeId,
                        current_status: $currentStatus,
                        metrics: $metrics,
                        errors: $errors,
                        updated_at: $updatedAt
                    },
                    filter: { id: { eq: $id } }
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

        const now = new Date().toISOString();

        try {
            // Update execution
            const executionVariables = {
                id: query.id,
                nodeId: query.nodeId,
                currentStatus: query.currentStatus,
                metrics: query.metrics || {},
                errors: query.errors || null,
                updatedAt: now
            };

            const [execution]: ExecutionRecord[] = await connectToDB(updateExecutionMutation, executionVariables);

            // Update workflow using the existing function
            await updateWorkflow({
                workflowId: query.workflowId,
                set: {
                    state: query.currentStatus,
                    current_step: query.nodeId,
                    updated_at: now
                }
            });

            return {
                id: execution.id,
                workflowId: execution.workflow_id,
                state: execution.current_status,
                currentNodeId: execution.node_id,
                startedAt: new Date(execution.created_at)
            };
        } catch (error) {
            console.error('Failed to update execution:', error);
            throw error;
        }
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
