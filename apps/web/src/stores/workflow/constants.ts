import { type Node } from '@xyflow/react';

import { INITIAL_NODE_POSITION } from '@config/layout.const';
import { type GraphState } from './types';
import { Config } from '@config/constants';
import { InitialStateNodeData } from '@app-types/workflow';

const { WorkflowNode } = Config;

export const initialStateNodes = [
    {
        id: 'SFS',
        type: WorkflowNode.InitialStateNode,
        data: {
            id: 'SFS',
            label: 'Start from Scratch',
            background: 'white',
            color: '#1b2559'
        },
        position: INITIAL_NODE_POSITION
    },
    {
        id: 'SFT',
        type: WorkflowNode.InitialStateNode,
        data: {
            id: 'SFT',
            label: 'Start from a Template',
            background: 'linear-gradient(to bottom right, #86FFE2, #18FFD5)',
            color: '#1b2559'
        },
        position: INITIAL_NODE_POSITION
    },
    {
        id: 'SFA',
        type: WorkflowNode.InitialStateNode,
        data: {
            id: 'SFA',
            label: 'Start from AI Prompt',
            background: 'linear-gradient(to bottom right, #868CFF, #4318FF)',
            color: '#1b2559'
        },
        position: INITIAL_NODE_POSITION
    }
] as Node<InitialStateNodeData>[];

export const initialState: GraphState = {
    nodes: initialStateNodes,
    edges: [],
    workflowExecution: null
};
