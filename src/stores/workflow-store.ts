import { addEdge } from '@xyflow/react';
import { applyEdgeChanges } from '@xyflow/react';
import { applyNodeChanges } from '@xyflow/react';
import { type Connection } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { type EdgeChange } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import { type NodeChange } from '@xyflow/react';
import { getConnectedEdges } from '@xyflow/react';
import { create } from 'zustand';

import { createEdge } from '@lib/actions/edge-actions';
import { updateEdges } from '@lib/actions/edge-actions';
import { createNodes } from '@lib/actions/node-actions';
import { updateNodes } from '@lib/actions/node-actions';
import { deleteNodes } from '@lib/actions/node-actions';
import { fetchWorkflowEdges } from '@lib/actions/sandbox-actions';
import { fetchWorkflowNodes } from '@lib/actions/sandbox-actions';
import { createWorkflow } from '@lib/actions/workflow-actions';
import { AppState } from '@lib/definitions';
import { NodeData } from '@lib/definitions';
import { WorkflowState } from '@lib/definitions';
import { InitialStateNodeData } from '@lib/definitions';
import { EdgeData } from '@lib/definitions';
import { INITIAL_NODE_POSITION } from '@config/layout.const';
import { ROOT_NODE_POSITION } from '@config/layout.const';
import { Config } from '@config/constants';

const { WorkflowNode } = Config;

const initialStateNodes = [
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

// define the initial state
const initialState: AppState = {
    nodes: initialStateNodes,
    edges: [] as Edge[]
};

// should implement all the on* state change handlers here
export const useGraphStore = create<AppState>((set: (payload: AppState) => void, get: () => AppState) => ({
    ...initialState,
    onBeforeDelete: async ({ nodes }: { nodes: Node[] }): Promise<boolean> => {
        const [node]: Node[] = nodes;
        return !(node.type?.includes(WorkflowNode.InitialStateNode) || node.type?.includes('root'));
    },
    onNodesChange: async (changes: NodeChange<Node>[]): Promise<void> => {
        const updatedNodes: Node[] = applyNodeChanges(changes, get().nodes);
        set({ nodes: updatedNodes, edges: [...get().edges] });

        try {
            // Update database for each changed node
            for (const node of updatedNodes) {
                // Only update nodes that:
                // 1. Have a workflowId
                // 2. Are not initial state nodes
                // 3. Have state data
                if (node.data?.workflowId && node.data?.state && !node.type?.includes(WorkflowNode.InitialStateNode)) {
                    try {
                        const nodeData = node.data as NodeData; // Type assertion since we've checked workflowId
                        // exists
                        await updateNodes({
                            workflowId: nodeData.workflowId,
                            nodeId: node.id,
                            set: {
                                state: nodeData.state,
                                current_step: nodeData.currentStep || '0',
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
        set({ edges: updatedEdges, nodes: [...get().nodes] });

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
                type: WorkflowNode.AutomationEdge,
                animated: true,
                data: {
                    workflowId: get()?.nodes.find(n => n.id === connection.source)?.data?.workflowId
                }
            } as Edge<EdgeData>;
            // } as WorkflowEdge;  // Type assertion to our custom edge type
            const updatedEdges = addEdge(newEdge, get().edges);
            set({ edges: updatedEdges, nodes: [...get().nodes] });

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
    // setNodes: async (nodes: Node[]) => {
    //     set({ nodes, edges: [...get().edges] });
    //
    //     try {
    //         // Persist node updates to database
    //         for (const node of nodes) {
    //             if (node.data?.workflowId) {
    //                 await updateNodes({
    //                     workflowId: node.data.workflowId,
    //                     set: {
    //                         state: node.data,
    //                         current_step: node.data.currentStep
    //                     }
    //                 });
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Failed to update nodes in database:', error);
    //         // TODO: Add error handling/recovery
    //     }
    // },
    setEdges: async (edges: Edge[]) => {
        set({ edges, nodes: [...get().nodes] });

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
    addNode: async (node: Node<NodeData>): Promise<Node> => {
        try {
            // Get workflow ID from the node data
            const workflowId: string = node.data?.workflowId ?? '';
            if (!workflowId) {
                throw new Error('No workflow ID found in node data');
            }

            // Create node in database first
            const createdNode: Node<NodeData> = await createNodes({ workflowId });
            if (!createdNode || !createdNode.id) {
                throw new Error('Failed to create node');
            }

            const newNode = {
                ...node,
                id: createdNode.id
            } as Node;

            try {
                // Update node state in database before UI update
                // This doesn't totally make sense
                const nodeData = node.data as NodeData; // Type assertion since we've checked workflowId exists
                await updateNodes({
                    workflowId: nodeData.workflowId,
                    nodeId: newNode.id,
                    set: {
                        state: WorkflowState.Initial,
                        current_step: '0',
                        updated_at: new Date()
                    }
                });
            } catch (updateError) {
                console.error('Failed to update node state:', updateError);
                // Try to clean up the created node
                throw new Error('Failed to initialize node state');
            }

            // Only update UI if database update succeeds
            set({ nodes: [...get().nodes, newNode], edges: [...get().edges] });
            return newNode;
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

            const newNode: Node = await createNodes({ workflowId });
            if (!newNode || !newNode.id) {
                throw new Error('Failed to create node');
            }

            const node = {
                id: newNode.id,
                type: WorkflowNode.RootNode,
                data: {
                    label: 'Root',
                    state: WorkflowState.Initial,
                    workflowId,
                    currentStep: '0'
                },
                position: ROOT_NODE_POSITION
            } as Node<NodeData>;

            // Update UI state
            set({
                nodes: [node],
                edges: []
            });

            // Update node in database
            try {
                await updateNodes({
                    workflowId,
                    nodeId: node.id,
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
    onNodesDelete: async (deletedNodes: Node[]) => {
        if (!deletedNodes.length) {
            return;
        }
        const { nodes, edges } = get();
        const connectedEdges = getConnectedEdges(deletedNodes, edges);
        // TODO: New plan is enable the target handle of a node to allow the user to link an orphan node to another
        await Promise.all([...deletedNodes.map(async (node: Node) => deleteNodes({ nodeId: node.id }))]);

        set({
            nodes: nodes.filter(({ id }) => !deletedNodes.some((node: Node) => node.id === id)),
            edges: edges.filter(({ id }) => !connectedEdges.some((edge: Edge) => edge.id === id))
        });
    },
    reset: () => {
        set(initialState);
    }
}));
