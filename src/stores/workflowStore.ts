import { create } from 'zustand';
import { addEdge } from '@xyflow/react';
import { applyEdgeChanges } from '@xyflow/react';
import { applyNodeChanges } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import { EdgeChange } from '@xyflow/react';
import { NodeChange } from '@xyflow/react';

import { AppState } from '@lib/definitions';

const initialStateNodes = [
    {
        id: 'SFS',
        type: 'initialStateNode',
        data: {
            label: 'Start from Scratch',
            background: 'white',
            color: '#1b2559'
        },
        position: { x: 0, y: 80 }
    },
    {
        id: 'SFT',
        type: 'initialStateNode',
        data: {
            label: 'Start from a Template',
            background: 'linear-gradient(to bottom right, #86FFE2, #18FFD5)',
            color: '#1b2559'
        },
        position: { x: 250, y: 0 }
    },
    {
        id: 'SFA',
        type: 'initialStateNode',
        data: {
            label: 'Start from AI Prompt',
            background: 'linear-gradient(to bottom right, #868CFF, #4318FF)',
            color: '#1b2559'
        },
        position: { x: 250, y: 160 }
    }
] as Node[];

// define the initial state
const initialState: AppState = {
    nodes: initialStateNodes,
    edges: [] as Edge[]
};

export const useStore = create<AppState>((set, get) => ({
    ...initialState,
    onNodesChange: (changes: NodeChange<Node>[]) => {
        // not sure this is needed
        set({
            nodes: applyNodeChanges(changes, get().nodes)
        });
    },
    onEdgesChange: (changes: EdgeChange<Edge>[]) => {
        // not sure this is needed
        set({
            edges: applyEdgeChanges(changes, get().edges)
        });
    },
    onConnect: (connection) => {
        set({
            edges: addEdge(connection, get().edges)
        });
    },
    setNodes: (nodes: Node[]) => {
        // will need to add node to workflow graph for db storage
        set({ nodes });
    },
    setEdges: (edges: Edge[]) => {
        // will need to add edges to workflow graph for db storage
        set({ edges });
    },
    addNode: (node: Node) => {
        // will need to add node to workflow graph for db storage
        set({
            nodes: [...get().nodes, node]
        });
    },
    fetchGraph: async (workflowId: string): Promise<Node[]> => {
        // used when needing to get a workflow graph already stored in the db
        // make a fetch to back end api to get a workflow by the id
        // will need to parse graph into singular lists of nodes and edges
        // then update zustand state
        set({
            nodes: [],
            edges: []
        });
        return [] as Node[];
    },
    reset: () => {
        set(initialState);
    }
}));
