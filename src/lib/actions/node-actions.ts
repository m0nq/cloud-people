'use server';
import { createClient } from '@lib/supabase/server';
import { queryDB } from '@lib/supabase/api';
import { type QueryConfig } from '@lib/definitions';
import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';

const supabase = createClient();

export const createNodes = async (config: QueryConfig = {}): Promise<string> => {
    await authCheck();

    const insertNodeMutation = `
        mutation CreateNewNode($workflowId: UUID!) {
            collection: insertIntoNodesCollection(objects: [{
                workflow_id: $workflowId
            }]) {
                records {
                    id
                }
            }
        } 
   `;

    const [node] = await connectToDB(insertNodeMutation, config);
    return node.id;
};

export const fetchNodes = async (config: QueryConfig = {}) => {
    // TODO: implement graphql call to fetch data
    // all by default, filter when parameters are passed in
    // if item not found, can throw a local 404 with { notFound() } from next/navigation
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    const fetchNodesQuery = `
        query NodesQuery($first: Int, $last: Int, $offset: Int, $filter: NodesFilter) {
            collection: nodesCollection(first: $first, last: $last, offset: $offset, filter: $filter) {
                nodes: edges {
                    node {
                        id
                        workflow_id
                        current_step
                        state
                    }
                }
            }
        }
   `;

    const variables = {
        ...config,
        filter: { ...config.filter }
    };

    // doesn't necessarily need to return anything atm
    await queryDB(fetchNodesQuery, variables);
    // const { data: { workflows: { nodes: [node] } } } = await queryDB(fetchNodesQuery, variables);
    // return node.id;
};

export const updateNodes = async (config: any = {}) => {
    // TODO: implement via graphql api
};

export const deleteNodes = async (config: any = {}) => {
    // TODO: implement via graphql api
};
