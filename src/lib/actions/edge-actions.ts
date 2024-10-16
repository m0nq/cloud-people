'use server';

import { QueryConfig } from '@lib/definitions';
import { EdgeType } from '@lib/definitions';
import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';

export const createEdge = async (config: QueryConfig): Promise<string> => {
    await authCheck();

    const insertEdgeMutation = `
        mutation CreateEdgeMutation(
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

    const [edge] = await connectToDB(insertEdgeMutation, config);
    return edge.id;
};

export const fetchEdges = async (config: any = {}): Promise<EdgeType[]> => {
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
    return edges.map((node: any) => ({
        ...node.node,
        workflowId: node.workflow_id,
        toNodeId: node.to_node_id,
        fromNodeId: node.from_node_id
    })) as EdgeType[];
};

export const updateEdges = async (config: any = {}) => {
    await authCheck();

    const updateEdgeMutation = `
        mutation UpdateEdgeMutation(
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
        ...config,
        set: {
            ...config.set,
            updated_at: config.set?.updatedAt ?? new Date()
        },
        filter: {
            ...config.filter,
            workflow_id: { eq: config.workflowId },
            to_node_id: { eq: config.toNodeId },
            from_node_id: { eq: config.fromNodeId }
        }
    } as QueryConfig;

    const [edge] = await connectToDB(updateEdgeMutation, variables);
    return {
        ...edge,
        workflowId: edge.workflow_id,
        toNodeId: edge.to_node_id,
        fromNodeId: edge.from_node_id
    } as EdgeType;
};

export const deleteEdges = async (config: any = {}) => {
    await authCheck();

    const deleteEdgeMutation = `
        mutation DeleteEdgeMutation(
            $filter: EdgesFilter,
            $atMost: Int! = 1
        ) {
            collection: deleteFromEdgesCollection(
                filter: $filter
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
            workflow_id: { eq: config.workflowId },
            to_node_id: { eq: config.toNodeId },
            from_node_id: { eq: config.fromNodeId }
        }
    } as QueryConfig;

    const [edge] = await connectToDB(deleteEdgeMutation, variables);
    return edge.id as string;
};
