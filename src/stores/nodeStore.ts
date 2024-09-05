import { create } from 'zustand';
import { addEdge } from '@xyflow/react';
import { applyEdgeChanges } from '@xyflow/react';
import { applyNodeChanges } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { type Node } from '@xyflow/react';

import { AppState } from '@lib/definitions';

const initialNodes = [
    {
        id: 'SFS',
        type: 'initialStateNode',
        data: {
            label: 'Start from Scratch',
            styles: 'bg-white text-[#1b2559]'
        },
        position: { x: 0, y: 80 }
    },
    {
        id: 'SFT',
        type: 'initialStateNode',
        data: {
            label: 'Start from a Template',
            styles: 'bg-[linear-gradient(to_bottom_right,#86FFE2,#18FFD5)] text-[#1b2559]'
        },
        position: { x: 250, y: 0 }
    },
    {
        id: 'SFA',
        type: 'initialStateNode',
        data: {
            label: 'Start from AI Prompt',
            styles: 'bg-[linear-gradient(to_bottom_right,#868CFF,#4318FF)] text-white'
        },
        position: { x: 250, y: 160 }
    }
] as Node[];

export const useStore = create<AppState>((set, get) => ({
    nodes: initialNodes,
    edges: [] as Edge[],
    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes)
        });
    },
    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges)
        });
    },
    onConnect: (connection) => {
        set({
            edges: addEdge(connection, get().edges)
        });
    },
    setNodes: (nodes) => {
        set({ nodes });
    },
    setEdges: (edges) => {
        set({ edges });
    }
}));
