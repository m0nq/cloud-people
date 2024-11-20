import dagre from '@dagrejs/dagre';
import { Node } from '@xyflow/react';
import { Edge } from '@xyflow/react';
import { Position } from '@xyflow/react';

import { Config } from '@config/constants';

const { WorkflowNode: { WIDTH, HEIGHT } } = Config;

// Default dimensions for SSR
const DEFAULT_CONTAINER_HEIGHT = 938;
const DEFAULT_CONTAINER_WIDTH = 1680;

// Root node position
const ROOT_NODE_X = 40; // Position from left
const ROOT_NODE_Y = DEFAULT_CONTAINER_HEIGHT * 0.40; // 35% down from top

// Spacing configuration
const ROOT_NODE_SPACING_X = 400; // Smaller horizontal distance from root to its children
const NODE_SPACING_X = 500; // Larger horizontal distance between other nodes
const NODE_SPACING_Y = 1000; // Vertical distance between siblings

export const layoutElements = (nodes: Node[], edges: Edge[]) => {
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

            // Check if parent is a root node
            const parentId = edges.find(e => e.target === nodeId)?.source;
            const isParentRoot = parentId && !edges.some(e => e.target === parentId);

            nodePositions.set(nodeId, {
                x: parentPosition.x + (isParentRoot ? ROOT_NODE_SPACING_X : NODE_SPACING_X),
                y: parentPosition.y + (siblingIndex - (totalSiblings - 1) / 2) * NODE_SPACING_Y
            });
        }
    };

    // Start positioning from root nodes (nodes with no incoming edges)
    const rootNodes = nodes.filter(node => !edges.some(e => e.target === node.id));
    rootNodes.forEach(rootNode => {
        // Position root node at the specified position
        nodePositions.set(rootNode.id, {
            x: ROOT_NODE_X,
            y: ROOT_NODE_Y
        });
    });

    // Position all nodes starting from roots
    const processLevel = (nodeIds: string[], level: number = 0) => {
        nodeIds.forEach(nodeId => {
            const parentEdge = edges.find(e => e.target === nodeId);
            const parentPosition = parentEdge
                ? nodePositions.get(parentEdge.source)
                : undefined;

            positionNode(nodeId, parentPosition);

            // Process children
            const children = parentChildMap.get(nodeId) || [];
            if (children.length > 0) {
                processLevel(children, level + 1);
            }
        });
    };

    // Start processing from root nodes
    processLevel(rootNodes.map(n => n.id));

    // Apply the calculated positions
    return {
        laidOutNodes: nodes.map(node => {
            const position = nodePositions.get(node.id) || node.position;
            return {
                ...node,
                targetPosition: Position.Left,
                sourcePosition: Position.Right,
                position: position || {
                    x: DEFAULT_CONTAINER_WIDTH / 2,
                    y: DEFAULT_CONTAINER_HEIGHT / 2
                }
            };
        }),
        laidOutEdges: edges
    };
};
