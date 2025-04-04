import { type Node } from '@xyflow/react';

import { INITIAL_NODE_POSITION } from '@config/layout.const';
import type { GraphState } from '@app-types/workflow';
import { InitialStateNodeData } from '@app-types/workflow';
import { NodeType } from '@app-types/workflow/node-types';
import { useThemeStore } from '@stores/theme-store';

export const getInitialStateNodes = (): Node<InitialStateNodeData>[] => {
    const isDarkMode = useThemeStore.getState().isDarkMode;

    return [
        {
            id: 'SFS',
            type: NodeType.Initial,
            data: {
                id: 'SFS',
                label: 'From Scratch',
                background: isDarkMode ? '#1E2A3B' : '#FFFFFF',
                color: isDarkMode ? 'white' : '#0f172a',
                iconBackground: isDarkMode ? '#16653d4d' : '#dcfce74d', // green with opacity
                iconColor: '#4ade80', // green-400
                description: 'Build your flow from scratch with complete creative freedom.',
                type: NodeType.Initial,
                workflowId: '',
                agentRef: {
                    agentId: ''
                }
            },
            position: INITIAL_NODE_POSITION
        },
        {
            id: 'SFT',
            type: NodeType.Initial,
            data: {
                id: 'SFT',
                label: 'From Template',
                background: isDarkMode ? '#1E2A3B' : '#FFFFFF',
                color: isDarkMode ? 'white' : '#0f172a',
                iconBackground: isDarkMode ? '#581c874d' : '#f3e8ff4d', // purple with opacity
                iconColor: '#c084fc', // purple-400
                description: 'Start with a pre-built template to save time.',
                type: NodeType.Initial,
                workflowId: '',
                agentRef: {
                    agentId: ''
                }
            },
            position: INITIAL_NODE_POSITION
        },
        {
            id: 'SFA',
            type: NodeType.Initial,
            data: {
                id: 'SFA',
                label: 'From AI',
                background: isDarkMode ? '#1E2A3B' : '#FFFFFF',
                color: isDarkMode ? 'white' : '#0f172a',
                iconBackground: isDarkMode ? '#1e3a8a4d' : '#dbeafe4d', // blue with opacity
                iconColor: '#60a5fa', // blue-400
                description: 'Let AI help you build your workflow.',
                type: NodeType.Initial,
                workflowId: '',
                agentRef: {
                    agentId: ''
                }
            },
            position: INITIAL_NODE_POSITION
        }
    ] as Node<InitialStateNodeData>[];
};

// For backward compatibility
export const initialStateNodes = getInitialStateNodes();

export const getInitialState = (): GraphState => ({
    nodes: getInitialStateNodes(),
    edges: [],
    workflowExecution: null
});

export const initialState: GraphState = getInitialState();
