import * as dagre from '@dagrejs/dagre';
import { Position } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';

import { Config } from '@config/constants';
import { DEFAULT_CONTAINER_HEIGHT } from '@config/layout.const';
import { DEFAULT_CONTAINER_WIDTH } from '@config/layout.const';
import { ROOT_NODE_X } from '@config/layout.const';
import { ROOT_NODE_Y } from '@config/layout.const';
import { NODE_SPACING_X } from '@config/layout.const';
import { NODE_SPACING_Y } from '@config/layout.const';
import type { NodeData } from '@app-types/workflow';

const { WorkflowNode: { WIDTH, HEIGHT } } = Config;

export const layoutElements = (nodes: Node<NodeData>[], edges: Edge[]) => {
    const isInitialNodes = nodes.every(node => node?.type?.includes('initial'));

    // For initial nodes setup, use the original dagre layout
    if (isInitialNodes) {
        const direction = 'TB';
        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setGraph({ rankdir: direction });
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        nodes.forEach(node => {
            dagreGraph.setNode(node.id, { width: node.width || WIDTH, height: node.height || HEIGHT });
        });

        edges.forEach(edge => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        const containerHeight = typeof window !== 'undefined' ? window.innerHeight : DEFAULT_CONTAINER_HEIGHT;
        const containerWidth = typeof window !== 'undefined' ? window.innerWidth : DEFAULT_CONTAINER_WIDTH;

        return {
            laidOutNodes: nodes.map(node => {
                const { x, y } = dagreGraph.node(node.id);
                return {
                    ...node,
                    targetPosition: Position.Left,
                    sourcePosition: Position.Right,
                    position: {
                        x: x + containerWidth / 4.5,
                        y: y + containerHeight / 3
                    }
                };
            }),
            laidOutEdges: edges
        };
    }

    // For workflow nodes, identify which nodes are new (don't have positions)
    const newNodes = nodes.filter(node => !node.position);
    const existingNodes = nodes.filter(node => node.position);

    // If there are no new nodes, return all nodes unchanged
    if (newNodes.length === 0) {
        return {
            laidOutNodes: nodes.map(node => ({
                ...node,
                targetPosition: Position.Left,
                sourcePosition: Position.Right
            })),
            laidOutEdges: edges
        };
    }

    // Build parent-child relationships once
    const parentChildMap = new Map<string, string[]>();
    const nodePositions = new Map<string, { x: number; y: number }>();

    // First pass: build the parent-child map
    edges.forEach(edge => {
        if (!parentChildMap.has(edge.source)) {
            parentChildMap.set(edge.source, []);
        }
        parentChildMap.get(edge.source)!.push(edge.target);
    });

    // Second pass: position nodes level by level
    const positionNode = (nodeId: string, parentPosition?: { x: number; y: number }) => {
        // Skip if already positioned
        if (nodePositions.has(nodeId)) return;

        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        // If node has a position, use it
        if (node.position) {
            nodePositions.set(nodeId, node.position);
            return;
        }

        // Get parent's position
        if (parentPosition) {
            const siblings = parentChildMap.get(edges.find(e => e.target === nodeId)?.source || '') || [];
            const siblingIndex = siblings.indexOf(nodeId);
            const totalSiblings = siblings.length;

            // Calculate new position based on parent's position
            const newPosition = {
                x: parentPosition.x + NODE_SPACING_X,
                y: parentPosition.y + (siblingIndex === 0 ? 0  /* First child aligns with parent */ : (siblingIndex - Math.ceil(totalSiblings / 2)) * NODE_SPACING_Y /* Distribute other siblings around first child */)
            };

            nodePositions.set(nodeId, newPosition);
        } else {
            // Root node position
            nodePositions.set(nodeId, { x: ROOT_NODE_X, y: ROOT_NODE_Y });
        }

        // Position children
        const children = parentChildMap.get(nodeId) || [];
        children.forEach(childId => {
            positionNode(childId, nodePositions.get(nodeId));
        });
    };

    // Start positioning from root nodes (nodes with no incoming edges)
    const rootNodes = nodes.filter(node => !edges.some(edge => edge.target === node.id));

    rootNodes.forEach(node => positionNode(node.id));

    // Return nodes with their new positions
    return {
        laidOutNodes: nodes.map(node => ({
            ...node,
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
            position: nodePositions.get(node.id) || node.position || { x: 0, y: 0 }
        })) as Node<NodeData>[],
        laidOutEdges: edges
    };
};
