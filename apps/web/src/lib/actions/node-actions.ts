'use server';
import { type Node } from '@xyflow/react';

import { authCheck } from '@lib/actions/authentication-actions';
import type { QueryConfig } from '@app-types/api';
import type { NodeData } from '@app-types/workflow';
import { createNodes as createNodeService } from '@lib/service-providers/node-service';
import { updateNodes as updateNodeService } from '@lib/service-providers/node-service';
import { deleteNodes as deleteNodeService } from '@lib/service-providers/node-service';
import type { UpdatedNodeInfo } from '@lib/service-providers/node-service';
import type { CreatedNodeInfo } from '@lib/service-providers/node-service';

export const createNodes = async (config: QueryConfig = {}): Promise<Node<NodeData>> => {
    const createdNodeInfo: CreatedNodeInfo = await createNodeService(config);

    const newNode: Node<NodeData> = {
        id: createdNodeInfo.id,
        type: createdNodeInfo.node_type,
        position: { x: 100, y: 100 },
        data: {
            id: createdNodeInfo.id,
            workflowId: createdNodeInfo.workflow_id,
            nodeType: createdNodeInfo.node_type,
            title: config.data?.title || 'New Node',
            state: config.data?.state || 'initial',
            ...(config.data || {})
        },
    };

    return newNode;
};

import { connectToDB } from '@lib/utils';

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

export const updateNodes = async (config: QueryConfig = {}): Promise<UpdatedNodeInfo> => {
    return updateNodeService(config);
};

export const deleteNodes = async (config: QueryConfig = {}): Promise<{ affectedCount: number }> => {
    return deleteNodeService(config);
};
