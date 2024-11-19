import dagre from '@dagrejs/dagre';
import { Node } from '@xyflow/react';
import { Edge } from '@xyflow/react';
import { Position } from '@xyflow/react';

import { Config } from '@config/constants';

const { WorkflowNode: { WIDTH, HEIGHT } } = Config;

// Default dimensions for SSR
const DEFAULT_CONTAINER_HEIGHT = 800;
const DEFAULT_CONTAINER_WIDTH = 1200;

export const layoutElements = (nodes: Node[], edges: Edge[]) => {
    const isInitialNodes = nodes.every(node => node?.type?.includes('initial'));
    const direction = isInitialNodes ? 'TB' : 'LR';

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setGraph({});
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach(node => {
        dagreGraph.setNode(node.id, { width: node.width || WIDTH, height: node.height || HEIGHT });
    });

    edges.forEach(edge => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph, { marginx: 50 });

    // Calculate the bounds of the graph
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    nodes.forEach(node => {
        const { x, y } = dagreGraph.node(node.id);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    });

    // Calculate vertical offset to center the graph
    const yMultiplier = isInitialNodes ? 1.2 : 1.5;
    const graphHeight = (maxY - minY) * yMultiplier;
    const containerHeight = typeof window !== 'undefined' ? window.innerHeight : DEFAULT_CONTAINER_HEIGHT;
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : DEFAULT_CONTAINER_WIDTH;
    // Increased upward bias to 25%
    const yOffset = ((containerHeight - graphHeight) / 2) - containerHeight * 0.25;

    // Calculate horizontal centering for initial nodes
    const xMultiplier = 1.2;
    const graphWidth = (maxX - minX) * xMultiplier;
    // Reduce the offset further by dividing by 6 instead of 4
    const xOffset = isInitialNodes ? (containerWidth - graphWidth) / 6 : 0;

    const laidOutNodes = nodes.map(node => {
        const { x, y } = dagreGraph.node(node.id);

        return {
            ...node,
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
            position: {
                x: x * xMultiplier + (isInitialNodes ? xOffset : 0),
                y: y * yMultiplier + yOffset
            }
        };
    });

    return { laidOutNodes, laidOutEdges: edges };
};
