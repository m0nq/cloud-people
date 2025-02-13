//'use server';
import { Position } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';

import { Config } from '@config/constants';
import type { NodeData } from '@app-types/workflow';
import type { EdgeData } from '@app-types/workflow';

const { WorkflowNode } = Config;

// these are hardcoded nodes to be replaced with nodes from the db
const position = { x: 50, y: 100 };
const agentNodes = [
    {
        id: 'horizontal-1',
        sourcePosition: Position.Right,
        type: WorkflowNode.AgentNode,
        position,
        data: {
            id: 'horizontal-1',
            type: WorkflowNode.AgentNode,
        }
    },
    {
        id: 'horizontal-2',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: WorkflowNode.AgentNode,
        data: {
            id: 'horizontal-1',
            type: WorkflowNode.AgentNode,
        },
        position
    },
    {
        id: 'horizontal-3',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: WorkflowNode.AgentNode,
        data: {
            id: 'horizontal-1',
            type: WorkflowNode.AgentNode,
        },
        position
    },
    {
        id: 'horizontal-4',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: WorkflowNode.AgentNode,
        data: {
            id: 'horizontal-1',
            type: WorkflowNode.AgentNode,
        },
        position
    },
    {
        id: 'horizontal-5',
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
        type: WorkflowNode.AgentNode,
        data: {
            id: 'horizontal-1',
            type: WorkflowNode.AgentNode,
        },
        position
    },
    {
        id: 'horizontal-6',
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        type: WorkflowNode.AgentNode,
        data: {
            id: 'horizontal-1',
            type: WorkflowNode.AgentNode,
        },
        position
    },
    {
        id: 'horizontal-7',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: WorkflowNode.AgentNode,
        data: {
            id: 'horizontal-1',
            type: WorkflowNode.AgentNode,
        },
        position
    },
    {
        id: 'horizontal-8',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: WorkflowNode.AgentNode,
        data: {
            id: 'horizontal-1',
            type: WorkflowNode.AgentNode,
        },
        position
    }
] as Node<NodeData>[];

// these are hardcoded edges to be replaced with nodes from the db
const automationEdges = [
    {
        id: 'horizontal-e1-2',
        source: 'horizontal-1',
        target: 'horizontal-2',
        type: WorkflowNode.AutomationEdge,
        animated: true
    },
    {
        id: 'horizontal-e1-3',
        source: 'horizontal-1',
        target: 'horizontal-3',
        type: WorkflowNode.AutomationEdge,
        animated: true
    },
    {
        id: 'horizontal-e2-4',
        source: 'horizontal-2',
        target: 'horizontal-4',
        type: WorkflowNode.AutomationEdge,
        animated: true
    },
    {
        id: 'horizontal-e3-5',
        source: 'horizontal-3',
        target: 'horizontal-5',
        type: WorkflowNode.AutomationEdge,
        animated: true
    },
    {
        id: 'horizontal-e3-6',
        source: 'horizontal-3',
        target: 'horizontal-6',
        type: WorkflowNode.AutomationEdge,
        animated: true
    },
    {
        id: 'horizontal-e5-7',
        source: 'horizontal-5',
        target: 'horizontal-7',
        type: WorkflowNode.AutomationEdge,
        animated: true
    },
    {
        id: 'horizontal-e6-8',
        source: 'horizontal-6',
        target: 'horizontal-8',
        type: WorkflowNode.AutomationEdge,
        animated: false
    }
] as Edge<EdgeData>[];

// These will in turn use the supabase actions
export const fetchWorkflowNodes = (): Node<NodeData>[] => {
    // Get user id of signed in user
    // Get list of workflows by user id
    // Return all nodes for a selected workflow
    return agentNodes;
};

export const fetchWorkflowEdges = (): Edge<EdgeData>[] => {
    // Get user id of signed in user
    // Get list of workflows by user id
    // Return all edges for a selected workflow
    return automationEdges;
};
