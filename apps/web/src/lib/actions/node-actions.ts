'use server';
import { type Node } from '@xyflow/react';

import { authCheck } from '@lib/actions/authentication-actions';
import type { QueryConfig } from '@app-types/api';
import type { NodeData } from '@app-types/workflow';
import { connectToDB } from '@lib/utils';
import { nodeService } from '@lib/service-providers/node-service';

export const createNodes = async (config: QueryConfig = {}): Promise<Node<NodeData>> => {
    return nodeService.createNodes(config);
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
    return nodeService.updateNodes(config);
};

export const deleteNodes = async (config: QueryConfig = {}): Promise<string> => {
    return nodeService.deleteNodes(config);
};
