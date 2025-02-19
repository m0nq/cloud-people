'use server';

import type { QueryConfig } from '@app-types/api';
import type { EdgeData } from '@app-types/workflow';
import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';

export const createEdge = async (config: QueryConfig): Promise<string> => {
    await authCheck();

    const insertEdgeMutation = `
        mutation CreateEdge(
            $workflowId: UUID!,
            $toNodeId: UUID!,
            $fromNodeId: UUID
        ) {
            collection: insertIntoEdgesCollection(objects: [{
                workflow_id: $workflowId
                to_node_id: $toNodeId
                from_node_id: $fromNodeId
            }]) {
                records {
                    id
                }
            }
        }
    `;

    if (!config.data?.workflowId || !config.data?.toNodeId) {
        throw new Error('workflowId and toNodeId are required to create an edge');
    }

    const variables = {
        workflowId: config.data.workflowId,
        toNodeId: config.data.toNodeId,
        fromNodeId: config.data.fromNodeId
    };

    const [edge] = await connectToDB(insertEdgeMutation, variables);
    if (!edge?.id) {
        throw new Error('Failed to create edge');
    }
    return edge.id;
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
    await authCheck();

    const updateEdgeMutation = `
        mutation UpdateEdge(
            $set: EdgesUpdateInput!,
            $filter: EdgesFilter,
            $atMost: Int! = 1
        ) {
            collection: updateEdgesCollection(
                set: $set
                filter: $filter
                atMost: $atMost
            ) {
                records {
                    id
                    workflow_id
                    to_node_id
                    from_node_id
                }
            }
        }
    `;

    const variables = {
        set: {
            workflow_id: config.workflowId,
            to_node_id: config.toNodeId,
            from_node_id: config.fromNodeId
        },
        filter: {
            id: { eq: config.edgeId },
            workflow_id: { eq: config.workflowId }
        }
    } as QueryConfig;

    const [edge] = await connectToDB(updateEdgeMutation, variables);
    return {
        id: edge.id,
        workflowId: config.workflowId,
        toNodeId: edge.to_node_id,
        fromNodeId: edge.from_node_id
    } as EdgeData;
};

export const deleteEdges = async (config: QueryConfig = {}) => {
    await authCheck();

    const deleteEdgeMutation = `
        mutation DeleteEdge($filter: EdgesFilter) {
            collection: deleteFromEdgesCollection(filter: $filter) {
                records {
                    id
                }
            }
        }
    `;

    const variables = {
        filter: {
            id: { eq: config.edgeId },
            workflow_id: { eq: config.workflowId }
        }
    } as QueryConfig;

    const [edge] = await connectToDB(deleteEdgeMutation, variables);
    return edge.id as string;
};
