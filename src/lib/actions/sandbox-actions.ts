//'use server';
import { Position } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { Config } from '@config/constants';

const { WorkflowNode } = Config;

// these are hardcoded nodes to be replaced with nodes from the db
const position = { x: 50, y: 100 };
const agentNodes = [
    {
        id: 'horizontal-1',
        sourcePosition: Position.Right,
        type: WorkflowNode.AgentNode,
        data: { label: 'Node 1' },
        position
    },
    {
        id: 'horizontal-2',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: WorkflowNode.AgentNode,
        data: { label: 'Node 2' },
        position
    },
    {
        id: 'horizontal-3',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: WorkflowNode.AgentNode,
        data: { label: 'Node 3' },
        position
    },
    {
        id: 'horizontal-4',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: WorkflowNode.AgentNode,
        data: { label: 'Node 4' },
        position
    },
    {
        id: 'horizontal-5',
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
        type: WorkflowNode.AgentNode,
        data: { label: 'Node 5' },
        position
    },
    {
        id: 'horizontal-6',
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        type: WorkflowNode.AgentNode,
        data: { label: 'Node 6' },
        position
    },
    {
        id: 'horizontal-7',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: WorkflowNode.AgentNode,
        data: { label: 'Node 7' },
        position
    },
    {
        id: 'horizontal-8',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: WorkflowNode.AgentNode,
        data: { label: 'Node 8' },
        position
    }
] as Node[];

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
] as Edge[];

// These will in turn use the supabase actions
export const fetchWorkflowNodes = (): Node[] => {
    // Get user id of signed in user
    // Get list of workflows by user id
    // Return all nodes for a selected workflow
    return agentNodes;
};

export const fetchWorkflowEdges = (): Edge[] => {
    // Get user id of signed in user
    // Get list of workflows by user id
    // Return all edges for a selected workflow
    return automationEdges;
};
