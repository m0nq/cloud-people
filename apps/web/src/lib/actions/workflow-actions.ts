'use server';
import { type QueryConfig } from '@app-types/api';
import { type WorkflowType } from '@app-types/workflow';
import { authCheck } from './authentication-actions';
import { connectToDB } from '@lib/utils';

export const createWorkflow = async (): Promise<string> => {
    const user = await authCheck();

    const createWorkflowMutation = `
        mutation CreateWorkflowMutation($userId: UUID!, $data: JSON!) {
            collection: insertIntoWorkflowsCollection(objects: [
                {
                    data: $data,
                    user_id: $userId
                }
            ]) {
                records {
                    id
                    user_id
                    data
                    current_step
                }
            }
        }
    `;

    const variables = {
        data: JSON.stringify({ label: 'New Workflow' }),
        userId: user.id
    } as QueryConfig;

    const [workflow] = await connectToDB(createWorkflowMutation, variables);

    if (!workflow?.id) {
        console.error('No workflow ID returned from mutation');
        throw new Error('Failed to create workflow');
    }

    return workflow.id;
};

export const fetchWorkflows = async (config: QueryConfig = {}): Promise<WorkflowType[]> => {
    await authCheck();

    const findWorkflowsQuery = `
        query WorkflowQuery(
            $first: Int,
            $last: Int,
            $offset: Int,
            $before: Cursor,
            $after: Cursor,
            $filter: WorkflowsFilter,
            $orderBy: [WorkflowsOrderBy!]
        ) {
            collection: workflowsCollection(
                first: $first
                last: $last
                offset: $offset
                before: $before
                after: $after
                filter: $filter
                orderBy: $orderBy
            ) {
                records: edges {
                    node {
                        id
                        state
                        current_step
                        data
                    }
                }
            }
        }
    `;

    const variables = {
        ...config,
        filter: {
            ...config.filter,
            workflow_id: { eq: config.workflowId },
            user_id: { eq: config.userId }
        }
    } as QueryConfig;

    const workflows = await connectToDB(findWorkflowsQuery, variables);
    return workflows.map((workflow: any) => ({
        ...workflow.node,
        currentStep: workflow.current_step,
        userId: workflow.user_id
    })) as WorkflowType[];
};

export const updateWorkflow = async (config: QueryConfig = {}): Promise<WorkflowType> => {
    const user = await authCheck();

    // Ensure we have a workflowId
    if (!config.workflowId) {
        throw new Error('No workflow ID provided for update');
    }

    const updateWorkflowsMutation = `
        mutation UpdateWorkflowMutation(
            $workflowId: UUID!,
            $userId: UUID!,
            $set: WorkflowsUpdateInput!
        ) {
            collection: updateWorkflowsCollection(
                set: $set,
                filter: { 
                    id: { eq: $workflowId },
                    user_id: { eq: $userId }
                }
            ) {
                records {
                    id
                    state
                    current_step
                    data
                    user_id
                    updated_at
                }
            }
        }
    `;

    const variables = {
        workflowId: config.workflowId,
        userId: user.id,
        set: {
            state: config.set?.state,
            current_step: config.set?.current_step,
            data: config.set?.data,
            updated_at: config.set?.updated_at ?? new Date().toISOString()
        }
    };

    const records = await connectToDB(updateWorkflowsMutation, variables);
    debugger;
    const [workflow] = records;

    if (!workflow) {
        throw new Error('No workflow found with the provided ID');
    }

    return {
        ...workflow,
        userId: workflow.user_id,
        currentStep: workflow.current_step
    } as WorkflowType;
};

export const deleteWorkflow = async (config: QueryConfig) => {
    const user = await authCheck();

    const deleteWorkflowMutation = `
        mutation DeleteWorkflowMutation(
            $filter: WorkflowsFilter,
            $atMost: Int!
         ) {
            collection: deleteFromWorkflowsCollection(filter: $filter, atMost: $atMost) {
                records {
                    id
                }
            }
        }
    `;

    const variables = {
        ...config,
        filter: {
            ...config.filter,
            workflow_id: { eq: config.workflowId },
            user_id: { eq: user.id }
        }
    } as QueryConfig;

    const [workflow] = await connectToDB(deleteWorkflowMutation, variables);

    return workflow.id as string;
};
