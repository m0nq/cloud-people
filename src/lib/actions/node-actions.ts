'use server';
import { type QueryConfig } from '@lib/definitions';
import { NodeType } from '@lib/definitions';
import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';

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

export const fetchNodes = async (config: QueryConfig = {}): Promise<NodeType[]> => {
    await authCheck();

    const fetchNodesQuery = `
        query NodesQuery(
            $first: Int,
            $last: Int,
            $offset: Int,
            $filter: NodesFilter
        ) {
            collection: nodesCollection(
            first: $first,
            last: $last,
            offset: $offset,
            filter: $filter
        ) {
            records: edges {
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
        filter: {
            ...config.filter,
            workflow_id: { eq: config.workflowId },
            current_step: { eq: config.currentStep }
        }
    } as QueryConfig;

    const nodes = await connectToDB(fetchNodesQuery, variables);
    return nodes.map((node: any) => ({
        ...node.node,
        workflowId: node.workflow_id,
        currentStep: node.current_step
    })) as NodeType[];
};

export const updateNodes = async (config: QueryConfig = {}) => {
    await authCheck();

    const updateNodeMutation = `
        mutation UpdateNodeMutation(
            $set: NodesUpdateInput!,
            $filter: NodesFilter,
            $atMost: Int! = 1
        ) {
            collection: updateNodesCollection(
                set: $set
                filter: $filter
                atMost: $atMost
            ) {
                records {
                    id
                    workflow_id
                    state
                    current_step
                }
            }
        }
    `;

    const variables = {
        ...config,
        set: {
            ...config.set,
            updated_at: config.set?.updatedAt ?? new Date()
        },
        filter: {
            ...config.filter,
            workflow_id: { eq: config.workflowId }
        }
    } as QueryConfig;

    const [node] = await connectToDB(updateNodeMutation, variables);
    return {
        ...node,
        workflowId: node.workflow_id,
        currentStep: node.current_step
    } as NodeType;
};

export const deleteNodes = async (config: any = {}) => {
    await authCheck();

    const deleteNodeMutation = `
        mutation DeleteWorkflowMutation(
            $filter: WorkflowsFilter,
            $atMost: Int!
         ) {
            collection: deleteFromNodesCollection(
                filter: $filter,
                atMost: $atMost
            ) {
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
            workflow_id: { eq: config.workflowId }
        }
    } as QueryConfig;

    const [node] = await connectToDB(deleteNodeMutation, variables);
    return node.id as string;
};
