'use server';

import { createClient } from '@lib/supabase/server';
import { queryDB } from '@lib/supabase/api';

const supabase = createClient();

export const createWorkflow = async (config: any = {}): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    const insertWorkflowMutation = `
        mutation CreateWorkflowMutation($userId: UUID!, $data: JSON!) {
            workflows: insertIntoWorkflowsCollection(objects: [
                {
                    data: $data,
                    user_id: $userId
                }
            ]) {
                nodes: records {
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
    };

    const { data: { workflows: { nodes: [node] } } } = await queryDB(insertWorkflowMutation, variables);
    return node.id;
};

export const fetchWorkflows = async (config: any = {}) => {
    // TODO: implement graphql call to fetch data
    // all by default, filter when parameters are passed in
    // if item not found, can throw a local 404 with { notFound() } from next/navigation
};

export const updateWorkflow = async (config: any = {}) => {
    // TODO: implement via graphql api
};

export const deleteWorkflow = async (config: any = {}) => {
    // TODO: implement via graphql api
};
