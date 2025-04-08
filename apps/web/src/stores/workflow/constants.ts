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
            position: { ...INITIAL_NODE_POSITION, x: INITIAL_NODE_POSITION.x - 600 }
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
            position: { ...INITIAL_NODE_POSITION, x: INITIAL_NODE_POSITION.x - 200 }
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
            position: { ...INITIAL_NODE_POSITION, x: INITIAL_NODE_POSITION.x + 200 }
        },
        {
            id: 'CJ',
            type: NodeType.CloudJesus,
            data: {
                id: 'CJ',
                label: 'Cloud Jesus',
                background: isDarkMode ? '#1E2A3B' : '#FFFFFF',
                color: isDarkMode ? 'white' : '#0f172a',
                iconColor: '#e879f9', // fuchsia-400
                description: 'Hello my child, let\'s talk about what you\'d like to build',
                type: NodeType.CloudJesus,
                workflowId: '',
                agentRef: {
                    agentId: ''
                }
            },
            position: { ...INITIAL_NODE_POSITION, x: INITIAL_NODE_POSITION.x + 600 }
        }
    ] as Node<InitialStateNodeData>[];
};

export const INITIAL_STATE_NODE: Node<InitialStateNodeData> = {
    id: 'initial-state',
    type: NodeType.Initial,
    data: {
        id: 'initial-state',
        type: NodeType.Initial,
        label: 'Initial State',
        background: '#000',
        color: '#fff',
        iconColor: '#fff'
    } as InitialStateNodeData,
    position: { x: 0, y: 0 }
};

// For backward compatibility
export const initialStateNodes = getInitialStateNodes();

export const getInitialState = (): GraphState => ({
    nodes: getInitialStateNodes(),
    edges: [],
    workflowExecution: null
});

export const initialState: GraphState = getInitialState();
