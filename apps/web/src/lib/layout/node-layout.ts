import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { getConnectedEdges } from '@xyflow/react';

import { Config } from '@config/constants';
import { NODE_SPACING_X } from '@config/layout.const';
import { NODE_SPACING_Y } from '@config/layout.const';
import { NodeType } from '@app-types/workflow/node-types';

const { WorkflowNode } = Config;

type NodePosition = {
    id: string;
    position: { x: number; y: number };
};

export const calculateNodePositions = (
    parentNode: Node,
    siblings: string[],
    edges: Edge[]
): NodePosition[] => {
    const isRootNode = parentNode.type === NodeType.Root;
    const xOffset = isRootNode ? NODE_SPACING_X : NODE_SPACING_X;
    const nodeHeight = WorkflowNode.HEIGHT;
    const verticalSpacing = Math.max(nodeHeight * 0.8, NODE_SPACING_Y);
    const baseY = parentNode.position.y;

    // For first child, align horizontally with parent
    if (siblings.length === 0) {
        return [{
            id: 'new-node',
            position: {
                x: parentNode.position.x + xOffset,
                y: baseY
            }
        }];
    }

    const allNodePositions: NodePosition[] = [];
    const firstChild = siblings[0];
    const remainingSiblings = siblings.slice(1);

    // Keep first child aligned with parent
    allNodePositions.push({
        id: firstChild,
        position: {
            x: parentNode.position.x + xOffset,
            y: baseY
        }
    });

    // Calculate spacing multiplier that decreases with more nodes
    const getSpacingMultiplier = (index: number) => {
        return Math.max(0.4, 1 - index * 0.15);
    };

    // Position remaining siblings alternating above/below
    remainingSiblings.forEach((siblingId, index) => {
        const isAbove = index % 2 === 0;
        const offset = Math.ceil((index + 1) / 2) * verticalSpacing * getSpacingMultiplier(index);

        allNodePositions.push({
            id: siblingId,
            position: {
                x: parentNode.position.x + xOffset,
                y: baseY + (isAbove ? -offset : offset)
            }
        });
    });

    // Position new node
    const isAbove = remainingSiblings.length % 2 === 0;
    const offset = Math.ceil((remainingSiblings.length + 1) / 2) *
        verticalSpacing *
        getSpacingMultiplier(remainingSiblings.length);

    allNodePositions.push({
        id: 'new-node',
        position: {
            x: parentNode.position.x + xOffset,
            y: baseY + (isAbove ? -offset : offset)
        }
    });

    return allNodePositions;
};

export const getSiblings = (parentNode: Node, edges: Edge[]): string[] => {
    return getConnectedEdges([parentNode], edges)
        .map(e => e.target)
        .filter(nodeId => edges.some(e => e.source === parentNode.id && e.target === nodeId));
};
