//'use server';
import { Position } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';

import { Config } from '@config/constants';
import type { NodeData } from '@app-types/workflow';
import type { EdgeData } from '@app-types/workflow';
import { NodeType } from '@app-types/workflow/node-types';
import { EdgeType } from '@app-types/workflow/node-types';

const { WorkflowNode } = Config;

// these are hardcoded nodes to be replaced with nodes from the db
const position = { x: 50, y: 100 };
const agentNodes = [
    {
        id: 'horizontal-1',
        sourcePosition: Position.Right,
        type: NodeType.Agent,
        position,
        data: {
            id: 'horizontal-1',
            type: NodeType.Agent
        }
    },
    {
        id: 'horizontal-2',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: NodeType.Agent,
        data: {
            id: 'horizontal-1',
            type: NodeType.Agent
        },
        position
    },
    {
        id: 'horizontal-3',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: NodeType.Agent,
        data: {
            id: 'horizontal-1',
            type: NodeType.Agent
        },
        position
    },
    {
        id: 'horizontal-4',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: NodeType.Agent,
        data: {
            id: 'horizontal-1',
            type: NodeType.Agent
        },
        position
    },
    {
        id: 'horizontal-5',
        targetPosition: Position.Left,
        type: NodeType.Agent,
        data: {
            id: 'horizontal-1',
            type: NodeType.Agent
        },
        position
    }
];

const initialNodes = [
    {
        id: 'SFS',
        type: NodeType.Initial,
        position: { x: 0, y: 0 },
        data: {
            id: 'SFS',
            label: 'Start from Scratch',
            background: 'linear-gradient(89deg, #5F42F1 14.21%, #502DFF 101.01%)',
            color: '#ffffff'
        }
    },
    {
        id: 'SFT',
        type: NodeType.Initial,
        position: { x: 0, y: 100 },
        data: {
            id: 'SFT',
            label: 'Start from Template',
            background: '#ffffff',
            color: '#000000'
        }
    },
    {
        id: 'SFA',
        type: NodeType.Initial,
        position: { x: 0, y: 200 },
        data: {
            id: 'SFA',
            label: 'Start from AI',
            background: '#ffffff',
            color: '#000000'
        }
    }
];

const rootNode = {
    id: 'root',
    type: NodeType.Root,
    position: { x: 300, y: 100 },
    data: {
        id: 'root',
        type: NodeType.Root
    }
};

const approvalNode = {
    id: 'approval-1',
    type: NodeType.Approval,
    position: { x: 600, y: 100 },
    data: {
        id: 'approval-1',
        type: NodeType.Approval,
        name: 'Archimedes',
        role: 'Product Manager'
    }
};

const deliveryNode = {
    id: 'delivery-1',
    type: NodeType.Delivery,
    position: { x: 900, y: 100 },
    data: {
        id: 'delivery-1',
        type: NodeType.Delivery
    }
};

const edges = [
    {
        id: 'edge-1',
        source: 'root',
        target: 'approval-1',
        type: EdgeType.Automation
    },
    {
        id: 'edge-2',
        source: 'approval-1',
        target: 'delivery-1',
        type: EdgeType.Automation
    }
];

// These will in turn use the supabase actions
export function fetchWorkflowNodes(): Node<NodeData>[] {
    // return initialNodes;
    return [rootNode, approvalNode, deliveryNode];
}

export function fetchWorkflowEdges(): Edge<EdgeData>[] {
    return edges;
}
