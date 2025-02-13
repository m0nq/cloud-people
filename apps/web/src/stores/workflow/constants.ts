import { type Node } from '@xyflow/react';

import { INITIAL_NODE_POSITION } from '@config/layout.const';
import { type GraphState } from './types';
import { InitialStateNodeData } from '@app-types/workflow';
import { NodeType } from '@app-types/workflow/node-types';

export const initialStateNodes = [
    {
        id: 'SFS',
        type: NodeType.Initial,
        data: {
            id: 'SFS',
            label: 'Start from Scratch',
            background: 'white',
            color: '#1b2559',
            type: NodeType.Initial
        },
        position: INITIAL_NODE_POSITION
    },
    {
        id: 'SFT',
        type: NodeType.Initial,
        data: {
            id: 'SFT',
            label: 'Start from a Template',
            background: 'linear-gradient(to bottom right, #86FFE2, #18FFD5)',
            color: '#1b2559',
            type: NodeType.Initial
        },
        position: INITIAL_NODE_POSITION
    },
    {
        id: 'SFA',
        type: NodeType.Initial,
        data: {
            id: 'SFA',
            label: 'Start from AI Prompt',
            background: 'linear-gradient(to bottom right, #868CFF, #4318FF)',
            color: '#1b2559',
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
