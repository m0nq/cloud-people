'use server';
import { authCheck } from '@lib/actions/authentication-actions';
import { type NodeType } from '@lib/definitions';
import { type QueryConfig } from '@lib/definitions';
import { connectToDB } from '@lib/utils';

export const createNodes = async (config: QueryConfig = {}): Promise<string> => {
    await authCheck();

    if (!config.workflowId) {
        throw new Error('Workflow ID is required to create a node');
    }

    const insertNodeMutation = `
        mutation CreateNewNode($workflowId: UUID!) {
            collection: insertIntoNodesCollection(objects: [{
                workflow_id: $workflowId,
                state: "{}",
                current_step: "0"
            }]) {
                records {
                    id
                }
            }
        } 
   `;

    try {
        const [node] = await connectToDB(insertNodeMutation, { workflowId: config.workflowId });
        if (!node?.id) {
            throw new Error('Failed to create node: No ID returned');
        }
        return node.id;
    } catch (error) {
        console.error('Failed to create node:', error);
        throw error;
    }
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
            $workflowId: UUID!,
            $nodeId: UUID!,
            $atMost: Int! = 1
        ) {
            collection: updateNodesCollection(
                set: $set
                filter: {
                    workflow_id: { eq: $workflowId }
                    id: { eq: $nodeId }
                }
                atMost: $atMost
            ) {
                records {
                    id
                    workflow_id
                    state
                    current_step
                    updated_at
                }
            }
        }
    `;

    // Ensure state is stringified and remove any undefined values
    const cleanSet = {
        ...(config.set?.state && { state: JSON.stringify(config.set.state) }),
        ...(config.set?.current_step && { current_step: config.set.current_step }),
        updated_at: config.set?.updated_at ?? new Date().toISOString()
    };

    if (!config.workflowId || !config.nodeId) {
        throw new Error('Both workflowId and nodeId are required for updating a node');
    }

    const variables = {
        set: cleanSet,
        workflowId: config.workflowId,
        nodeId: config.nodeId,
        atMost: 1
    };

    try {
        const [node] = await connectToDB(updateNodeMutation, variables);

        if (!node) {
            throw new Error(`No node found with id ${config.nodeId}`);
        }

        return {
            ...node,
            workflowId: node.workflow_id,
            currentStep: node.current_step,
            updatedAt: node.updated_at
        } as NodeType;
    } catch (error) {
        console.error('Failed to update node:', error);
        throw error;
    }
};

export const deleteNodes = async (config: QueryConfig = {}) => {
    await authCheck();

    const deleteNodeMutation = `
        mutation DeleteNode($filter: NodesFilter) {
            collection: deleteFromNodesCollection(filter: $filter) {
                records {
                    id
                }
            }
        }
    `;

    const variables = {
        filter: {
            id: { eq: config.nodeId }
        }
    } as QueryConfig;

    const [node] = await connectToDB(deleteNodeMutation, variables);
    return node.id as string;
};
