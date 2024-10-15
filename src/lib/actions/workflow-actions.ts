'use server';
import { QueryConfig } from '@lib/definitions';
import { WorkflowType } from '@lib/definitions';
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
        data: JSON.stringify({ label: '' }),
        userId: user.id
    } as QueryConfig;

    const [workflow] = await connectToDB(createWorkflowMutation, variables);

    return workflow.id as string;
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

    const workflows = await connectToDB(findWorkflowsQuery, config);

    return workflows.map((workflow: any) => ({ ...workflow.node })) as WorkflowType[];
};

export const updateWorkflow = async (config: QueryConfig = {}): Promise<WorkflowType> => {
    await authCheck();

    const updateWorkflowsMutation = `
        mutation UpdateWorkflowMutation(
            $set: WorkflowsUpdateInput!,
            $filter: WorkflowsFilter,
            $atMost: Int! = 1
        ) {
            collection: updateWorkflowsCollection(
                set: $set
                filter: $filter
                atMost: $atMost
            ) {
                records {
                    id
                    state
                    current_step
                    data
                }
            }
        }
    `;

    const variables = {
        ...config,
        set: {
            ...config.set,
            current_step: config.set?.currentStep || null,
            updated_at: config.set?.updated_at ?? new Date()
        }
    } as QueryConfig;

    const [workflow] = await connectToDB(updateWorkflowsMutation, variables);

    return workflow as WorkflowType;
};
export const deleteWorkflow = async (config: QueryConfig) => {
    await authCheck();

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

    const [workflow] = await connectToDB(deleteWorkflowMutation, config);

    return workflow.id as string;
};
