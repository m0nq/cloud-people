'use server';

import type { QueryConfig } from '@app-types/api';
import type { EdgeData } from '@app-types/workflow';
import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';
import { edgeService } from '@lib/service-providers/edge-service';

export const createEdge = async (config: QueryConfig): Promise<string> => {
    return edgeService.createEdge(config);
};

export const fetchEdges = async (config: any = {}): Promise<EdgeData[]> => {
    await authCheck();

    const fetchEdgesQuery = `
        query EdgesQuery(
            $first: Int,
            $last: Int,
            $offset: Int,
            $filter: EdgesFilter
        ) {
            collection: edgesCollection(
                first: $first,
                last: $last,
                offset: $offset,
                filter: $filter
            ) {
                records: edges {
                    edge: node {
                    id
                    workflow_id
                    to_node_id
                    from_node_id
                }
            }
        }
   `;

    const variables = {
        ...config,
        filter: {
            ...config.filter,
            workflow_id: { eq: config.workflowId },
            to_node_id: { eq: config.toNodeId },
            from_node_id: { eq: config.fromNodeId }
        }
    } as QueryConfig;

    const edges = await connectToDB(fetchEdgesQuery, variables);
    return edges.map((edge: any) => ({
        ...edge,
        workflowId: edge.workflow_id,
        toNodeId: edge.to_node_id,
        fromNodeId: edge.from_node_id
    })) as EdgeData[];
};

export const updateEdges = async (config: any = {}) => {
    return edgeService.updateEdges(config);
};

export const deleteEdges = async (config: QueryConfig = {}) => {
    return edgeService.deleteEdges(config);
};
