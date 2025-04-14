/**
 * Canvas Service Provider
 *
 * This module provides real and mock implementations for canvas operations.
 */

import { createServiceProvider } from '.';
import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';
import type { QueryConfig } from '@app-types/api';
import { type Edge } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import { Position } from '@xyflow/react';
import { NodeType } from '@app-types/workflow/node-types';
import { EdgeType } from '@app-types/workflow/node-types';
import type { NodeData } from '@app-types/workflow';
import type { EdgeData } from '@app-types/workflow';

// Define the interface for our canvas service
export interface CanvasService {
    fetchWorkflowNodes(config?: QueryConfig): Promise<Node<NodeData>[]>;

    fetchWorkflowEdges(config?: QueryConfig): Promise<Edge<EdgeData>[]>;
}

/**
 * Real canvas service implementation that connects to the database
 */
class RealCanvasService implements CanvasService {
    async fetchWorkflowNodes(config: QueryConfig = {}): Promise<Node<NodeData>[]> {
        const user = await authCheck();

        const fetchNodesQuery = `
      query FetchWorkflowNodes($workflowId: UUID!) {
        collection: nodesCollection(filter: { workflow_id: { eq: $workflowId } }) {
          records: edges {
            node {
              id
              workflow_id
              node_type
              parent_id
              agent_id
              state
              current_step
              created_at
              updated_at
            }
          }
        }
      }
    `;

        try {
            const variables = {
                workflowId: config.workflowId
            };

            const nodes = await connectToDB(fetchNodesQuery, variables);

            return nodes.map((record: any) => ({
                id: record.node.id,
                type: record.node.node_type,
                position: { x: 0, y: 0 }, // Position is set by the UI
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
                data: {
                    id: record.node.id,
                    type: record.node.node_type as NodeType,
                    workflowId: record.node.workflow_id,
                    agentRef: {
                        agentId: record.node.agent_id || 'default-agent'
                    },
                    state: record.node.state
                }
            })) as Node<NodeData>[];
        } catch (error) {
            console.error('Failed to fetch workflow nodes:', error);
            throw error;
        }
    }

    async fetchWorkflowEdges(config: QueryConfig = {}): Promise<Edge<EdgeData>[]> {
        const user = await authCheck();

        const fetchEdgesQuery = `
      query FetchWorkflowEdges($workflowId: UUID!) {
        collection: edgesCollection(filter: { workflow_id: { eq: $workflowId } }) {
          records: edges {
            edge: node {
              id
              workflow_id
              from_node_id
              to_node_id
              created_at
              updated_at
            }
          }
        }
      }
    `;

        try {
            const variables = {
                workflowId: config.workflowId
            };

            const edges = await connectToDB(fetchEdgesQuery, variables);

            return edges.map((record: any) => ({
                id: record.edge.id,
                source: record.edge.from_node_id,
                target: record.edge.to_node_id,
                type: EdgeType.Automation,
                animated: true,
                data: {
                    id: record.edge.id,
                    workflowId: record.edge.workflow_id,
                    fromNodeId: record.edge.from_node_id,
                    toNodeId: record.edge.to_node_id
                }
            })) as Edge<EdgeData>[];
        } catch (error) {
            console.error('Failed to fetch workflow edges:', error);
            throw error;
        }
    }
}

/**
 * Mock canvas service implementation that simulates database operations
 */
class MockCanvasService implements CanvasService {
    // Mock nodes and edges data
    private mockNodes: any[] = [
        {
            id: 'mock-node-1',
            workflow_id: 'mock-workflow-1',
            node_type: 'root',
            parent_id: null,
            agent_id: null,
            state: 'initial',
            current_step: '0',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    private mockEdges: any[] = [];

    constructor() {
        console.log('[MockCanvasService] Initialized');
    }

    async fetchWorkflowNodes(config: QueryConfig = {}): Promise<Node<NodeData>[]> {
        // Simulate API delay
        await this.delay(200);

        const workflowId = config.workflowId || 'mock-workflow-1';
        const filteredNodes = this.mockNodes.filter(n => n.workflow_id === workflowId);

        console.log(`[MockCanvasService] Fetched ${filteredNodes.length} nodes for workflow: ${workflowId}`);

        return filteredNodes.map(node => ({
            id: node.id,
            type: node.node_type,
            position: { x: 0, y: 0 }, // Position is set by the UI
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            data: {
                id: node.id,
                type: node.node_type as NodeType,
                workflowId: node.workflow_id,
                agentRef: {
                    agentId: node.agent_id || 'default-agent'
                },
                state: node.state
            }
        })) as Node<NodeData>[];
    }

    async fetchWorkflowEdges(config: QueryConfig = {}): Promise<Edge<EdgeData>[]> {
        // Simulate API delay
        await this.delay(200);

        const workflowId = config.workflowId || 'mock-workflow-1';
        const filteredEdges = this.mockEdges.filter(e => e.workflow_id === workflowId);

        console.log(`[MockCanvasService] Fetched ${filteredEdges.length} edges for workflow: ${workflowId}`);

        return filteredEdges.map(edge => ({
            id: edge.id,
            source: edge.from_node_id,
            target: edge.to_node_id,
            type: EdgeType.Automation,
            animated: true,
            data: {
                id: edge.id,
                workflowId: edge.workflow_id,
                fromNodeId: edge.from_node_id,
                toNodeId: edge.to_node_id
            }
        })) as Edge<EdgeData>[];
    }

    // Helper to simulate API delays
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create and export the canvas service with automatic mode switching
export const canvasService = createServiceProvider<CanvasService>(
    new RealCanvasService(),
    new MockCanvasService(),
    {
        // Default to real in production, mock in development
        defaultMode: process.env.NODE_ENV === 'production' ? 'real' : 'mock'
    }
);

// Export a hook for accessing the canvas service
export function useCanvasService() {
    return canvasService;
}
