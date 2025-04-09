/**
 * Node Service Provider
 *
 * This module provides real and mock implementations for node operations.
 */

import { createServiceProvider } from '.';
import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';
import type { QueryConfig } from '@app-types/api';

// Define the interface for our node service
export interface NodeService {
    createNodes(config: QueryConfig): Promise<any>;

    updateNodes(config: QueryConfig): Promise<any>;

    deleteNodes(config: QueryConfig): Promise<any>;
}

/**
 * Real node service implementation that connects to the database
 */
class RealNodeService implements NodeService {
    async createNodes(config: QueryConfig = {}): Promise<any> {
        const user = await authCheck();

        const createNodeMutation = `
      mutation CreateNodeMutation($workflowId: UUID!, $nodeType: String!, $parentId: UUID) {
        collection: insertIntoNodesCollection(objects: [{
          workflow_id: $workflowId,
          node_type: $nodeType,
          parent_id: $parentId
        }]) {
          records {
            id
            workflow_id
            node_type
            parent_id
            created_at
            updated_at
          }
        }
      }
    `;

        try {
            const variables = {
                workflowId: config.data?.workflowId,
                nodeType: config.data?.nodeType || 'agent',
                parentId: config.data?.parentId
            };

            const [node] = await connectToDB(createNodeMutation, variables);

            if (!node?.id) {
                throw new Error('Failed to create node');
            }

            return node;
        } catch (error) {
            console.error('Failed to create node:', error);
            throw error;
        }
    }

    async updateNodes(config: QueryConfig = {}): Promise<any> {
        const user = await authCheck();

        const updateNodeMutation = `
      mutation UpdateNodeMutation($nodeId: UUID!, $workflowId: UUID!, $set: NodesUpdateInput!) {
        collection: updateNodesCollection(
          set: $set,
          filter: { id: { eq: $nodeId }, workflow_id: { eq: $workflowId } }
        ) {
          records {
            id
            workflow_id
            node_type
            parent_id
            state
            current_step
            updated_at
          }
        }
      }
    `;

        try {
            const variables = {
                nodeId: config.data?.nodeId,
                workflowId: config.data?.workflowId,
                set: config.data?.set || {}
            };

            const [node] = await connectToDB(updateNodeMutation, variables);

            if (!node) {
                throw new Error('Failed to update node');
            }

            return node;
        } catch (error) {
            console.error('Failed to update node:', error);
            throw error;
        }
    }

    async deleteNodes(config: QueryConfig = {}): Promise<any> {
        const user = await authCheck();

        const deleteNodeMutation = `
      mutation DeleteNodeMutation($nodeId: UUID!) {
        collection: deleteFromNodesCollection(filter: { id: { eq: $nodeId } }) {
          records {
            id
          }
        }
      }
    `;

        try {
            const variables = {
                nodeId: config.nodeId
            };

            const [node] = await connectToDB(deleteNodeMutation, variables);

            if (!node) {
                throw new Error('Failed to delete node');
            }

            return node;
        } catch (error) {
            console.error('Failed to delete node:', error);
            throw error;
        }
    }
}

/**
 * Mock node service implementation that simulates database operations
 */
class MockNodeService implements NodeService {
    // Mock nodes data
    private mockNodes: any[] = [];
    private nextId = 1;

    constructor() {
        console.log('[MockNodeService] Initialized');
    }

    async createNodes(config: QueryConfig = {}): Promise<any> {
        // Simulate API delay
        await this.delay(200);

        const nodeId = `mock-node-${this.nextId++}`;

        const newNode = {
            id: nodeId,
            workflow_id: config.data?.workflowId || 'mock-workflow-1',
            node_type: config.data?.nodeType || 'agent',
            parent_id: config.data?.parentId || null,
            state: 'initial',
            current_step: '0',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        this.mockNodes.push(newNode);

        console.log(`[MockNodeService] Created node: ${nodeId} of type ${newNode.node_type}`);
        return newNode;
    }

    async updateNodes(config: QueryConfig = {}): Promise<any> {
        // Simulate API delay
        await this.delay(200);

        const nodeId = config.data?.nodeId;
        if (!nodeId) {
            throw new Error('No node ID provided for update');
        }

        const nodeIndex = this.mockNodes.findIndex(n => n.id === nodeId);

        if (nodeIndex === -1) {
            throw new Error('No node found with the provided ID');
        }

        // Update the node
        const updatedNode = {
            ...this.mockNodes[nodeIndex],
            ...config.data?.set,
            updated_at: new Date().toISOString()
        };

        this.mockNodes[nodeIndex] = updatedNode;

        console.log(`[MockNodeService] Updated node: ${nodeId}`);
        return updatedNode;
    }

    async deleteNodes(config: QueryConfig = {}): Promise<any> {
        // Simulate API delay
        await this.delay(200);

        const nodeId = config.nodeId;
        if (!nodeId) {
            throw new Error('No node ID provided for deletion');
        }

        const nodeIndex = this.mockNodes.findIndex(n => n.id === nodeId);

        if (nodeIndex === -1) {
            throw new Error('No node found with the provided ID');
        }

        const deletedNode = this.mockNodes[nodeIndex];
        this.mockNodes.splice(nodeIndex, 1);

        console.log(`[MockNodeService] Deleted node: ${nodeId}`);
        return deletedNode;
    }

    // Helper to simulate API delays
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create and export the node service with automatic mode switching
export const nodeService = createServiceProvider<NodeService>(
    new RealNodeService(),
    new MockNodeService(),
    {
        // Default to real in production, mock in development
        defaultMode: process.env.NODE_ENV === 'production' ? 'real' : 'mock'
    }
);

// Export a hook for accessing the node service
export function useNodeService() {
    return nodeService;
}
