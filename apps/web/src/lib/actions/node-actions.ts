'use server';
import { type Node } from '@xyflow/react';

import { authCheck } from '@lib/actions/authentication-actions';
import type { QueryConfig } from '@app-types/api';
import { WorkflowState } from '@app-types/workflow';
import type { NodeData } from '@app-types/workflow';
import { connectToDB } from '@lib/utils';

export const createNodes = async (config: QueryConfig = {}): Promise<Node<NodeData>> => {
    await authCheck();

    if (!config.data?.workflowId) {
        throw new Error('Workflow ID is required to create a node');
    }

    const insertNodeMutation = `
        mutation CreateNewNode($workflowId: UUID!, $nodeType: String!, $agentId: UUID) {
            collection: insertIntoNodesCollection(objects: [{
                workflow_id: $workflowId,
                current_step: "0",
                node_type: $nodeType,
                agent_id: $agentId
            }]) {
                records {
                    id
                    agent_id
                }
            }
        } 
   `;

    try {
        const [node] = await connectToDB(insertNodeMutation, {
            ...config.data,
            workflowId: config.data?.workflowId,
            nodeType: config.data?.nodeType || 'agent',
            agentId: config.data?.agentId
        });
        if (!node?.id) {
            throw new Error('No ID returned');
        }
        return node;
    } catch (error) {
        console.error('Failed to create node:', error);
        throw error;
    }
};

export const fetchNodes = async (config: QueryConfig = {}): Promise<Node[]> => {
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
            workflow_id: { eq: config.workflowId }
            // current_step: { eq: config.currentStep }
        }
    } as QueryConfig;

    const nodes: Node[] = await connectToDB(fetchNodesQuery, variables);
    return nodes.map((node: any) => ({
        ...node.node,
        workflowId: node.workflow_id,
        currentStep: node.current_step
    })) as Node[];
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

    if (!config.data?.workflowId || !config.data?.nodeId) {
        throw new Error('Both workflowId and nodeId are required for updating a node');
    }

    const variables = {
        set: {
            state: config.data?.set?.state || WorkflowState.Initial,
            current_step: config.data?.set?.current_step || '0',
            updated_at: new Date().toISOString()  // Convert to ISO string format
        },
        workflowId: config.data?.workflowId,
        nodeId: config.data?.nodeId,
        atMost: 1
    };

    try {
        const [node] = await connectToDB(updateNodeMutation, variables);

        if (!node) {
            throw new Error(`No node found with id ${config.data?.nodeId}`);
        }

        return {
            ...node,
            workflowId: node.workflow_id,
            currentStep: node.current_step,
            updatedAt: node.updated_at
        } as Node<NodeData>;
    } catch (error) {
        console.error('Failed to update node:', error);
        throw error;
    }
};

export const deleteNodes = async (config: QueryConfig = {}): Promise<string> => {
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
