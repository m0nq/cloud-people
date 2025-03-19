import { type Node } from '@xyflow/react';

import { INITIAL_NODE_POSITION } from '@config/layout.const';
import type { GraphState } from '@app-types/workflow';
import { InitialStateNodeData } from '@app-types/workflow';
import { NodeType } from '@app-types/workflow/node-types';

export const initialStateNodes = [
    {
        id: 'SFS',
        type: NodeType.Initial,
        data: {
            id: 'SFS',
            label: 'From Scratch',
            background: '#1E2A3B',
            color: 'white',
            iconBackground: '#16653d4d', // green-900 with 30% opacity
            iconColor: '#4ade80', // green-400
            description: 'Build your flow from scratch with complete creative freedom.',
            type: NodeType.Initial
        },
        position: INITIAL_NODE_POSITION
    },
    {
        id: 'SFT',
        type: NodeType.Initial,
        data: {
            id: 'SFT',
            label: 'From Template',
            background: '#1E2A3B',
            color: 'white',
            iconBackground: '#581c874d', // purple-900 with 30% opacity
            iconColor: '#c084fc', // purple-400
            description: 'Start with a pre-built template to save time.',
            type: NodeType.Initial
        },
        position: INITIAL_NODE_POSITION
    },
    {
        id: 'SFA',
        type: NodeType.Initial,
        data: {
            id: 'SFA',
            label: 'From AI',
            background: '#1E2A3B',
            color: 'white',
            iconBackground: '#1e3a8a4d', // blue-900 with 30% opacity
            iconColor: '#60a5fa', // blue-400
            description: 'Let AI help you build your workflow.',
            type: NodeType.Initial
        },
        position: INITIAL_NODE_POSITION
    }
] as Node<InitialStateNodeData>[];

export const initialState: GraphState = {
    nodes: initialStateNodes,
    edges: [],
    workflowExecution: null
};
