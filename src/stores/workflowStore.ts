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

import { AppState } from '@lib/definitions';
import { fetchWorkflowNodes } from '@lib/actions/sandbox-actions';
import { fetchWorkflowEdges } from '@lib/actions/sandbox-actions';
import { createWorkflow } from '@lib/actions/workflow-actions';
import { createNodes } from '@lib/actions/node-actions';
import { createEdge } from '@lib/actions/edge-actions';
import { updateNodes } from '@lib/actions/node-actions';
import { updateEdges } from '@lib/actions/edge-actions';

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

// should implement all the on* state change handlers here
export const useGraphStore = create<AppState>((set, get) => ({
    ...initialState,
    onNodesChange: async (changes: NodeChange<Node>[]) => {
        const updatedNodes = applyNodeChanges(changes, get().nodes);
        set({ nodes: updatedNodes });

        // Persist node changes to database
        for (const node of updatedNodes) {
            if (node.data?.workflowId) {
                await updateNodes({
                    workflowId: node.data.workflowId,
                    set: {
                        state: node.data,
                        currentStep: node.data.currentStep
                    }
                });
            }
        }
    },
    onEdgesChange: async (changes: EdgeChange<Edge>[]) => {
        const updatedEdges = applyEdgeChanges(changes, get().edges);
        set({ edges: updatedEdges });

        // Persist edge changes to database
        for (const edge of updatedEdges) {
            if (edge.data?.workflowId) {
                await updateEdges({
                    workflowId: edge.data.workflowId,
                    toNodeId: edge.target,
                    fromNodeId: edge.source,
                    set: {
                        state: edge.data
                    }
                });
            }
        }
    },
    onConnect: async (connection: Connection) => {
        const newEdge = {
            ...connection,
            id: `edge-${connection.source}-${connection.target}`,
            type: 'automationEdge',
            animated: true,
            data: {
                workflowId: get().nodes.find(n => n.id === connection.source)?.data?.workflowId
            }
        };
        const updatedEdges = addEdge(newEdge, get().edges);
        set({ edges: updatedEdges });

        // Persist new edge to database
        if (newEdge.data?.workflowId) {
            await createEdge({
                workflowId: newEdge.data.workflowId,
                toNodeId: newEdge.target,
                fromNodeId: newEdge.source
            });
        }
    },
    setNodes: async (nodes: Node[]) => {
        set({ nodes });
        
        // Persist node updates to database
        for (const node of nodes) {
            if (node.data?.workflowId) {
                await updateNodes({
                    workflowId: node.data.workflowId,
                    set: {
                        state: node.data,
                        currentStep: node.data.currentStep
                    }
                });
            }
        }
    },
    setEdges: async (edges: Edge[]) => {
        set({ edges });

        // Persist edge updates to database
        for (const edge of edges) {
            if (edge.data?.workflowId) {
                await updateEdges({
                    workflowId: edge.data.workflowId,
                    toNodeId: edge.target,
                    fromNodeId: edge.source,
                    set: {
                        state: edge.data
                    }
                });
            }
        }
    },
    addNode: async (node: Node) => {
        // Get workflow ID from the parent node
        const workflowId = get().nodes.find(n => n.type === 'rootNode')?.data?.workflowId;
        if (!workflowId) return;

        // Create node in database first
        const nodeId = await createNodes({ workflowId });
        const newNode = {
            ...node,
            id: nodeId,
            data: {
                ...node.data,
                workflowId
            }
        };
        
        set({ nodes: [...get().nodes, newNode] });
    },
    createNewWorkflow: async () => {
        const workflowId: string = await createWorkflow();
        const node = {
            id: await createNodes({ workflowId }),
            sourcePosition: Position.Right,
            type: 'rootNode',
            data: {
                label: 'Root',
                workflowId
            },
            position
        } as Node;

        set({
            nodes: [node],
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
