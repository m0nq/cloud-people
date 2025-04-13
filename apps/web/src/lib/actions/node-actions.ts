'use server';
import { type Node } from '@xyflow/react';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { authCheck } from '@lib/actions/authentication-actions';
import type { QueryConfig } from '@app-types/api';
import type { NodeData } from '@app-types/workflow';
import { nodeService, type UpdatedNodeInfo, type CreatedNodeInfo } from '@lib/service-providers/node-service';

export const createNodes = async (config: QueryConfig = {}): Promise<Node<NodeData>> => {
    const cookieStore = await cookies();

    const cookieMethods = {
        get(name: string) {
            return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
            try {
                cookieStore.set(name, value, options);
            } catch (error) {
                console.error(`Failed to set cookie "${name}":`, error);
            }
        },
        remove(name: string, options: CookieOptions) {
            try {
                cookieStore.delete(name);
            } catch (error) {
                console.error(`Failed to remove cookie "${name}":`, error);
            }
        },
    };

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: cookieMethods }
    );

    const createdNodeInfo: CreatedNodeInfo = await nodeService.createNodes(config, supabase);

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
    return nodeService.updateNodes(config);
};

export const deleteNodes = async (config: QueryConfig = {}): Promise<string> => {
    return nodeService.deleteNodes(config);
};
