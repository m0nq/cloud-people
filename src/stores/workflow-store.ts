import { Position } from '@xyflow/react';
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
import { devtools } from 'zustand/middleware';

import { createEdge } from '@lib/actions/edge-actions';
import { updateEdges } from '@lib/actions/edge-actions';
import { createNodes } from '@lib/actions/node-actions';
import { updateNodes } from '@lib/actions/node-actions';
import { deleteNodes } from '@lib/actions/node-actions';
import { fetchWorkflowEdges } from '@lib/actions/sandbox-actions';
import { fetchWorkflowNodes } from '@lib/actions/sandbox-actions';
import { createWorkflow } from '@lib/actions/workflow-actions';
import { AgentData } from '@lib/definitions';
import { AppState } from '@lib/definitions';
import { NodeData } from '@lib/definitions';
import { WorkflowState } from '@lib/definitions';
import { InitialStateNodeData } from '@lib/definitions';
import { EdgeData } from '@lib/definitions';
import { AgentStatus } from '@lib/definitions';
import { INITIAL_NODE_POSITION } from '@config/layout.const';
import { NODE_SPACING_X } from '@config/layout.const';
import { NODE_SPACING_Y } from '@config/layout.const';
import { ROOT_NODE_SPACING_X } from '@config/layout.const';
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
// this is where agent states will be controlled
export const useGraphStore = create<AppState>()(
    devtools((set: (payload: AppState) => void, get: () => AppState) => ({
            ...initialState,
            onBeforeDelete: async ({ nodes }: { nodes: Node[] }): Promise<boolean> => {
                if (!nodes || nodes.length === 0) return true;
                const [node] = nodes;

                if (!node || !node.type) return true;
                return !(node.type.includes(WorkflowNode.InitialStateNode) || node.type.includes('root'));
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
                    // First create the edge in the database
                    const workflowId = get()?.nodes.find(n => n.id === connection.source)?.data?.workflowId;
                    if (!workflowId) {
                        throw new Error('No workflow ID found for source node');
                    }

                    const edgeId = await createEdge({
                        workflowId,
                        toNodeId: connection.target,
                        fromNodeId: connection.source
                    });

                    // Then create the edge in the UI with the database ID
                    const newEdge = {
                        id: edgeId,
                        source: connection.source,
                        target: connection.target,
                        type: WorkflowNode.AutomationEdge,
                        animated: true,
                        data: {
                            workflowId
                        }
                    } as Edge<EdgeData>;

                    const updatedEdges = addEdge(newEdge, get().edges);
                    set({ edges: updatedEdges, nodes: [...get().nodes] });
                } catch (error) {
                    console.error('Failed to create edge in database:', error);
                    // TODO: Add error handling/recovery
                }
            },
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
            addNode: async (agent: AgentData): Promise<void> => {
                try {
                    const parentNode = get().nodes
                        .find((n: Node<NodeData>) => n.id === agent.parentNodeId);

                    if (!parentNode || !parentNode.data?.workflowId) {
                        console.error('Parent node not found or missing workflowId. Modal state:', parentNode);
                        throw new Error('Parent node not found or missing workflowId');
                    }

                    const workflowId = (parentNode.data as NodeData).workflowId ?? '';
                    if (!workflowId) {
                        throw new Error('No workflow ID found in node data');
                    }

                    // Get all existing siblings (nodes that share the same parent)
                    const siblings: string[] = getConnectedEdges([parentNode], get().edges)
                        .map((e: Edge) => e.target)
                        .filter((nodeId: string) => {
                            // Find edges where this node is the target (i.e. incoming edges)
                            const incomingEdges = get().edges.filter(e => e.target === nodeId);
                            // Only include nodes that have the same parent as our new node
                            return incomingEdges.some(e => e.source === parentNode.id);
                        });

                    // Only rebalance if there will be multiple siblings at this level
                    const totalSiblings = siblings.length + 1;
                    const isParentRootNode = parentNode.type === WorkflowNode.RootNode;

                    // Create position changes for existing siblings only if there are multiple siblings
                    let nodeChanges: NodeChange[] = [];
                    if (totalSiblings > 1) {
                        nodeChanges = siblings.map((siblingId: string, index: number) => ({
                            type: 'position' as const,
                            id: siblingId,
                            position: {
                                x: parentNode.position.x + (isParentRootNode ? ROOT_NODE_SPACING_X : NODE_SPACING_X),
                                y: parentNode.position.y + (index - (totalSiblings - 1) / 2) * NODE_SPACING_Y
                            }
                        }));

                        // Apply position changes to existing siblings only
                        get().onNodesChange?.(nodeChanges);
                    }

                    // Position for the new node - for a single child, keep it in line with parent
                    const newPosition = {
                        x: parentNode.position.x + (isParentRootNode ? ROOT_NODE_SPACING_X : NODE_SPACING_X),
                        y: totalSiblings > 1 ? parentNode.position.y + (siblings.length - (totalSiblings - 1) / 2) * NODE_SPACING_Y : parentNode.position.y
                    };

                    // Create node in database first
                    const createdNode = await createNodes({ workflowId });
                    if (!createdNode || !createdNode.id) {
                        throw new Error('Failed to create node');
                    }

                    // Create new node with agent data and the ID from the created node
                    const newNode = {
                        id: createdNode.id, // Use the ID from the created node
                        type: WorkflowNode.AgentNode,
                        data: {
                            ...agent,
                            currentStep: '0',
                            state: WorkflowState.Initial,
                            status: AgentStatus.Initial,
                            workflowId
                        },
                        position: newPosition,
                        dragHandle: '.nodrag',
                        sourcePosition: Position.Right,
                        targetPosition: Position.Left
                    } as Node<NodeData>;

                    try {
                        // Update node state in database
                        await updateNodes({
                            workflowId: workflowId,
                            nodeId: createdNode.id, // Use the ID from the created node
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

                    // Update UI with the new node
                    set({ nodes: [...get().nodes, newNode], edges: [...get().edges] });

                    // Create edge in database only if we have a valid parent node
                    if (agent.parentNodeId) {
                        const edgeId = await createEdge({
                            workflowId,
                            toNodeId: createdNode.id, // Use the ID from the created node
                            fromNodeId: agent.parentNodeId
                        });

                        // Update the store with the edge
                        const newEdge = {
                            id: edgeId,
                            source: agent.parentNodeId,
                            target: createdNode.id, // Use the ID from the created node
                            type: WorkflowNode.AutomationEdge,
                            animated: true,
                            data: {
                                workflowId
                            }
                        } as Edge<EdgeData>;

                        const currentEdges = get().edges;
                        get().setEdges?.([...currentEdges, newEdge]);
                    }
                } catch (error) {
                    console.error('Failed to add node or edge:', error);
                    // TODO: Show error toast to user
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
                // TODO: New plan is enable the target handle of a node to allow the user to link an orphan node to
                // another
                await Promise.all([...deletedNodes.map(async (node: Node) => deleteNodes({ nodeId: node.id }))]);

                set({
                    nodes: nodes.filter(({ id }) => !deletedNodes.some((node: Node) => node.id === id)),
                    edges: edges.filter(({ id }) => !connectedEdges.some((edge: Edge) => edge.id === id))
                });
            },
            reset: () => {
                set(initialState);
            }
        }),
        {
            name: 'Workflow Store',
            enabled: process.env.NODE_ENV === 'development',
            maxAge: process.env.NODE_ENV === 'development' ? 50 : 0
        }
    )
);
