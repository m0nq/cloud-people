//'use server';
import { Position } from '@xyflow/react';
import { XYPosition } from '@xyflow/react';
import { Node } from '@xyflow/react';
import { nanoid } from 'nanoid';

//const initialNodes = [
//    {
//        id: '1',
//        position: { x: 500, y: 100 },
//        data: { label: '1' },
//        type: 'automationNode'
//    },
//    {
//        id: '2',
//        position: { x: 900, y: 300 },
//        data: { label: '1' },
//        type: 'automationNode'
//    }
//     {
//         id: '3',
//         position: { x: 0, y: 200 },
//         data: { label: '3' }
//     }
//];

//const initialEdges = [{ id: 'e1-2', source: '1', target: '2', type: 'automationEdge' }];

const initialNodes = [
    {
        id: 'horizontal-1',
        sourcePosition: Position.Right,
        type: 'automationNode',
        data: { label: 'Input' },
        position: { x: 0, y: 80 }
    },
    {
        id: 'horizontal-2',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: 'automationNode',
        data: { label: 'A Node' },
        position: { x: 250, y: 0 }
    },
    {
        id: 'horizontal-3',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: 'automationNode',
        data: { label: 'Node 3' },
        position: { x: 250, y: 160 }
    },
    {
        id: 'horizontal-4',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: 'automationNode',
        data: { label: 'Node 4' },
        position: { x: 500, y: 0 }
    },
    {
        id: 'horizontal-5',
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
        type: 'automationNode',
        data: { label: 'Node 5' },
        position: { x: 500, y: 100 }
    },
    {
        id: 'horizontal-6',
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        type: 'automationNode',
        data: { label: 'Node 6' },
        position: { x: 500, y: 230 }
    },
    {
        id: 'horizontal-7',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: 'automationNode',
        data: { label: 'Node 7' },
        position: { x: 750, y: 50 }
    },
    {
        id: 'horizontal-8',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: 'automationNode',
        data: { label: 'Node 8' },
        position: { x: 750, y: 300 }
    }
];

const initialEdges = [
    {
        id: 'horizontal-e1-2',
        source: 'horizontal-1',
        type: 'automationEdge',
        target: 'horizontal-2',
        animated: true
    },
    {
        id: 'horizontal-e1-3',
        source: 'horizontal-1',
        type: 'automationEdge',
        target: 'horizontal-3',
        animated: true
    },
    {
        id: 'horizontal-e1-4',
        source: 'horizontal-2',
        type: 'automationEdge',
        target: 'horizontal-4',
        animated: true
    },
    {
        id: 'horizontal-e3-5',
        source: 'horizontal-3',
        type: 'automationEdge',
        target: 'horizontal-5',
        animated: true
    },
    {
        id: 'horizontal-e3-6',
        source: 'horizontal-3',
        type: 'automationEdge',
        target: 'horizontal-6',
        animated: true
    },
    {
        id: 'horizontal-e5-7',
        source: 'horizontal-5',
        type: 'automationEdge',
        target: 'horizontal-7',
        animated: true
    },
    {
        id: 'horizontal-e6-8',
        source: 'horizontal-6',
        type: 'automationEdge',
        target: 'horizontal-8',
        animated: false
    }
];

// These will in turn use the supabase actions
export const fetchWorkflowNodes = () => {
    // Get user id of signed in user
    // Get list of workflows by user id
    // Return all nodes for a selected workflow
    return initialNodes;
};

export const fetchWorkflowEdges = () => {
    // Get user id of signed in user
    // Get list of workflows by user id
    // Return all edges for a selected workflow
    return initialEdges;
};

export const fetchNode = (id: string) => {};

export const addNewNode = (parentNode: Node, position: XYPosition) => {
    const newNode = {
        id: nanoid(),
        type: 'automationNode',
        data: { label: 'New Node' },
        position,
        parentNode: parentNode.id
    };

    const newEdge = {
        id: nanoid(),
        source: parentNode.id,
        target: newNode.id
    };

    // Update current list of nodes for the signed in user
};

export const removeNode = (id: string) => {};

export const updateNode = (node: Node, id: string) => {};
