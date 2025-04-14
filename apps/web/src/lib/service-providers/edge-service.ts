/**
 * Edge Service Provider
 *
 * This module provides real and mock implementations for edge operations.
 */

import { createServiceProvider } from '.';
import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';
import type { QueryConfig } from '@app-types/api';

// Define the interface for our edge service
export interface EdgeService {
    createEdge(config: QueryConfig): Promise<string>;

    updateEdges(config: QueryConfig): Promise<any>;

    deleteEdges(config: QueryConfig): Promise<any>;
}

/**
 * Real edge service implementation that connects to the database
 */
class RealEdgeService implements EdgeService {
    async createEdge(config: QueryConfig = {}): Promise<string> {
        const user = await authCheck();

        const createEdgeMutation = `
      mutation CreateEdgeMutation($workflowId: UUID!, $fromNodeId: UUID!, $toNodeId: UUID!) {
        collection: insertIntoEdgesCollection(objects: [{
          workflow_id: $workflowId,
          from_node_id: $fromNodeId,
          to_node_id: $toNodeId
        }]) {
          records {
            id
            workflow_id
            from_node_id
            to_node_id
            created_at
            updated_at
          }
        }
      }
    `;

        try {
            const variables = {
                workflowId: config.data?.workflowId,
                fromNodeId: config.data?.fromNodeId,
                toNodeId: config.data?.toNodeId
            };

            const [edge] = await connectToDB(createEdgeMutation, variables);

            if (!edge?.id) {
                throw new Error('Failed to create edge');
            }

            return edge.id;
        } catch (error) {
            console.error('Failed to create edge:', error);
            throw error;
        }
    }

    async updateEdges(config: QueryConfig = {}): Promise<any> {
        const user = await authCheck();

        const updateEdgeMutation = `
      mutation UpdateEdgeMutation($edgeId: UUID!, $workflowId: UUID!, $set: EdgesUpdateInput!) {
        collection: updateEdgesCollection(
          set: $set,
          filter: { id: { eq: $edgeId }, workflow_id: { eq: $workflowId } }
        ) {
          records {
            id
            workflow_id
            from_node_id
            to_node_id
            updated_at
          }
        }
      }
    `;

        try {
            const variables = {
                edgeId: config.data?.edgeId,
                workflowId: config.data?.workflowId,
                set: config.data?.set || {}
            };

            const [edge] = await connectToDB(updateEdgeMutation, variables);

            if (!edge) {
                throw new Error('Failed to update edge');
            }

            return edge;
        } catch (error) {
            console.error('Failed to update edge:', error);
            throw error;
        }
    }

    async deleteEdges(config: QueryConfig = {}): Promise<any> {
        const user = await authCheck();

        const deleteEdgeMutation = `
      mutation DeleteEdgeMutation($edgeId: UUID!) {
        collection: deleteFromEdgesCollection(filter: { id: { eq: $edgeId } }) {
          records {
            id
          }
        }
      }
    `;

        try {
            const variables = {
                edgeId: config.edgeId
            };

            const [edge] = await connectToDB(deleteEdgeMutation, variables);

            if (!edge) {
                throw new Error('Failed to delete edge');
            }

            return edge;
        } catch (error) {
            console.error('Failed to delete edge:', error);
            throw error;
        }
    }
}

/**
 * Mock edge service implementation that simulates database operations
 */
class MockEdgeService implements EdgeService {
    // Mock edges data
    private mockEdges: any[] = [];
    private nextId = 1;

    constructor() {
        console.log('[MockEdgeService] Initialized');
    }

    async createEdge(config: QueryConfig = {}): Promise<string> {
        // Simulate API delay
        await this.delay(200);

        const edgeId = `mock-edge-${this.nextId++}`;

        const newEdge = {
            id: edgeId,
            workflow_id: config.data?.workflowId || 'mock-workflow-1',
            from_node_id: config.data?.fromNodeId || 'mock-node-1',
            to_node_id: config.data?.toNodeId || 'mock-node-2',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        this.mockEdges.push(newEdge);

        console.log(`[MockEdgeService] Created edge: ${edgeId}`);
        return edgeId;
    }

    async updateEdges(config: QueryConfig = {}): Promise<any> {
        // Simulate API delay
        await this.delay(200);

        const edgeId = config.data?.edgeId;
        if (!edgeId) {
            throw new Error('No edge ID provided for update');
        }

        const edgeIndex = this.mockEdges.findIndex(e => e.id === edgeId);

        if (edgeIndex === -1) {
            throw new Error('No edge found with the provided ID');
        }

        // Update the edge
        const updatedEdge = {
            ...this.mockEdges[edgeIndex],
            ...config.data?.set,
            updated_at: new Date().toISOString()
        };

        this.mockEdges[edgeIndex] = updatedEdge;

        console.log(`[MockEdgeService] Updated edge: ${edgeId}`);
        return updatedEdge;
    }

    async deleteEdges(config: QueryConfig = {}): Promise<any> {
        // Simulate API delay
        await this.delay(200);

        const edgeId = config.edgeId;
        if (!edgeId) {
            throw new Error('No edge ID provided for deletion');
        }

        const edgeIndex = this.mockEdges.findIndex(e => e.id === edgeId);

        if (edgeIndex === -1) {
            throw new Error('No edge found with the provided ID');
        }

        const deletedEdge = this.mockEdges[edgeIndex];
        this.mockEdges.splice(edgeIndex, 1);

        console.log(`[MockEdgeService] Deleted edge: ${edgeId}`);
        return deletedEdge;
    }

    // Helper to simulate API delays
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create and export the edge service with automatic mode switching
export const edgeService = createServiceProvider<EdgeService>(
    new RealEdgeService(),
    new MockEdgeService(),
    {
        // Default to real in production, mock in development
        defaultMode: process.env.NODE_ENV === 'production' ? 'real' : 'mock'
    }
);

// Export a hook for accessing the edge service
export function useEdgeService() {
    return edgeService;
}
