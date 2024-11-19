import { addEdge } from '@xyflow/react';
import { applyEdgeChanges } from '@xyflow/react';
import { applyNodeChanges } from '@xyflow/react';
import { type Connection } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { type EdgeChange } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import { type NodeChange } from '@xyflow/react';
import { create } from 'zustand';

import { createEdge } from '@lib/actions/edge-actions';
import { updateEdges } from '@lib/actions/edge-actions';
import { createNodes } from '@lib/actions/node-actions';
import { updateNodes } from '@lib/actions/node-actions';
import { fetchWorkflowEdges } from '@lib/actions/sandbox-actions';
import { fetchWorkflowNodes } from '@lib/actions/sandbox-actions';
import { createWorkflow } from '@lib/actions/workflow-actions';

import { AppState } from '@lib/definitions';
import { WorkflowState } from '@lib/definitions';

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

        try {
            // Skip database updates for initial state nodes and nodes without state
            for (const node of updatedNodes) {
                // Only update nodes that:
                // 1. Have a workflowId
                // 2. Are not initial state nodes
                // 3. Have state data
                if (node.data?.workflowId &&
                    !node.type?.includes('initialStateNode') &&
                    node.data?.state) {
                    try {
                        await updateNodes({
                            workflowId: node.data.workflowId,
                            nodeId: node.id,
                            set: {
                                state: node.data.state,
                                current_step: node.data.currentStep || '0',
                                updated_at: new Date()
                            }
                        });
                    } catch (nodeError) {
                        console.error(`Failed to update node ${node.id}:`, nodeError);
                        // Continue with other nodes even if one fails
                    }
                }
            }
        } catch (error) {
            console.error('Failed to process node changes:', error);
            // Keep UI state even if database update fails
        }
    },
    onEdgesChange: async (changes: EdgeChange<Edge>[]) => {
        const updatedEdges = applyEdgeChanges(changes, get().edges);
        set({ edges: updatedEdges });

        try {
            // Persist edge changes to database
            for (const edge of updatedEdges) {
                if (edge.data?.workflowId) {
                    await updateEdges({
                        workflowId: edge.data.workflowId,
                        toNodeId: edge.target,
                        fromNodeId: edge.source
                    });
                }
            }
        } catch (error) {
            console.error('Failed to update edges in database:', error);
            // TODO: Add error handling/recovery
        }
    },
    onConnect: async (connection: Connection) => {
        try {
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
        } catch (error) {
            console.error('Failed to create edge in database:', error);
            // TODO: Add error handling/recovery
        }
    },
    setNodes: async (nodes: Node[]) => {
        set({ nodes });

        try {
            // Persist node updates to database
            for (const node of nodes) {
                if (node.data?.workflowId) {
                    await updateNodes({
                        workflowId: node.data.workflowId,
                        set: {
                            state: node.data,
                            current_step: node.data.currentStep
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to update nodes in database:', error);
            // TODO: Add error handling/recovery
        }
    },
    setEdges: async (edges: Edge[]) => {
        set({ edges });

        try {
            // Persist edge updates to database
            for (const edge of edges) {
                if (edge.data?.workflowId) {
                    await updateEdges({
                        workflowId: edge.data.workflowId,
                        toNodeId: edge.target,
                        fromNodeId: edge.source,
                        edgeId: edge.id
                    });
                }
            }
        } catch (error) {
            console.error('Failed to update edges in database:', error);
            // TODO: Add error handling/recovery
        }
    },
    addNode: async (node: Node) => {
        try {
            // Get workflow ID from the node data
            const workflowId = node.data?.workflowId;
            if (!workflowId) {
                throw new Error('No workflow ID found in node data');
            }

            // Create node in database first
            const nodeId = await createNodes({ workflowId });
            if (!nodeId) {
                throw new Error('Failed to create node');
            }

            const newNode = {
                ...node,
                id: nodeId,
                data: {
                    ...node.data,
                    workflowId,
                    state: {
                        label: node.data?.label || 'New Node'
                    },
                    currentStep: '0'
                }
            };

            // Update node state in database before UI update
            try {
                await updateNodes({
                    workflowId,
                    nodeId,
                    set: {
                        state: newNode.data.state,
                        current_step: '0',
                        updated_at: new Date()
                    }
                });

                // Only update UI if database update succeeds
                set({ nodes: [...get().nodes, newNode] });
                return newNode;
            } catch (updateError) {
                console.error('Failed to update node state:', updateError);
                // Try to clean up the created node
                throw new Error('Failed to initialize node state');
            }
        } catch (error) {
            console.error('Failed to create node:', error);
            throw error; // Re-throw to let UI handle the error
        }
    },
    createNewWorkflow: async () => {
        try {
            const workflowId = await createWorkflow();
            if (!workflowId) {
                throw new Error('Failed to create workflow');
            }

            const nodeId = await createNodes({ workflowId });
            if (!nodeId) {
                throw new Error('Failed to create node');
            }

            const initialState = {
                label: 'Root',
                currentStep: '0'
            };

            const node = {
                id: nodeId,
                type: 'rootNode',
                data: {
                    label: 'Root',
                    workflowId,
                    state: initialState,
                    currentStep: '0'
                },
                position
            } as Node;

            // Update UI state
            set({
                nodes: [node],
                edges: []
            });

            // Update node in database
            try {
                await updateNodes({
                    workflowId,
                    nodeId,
                    set: {
                        state: WorkflowState.Initial,
                        current_step: '0',
                        updated_at: new Date()
                    }
                });
            } catch (error) {
                console.error('Failed to update node in database:', error);
                // Keep UI state even if database update fails
            }

            return workflowId;
        } catch (error) {
            console.error('Failed to create workflow:', error);
            throw error; // Re-throw to let UI handle the error
        }
    },
    fetchGraph: async (workflowId: string) => {
        try {
            // used when needing to get a workflow graph already stored in the db
            // make a fetch to back end api to get a workflow by the id
            // will need to parse graph into singular lists of nodes and edges
            // then update zustand state
            set({
                nodes: fetchWorkflowNodes(),
                edges: fetchWorkflowEdges()
            });
        } catch (error) {
            console.error('Failed to fetch graph from database:', error);
            // TODO: Add error handling/recovery
        }
    },
    reset: () => {
        set(initialState);
    }
}));
