import { create } from 'zustand';
import { addEdge } from '@xyflow/react';
import { applyEdgeChanges } from '@xyflow/react';
import { applyNodeChanges } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import { type Connection } from '@xyflow/react';
import { type EdgeChange } from '@xyflow/react';
import { type NodeChange } from '@xyflow/react';
import { Position } from '@xyflow/react';
import { nanoid } from 'nanoid';

import { AppState } from '@lib/definitions';
import { fetchWorkflowNodes } from '@lib/actions/sandbox-actions';
import { fetchWorkflowEdges } from '@lib/actions/sandbox-actions';
import { createWorkflow } from '@lib/actions/workflow-actions';

const position = { x: 50, y: 100 };
const initialStateNodes = [
    {
        id: 'SFS',
        type: 'initialStateNode',
        data: {
            id: 'SFS',
            label: 'Start from Scratch',
            background: 'white',
            color: '#1b2559'
        },
        position
    },
    {
        id: 'SFT',
        type: 'initialStateNode',
        data: {
            id: 'SFT',
            label: 'Start from a Template',
            background: 'linear-gradient(to bottom right, #86FFE2, #18FFD5)',
            color: '#1b2559'
        },
        position
    },
    {
        id: 'SFA',
        type: 'initialStateNode',
        data: {
            id: 'SFA',
            label: 'Start from AI Prompt',
            background: 'linear-gradient(to bottom right, #868CFF, #4318FF)',
            color: '#1b2559'
        },
        position
    }
] as Node[];

// define the initial state
const initialState: AppState = {
    nodes: initialStateNodes,
    edges: [] as Edge[]
};

export const useGraphStore = create<AppState>((set, get) => ({
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
    onConnect: (connection: Connection) => {
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
    createNewWorkflow: async () => {
        // Hit the db and create a new workflow
        // grab the workflow_id to add to new node
        const workflow_id: string = await createWorkflow();
        // create a new root node
        const nodes = [
            {
                id: nanoid(),
                sourcePosition: Position.Right,
                type: 'rootNode',
                data: {
                    label: 'Root',
                    workflowId: workflow_id
                },
                position
            }
        ] as Node[];

        set({
            nodes,
            edges: []
        });
    },
    fetchGraph: async (workflowId: string) => {
        // used when needing to get a workflow graph already stored in the db
        // make a fetch to back end api to get a workflow by the id
        // will need to parse graph into singular lists of nodes and edges
        // then update zustand state
        set({
            nodes: fetchWorkflowNodes(),
            edges: fetchWorkflowEdges()
        });
    },
    reset: () => {
        set(initialState);
    }
}));
