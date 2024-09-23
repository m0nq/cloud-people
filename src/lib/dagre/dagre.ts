import dagre from '@dagrejs/dagre';
import { Node } from '@xyflow/react';
import { Edge } from '@xyflow/react';
import { Position } from '@xyflow/react';

const nodeWidth = 288;
const nodeHeight = 224;

export const layoutElements = (nodes: Node[], edges: Edge[]) => {
    const isInitialNodes = nodes.every(node => node?.type?.includes('initial'));
    const direction = isInitialNodes ? 'TB' : 'LR';

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setGraph({});
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach(node => {
        dagreGraph.setNode(node.id, { width: node.width || nodeWidth, height: node.height || nodeHeight });
    });

    edges.forEach(edge => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph, { marginx: 100 });

    const laidOutNodes = nodes.map(node => {
        const { x, y } = dagreGraph.node(node.id);

        return {
            ...node,
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
            position: {
                x: x * 1.5,
                y: isInitialNodes && y * 3 || y
            }
        };
    });

    return { laidOutNodes, laidOutEdges: edges };
};
