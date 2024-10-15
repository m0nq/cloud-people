'use server';
import { notFound } from 'next/navigation';
import { type User } from '@supabase/supabase-js';

import { createClient } from '@lib/supabase/server';
import { queryDB } from '@lib/supabase/api';
import { QueryConfig } from '@lib/definitions';
import { WorkflowType } from '@lib/definitions';

const supabase = createClient();

const authCheck = async (): Promise<User> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    return user;
};

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
                workflows: records {
                    id
                    user_id
                    data
                    current_step
                }
            }
        }
    `;

    const variables = {
        data: JSON.stringify({ label: 'Node Info' }),
        userId: user.id
    } as QueryConfig;

    const { data: { collection: { workflows: [workflow] } } } = await queryDB(createWorkflowMutation, variables);
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
                workflows: edges {
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

    const { data: { collection: { workflows } } } = await queryDB(findWorkflowsQuery, { ...config } as QueryConfig);
    // if item not found, throw a local 404
    if (!workflows.length) {
        notFound();
    }

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
                workflows: records {
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
            updated_at: new Date()
        }
    } as QueryConfig;

    const { data: { collection: { workflows } } } = await queryDB(updateWorkflowsMutation, variables);
    // if item not found, throw a local 404
    if (!workflows.length) {
        notFound();
    }

    return workflows[0] as WorkflowType;
};

export const deleteWorkflow = async (config: QueryConfig) => {
    await authCheck();

    const deleteWorkflowMutation = `
        mutation DeleteWorkflowMutation($filter: WorkflowsFilter, $atMost: Int!) {
            collection: deleteFromWorkflowsCollection(filter: $filter, atMost: $atMost) {
                workflows: records {
                    id
                }
            }
        }
    `;

    const { data: { collection: { workflows } } } = await queryDB(deleteWorkflowMutation, { ...config } as QueryConfig);
    // if item not found, throw a local 404
    if (!workflows.length) {
        notFound();
    }

    return workflows[0].id;
};
