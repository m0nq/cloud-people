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
import { useAgentStore } from '@stores/agent-store';

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

// Initial state
const initialState: GraphState = {
    nodes: initialStateNodes,
    edges: [] as Edge<EdgeData>[],
    workflowExecution: null
};

// Type guards
const isInitialStateNode = (node: Node<NodeData | InitialStateNodeData>): node is Node<InitialStateNodeData> => {
    return node.type?.includes(WorkflowNode.InitialStateNode) ?? false;
};

const isWorkflowNode = (node: Node<NodeData | InitialStateNodeData>): node is Node<NodeData> => {
    return !isInitialStateNode(node);
};

const isValidWorkflowNode = (node: Node<NodeData | InitialStateNodeData>): node is Node<NodeData> => {
    return isWorkflowNode(node) && !!node.data?.workflowId;
};

export const useGraphStore = create<AppState>()(
    devtools((set, get) => {
        // State update helper
        const updateState = (newState: Partial<GraphState>) => {
            set(currentState => ({
                ...currentState,
                ...newState
            }));
        };

        // Helper functions that use store state
        const findRootNode = (nodes: Node<NodeData | InitialStateNodeData>[]): Node<NodeData> | undefined => {
            const { edges } = get();
            return nodes.find(
                (node): node is Node<NodeData> =>
                    !isInitialStateNode(node) && getConnectedEdges([node], edges).length === 0
            );
        };

        const findNextNode = (nodes: Node[], edges: Edge[], currentNodeId: string): Node | undefined => {
            const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
            if (outgoingEdges.length === 0) return undefined;

            const nextNodeId = outgoingEdges[0].target;
            return nodes.find(node => node.id === nextNodeId);
        };

        const getConnectedNodes = (node: Node): Node[] => {
            const { nodes, edges } = get();
            const connectedEdges = getConnectedEdges([node], edges);
            return nodes.filter(n => 
                connectedEdges.some(e => e.source === n.id || e.target === n.id)
            );
        };

        // Connection validation
        const validateConnection = (connection: Connection): boolean => {
            const { nodes, edges } = get();
            
            // Basic field validation
            if (!(connection.source && connection.target && connection.sourceHandle && connection.targetHandle)) {
                return false;
            }

            // Prevent connecting to root node as target
            const targetNode = nodes.find(n => n.id === connection.target);
            const rootNode = findRootNode(nodes);
            if (targetNode && rootNode?.id === targetNode.id) {
                return false;
            }

            // Prevent multiple outgoing edges
            const sourceHasOutgoing = edges.some(e => e.source === connection.source);
            if (sourceHasOutgoing) {
                return false;
            }

            // Prevent cycles by checking if target node leads back to source
            const wouldCreateCycle = (source: string, target: string, visited = new Set<string>()): boolean => {
                if (source === target) return true;
                if (visited.has(target)) return false;
                
                visited.add(target);
                const outgoingEdges = edges.filter(e => e.source === target);
                return outgoingEdges.some(e => wouldCreateCycle(source, e.target, visited));
            };

            return !wouldCreateCycle(connection.source, connection.target);
        };

        // Workflow state management
        const transitionNode = (nodeId: string, status: AgentStatus) => {
            const { nodes } = get();
            const updatedNodes = nodes.map((node) => {
                if (node.id === nodeId && isWorkflowNode(node)) {
                    // Map AgentStatus to WorkflowState
                    let workflowState: WorkflowState;
                    switch (status) {
                        case AgentStatus.Initial:
                            workflowState = WorkflowState.Initial;
                            break;
                        case AgentStatus.Working:
                        case AgentStatus.Activating:
                            workflowState = WorkflowState.Running;
                            break;
                        case AgentStatus.Idle:
                            workflowState = WorkflowState.Paused;
                            break;
                        case AgentStatus.Complete:
                            workflowState = WorkflowState.Complete;
                            break;
                        case AgentStatus.Error:
                            workflowState = WorkflowState.Error;
                            break;
                        case AgentStatus.Assistance:
                            // When agent needs assistance, we keep the workflow running
                            workflowState = WorkflowState.Running;
                            break;
                        default:
                            workflowState = WorkflowState.Initial;
                    }
                    
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            state: workflowState
                        }
                    };
                }
                return node;
            });

            updateState({ nodes: updatedNodes });
        };

        return {
            // State
            ...initialState,

            // Graph manipulation actions
            onNodesChange: async (changes: NodeChange<Node>[]) => {
                const { nodes } = get();

                // Keep track of original nodes for rollback
                const originalNodes = [...nodes];

                try {
                    const updatedNodes = applyNodeChanges(changes, nodes) as (Node<NodeData> | Node<InitialStateNodeData>)[];
                    updateState({ nodes: updatedNodes });

                    // Update database for each changed node
                    await Promise.all(
                        updatedNodes.filter(isValidWorkflowNode).map(async node => {
                            await updateNodes({
                                workflowId: node.data.workflowId,
                                nodeId: node.id,
                                set: {
                                    state: node.data.state,
                                    current_step: node.data.currentStep || '0',
                                    updated_at: new Date()
                                }
                            });
                        })
                    );
                } catch (error) {
                    console.error('Failed to update nodes:', error);
                    // Rollback on error
                    updateState({ nodes: originalNodes });
                    throw new Error('Failed to update nodes. Changes have been reverted.');
                }
            },
            onEdgesChange: async (changes: EdgeChange<Edge>[]) => {
                // Clear memoization cache when edges change
                // findNextNodeMemo.cache.clear?.();
                // getConnectedNodesMemo.cache.clear?.();

                // Keep track of original edges for rollback
                const originalEdges = get().edges;

                try {
                    // Group changes by type for atomic operations
                    const deleteChanges = changes.filter((change): change is { type: 'remove'; id: string } => change.type === 'remove' && 'id' in change);
                    const updateChanges = changes.filter(change => change.type !== 'remove');

                    // Handle deletions first
                    if (deleteChanges.length) {
                        // Delete edges from database
                        await Promise.all(
                            deleteChanges.map(async change => {
                                const edge = originalEdges.find(e => e.id === change.id);
                                if (edge) {
                                    // Get workflowId from source node since edge data might not have it
                                    const sourceNode = get().nodes.find(n => n.id === edge.source);
                                    const workflowId = sourceNode?.data?.workflowId;

                                    if (workflowId) {
                                        await deleteEdges({
                                            edgeId: edge.id,
                                            workflowId
                                        });
                                    }
                                }
                            })
                        );
                    }

                    // Apply changes to UI state
                    const updatedEdges = applyEdgeChanges(changes, originalEdges);
                    updateState({ edges: updatedEdges });

                    // Handle updates (source/target changes)
                    if (updateChanges.length) {
                        await Promise.all(
                            updatedEdges.map(async edge => {
                                const sourceNode = get().nodes.find(n => n.id === edge.source);
                                if (!sourceNode?.data?.workflowId) return;

                                await updateEdges({
                                    edgeId: edge.id,
                                    workflowId: sourceNode.data.workflowId,
                                    source: edge.source,
                                    target: edge.target
                                });
                            })
                        );
                    }
                } catch (error) {
                    console.error('Failed to update edges:', error);
                    // Rollback UI state on error
                    updateState({ edges: originalEdges });
                }
            },

            onConnect: async (connection: Connection) => {
                if (!validateConnection(connection)) {
                    throw new Error('Invalid connection parameters');
                }

                // Keep track of original edges for rollback
                const originalEdges = [...get().edges];

                try {
                    // Get workflow ID from source node
                    const sourceNode = get().nodes.find(n => n.id === connection.source);
                    const workflowId = sourceNode?.data?.workflowId;
                    if (!workflowId) {
                        throw new Error('No workflow ID found for source node');
                    }

                    // First create the edge in the database
                    const edgeId = await createEdge({
                        workflowId,
                        toNodeId: connection.target,
                        fromNodeId: connection.source
                    });

                    // Create the edge object for UI
                    const newEdge: Edge<EdgeData> = {
                        id: edgeId,
                        source: connection.source,
                        target: connection.target,
                        type: WorkflowNode.AutomationEdge,
                        animated: true,
                        data: {
                            workflowId,
                            type: WorkflowNode.AutomationEdge
                        }
                    };

                    // Update UI state
                    const updatedEdges = [...originalEdges, newEdge];
                    updateState({ edges: updatedEdges });
                } catch (error) {
                    console.error('Failed to create edge:', error);
                    // Rollback UI state on error
                    updateState({ edges: originalEdges });
                    throw new Error('Failed to create edge. Changes have been reverted.');
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
                                x: parentNode.position.x + (isParentRootNode ? NODE_SPACING_X : NODE_SPACING_X),
                                y: parentNode.position.y + (index - (totalSiblings - 1) / 2) * NODE_SPACING_Y
                            }
                        }));

                        // Apply position changes to existing siblings only
                        get().onNodesChange?.(nodeChanges);
                    }

                    // Position for the new node
                    const newPosition = {
                        x: parentNode.position.x + (isParentRootNode ? NODE_SPACING_X : NODE_SPACING_X),
                        y: totalSiblings > 1 ? parentNode.position.y + (siblings.length - (totalSiblings - 1) / 2) * NODE_SPACING_Y : parentNode.position.y
                    };

                    // Create node in database first
                    const createdNode = await createNodes({ workflowId });
                    if (!createdNode || !createdNode.id) {
                        throw new Error('Failed to create node');
                    }

                    // Initialize agent state before creating the node
                    const agentStore = useAgentStore.getState();
                    agentStore.updateAgent(createdNode.id, { 
                        status: AgentStatus.Initial,
                        isEditable: true
                    });

                    // Create new node with agent data and the ID from the created node
                    const newNode = {
                        id: createdNode.id,
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
                            nodeId: createdNode.id,
                            set: {
                                state: WorkflowState.Initial,
                                current_step: '0',
                                updated_at: new Date()
                            }
                        });
                    } catch (updateError) {
                        console.error('Failed to update node state:', updateError);
                        throw new Error('Failed to initialize node state');
                    }

                    // Update UI with the new node
                    set({ nodes: [...get().nodes, newNode], edges: [...get().edges] });

                    // Create edge in database only if we have a valid parent node
                    if (agent.parentNodeId) {
                        const edgeId = await createEdge({
                            workflowId,
                            toNodeId: createdNode.id,
                            fromNodeId: agent.parentNodeId
                        });

                        // Update the store with the edge
                        const newEdge = {
                            id: edgeId,
                            source: agent.parentNodeId,
                            target: createdNode.id,
                            type: WorkflowNode.AutomationEdge,
                            animated: true,
                            data: {
                                workflowId
                            }
                        } as Edge<EdgeData>;

                        set(state => ({
                            ...state,
                            edges: [...state.edges, newEdge]
                        }));
                    }
                } catch (error) {
                    console.error('Failed to add node:', error);
                    throw error;
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
                    updateState({
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
                    updateState({
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

                updateState({
                    nodes: nodes.filter(({ id }) => !deletedNodes.some((node: Node) => node.id === id)),
                    edges: edges.filter(({ id }) => !connectedEdges.some((edge: Edge) => edge.id === id))
                });
            },
            reset: () => {
                updateState(initialState);
            },

            startWorkflow: async () => {
                const { nodes, edges } = get();
                const rootNode = findRootNode(nodes);

                if (!rootNode?.data?.workflowId) {
                    throw new Error('No workflow ID found');
                }

                try {
                    const sessionId = crypto.randomUUID();
                    
                    // Find the first node connected to root
                    const firstNode = findNextNode(nodes, edges, rootNode.id);
                    if (!firstNode || !isValidWorkflowNode(firstNode)) {
                        throw new Error('No valid starting node found');
                    }

                    const execution: WorkflowExecution = {
                        workflowId: rootNode.data.workflowId,
                        sessionId,
                        currentNodeId: firstNode.id,
                        state: WorkflowState.Running,
                        startedAt: new Date()
                    };

                    // Initialize all non-root nodes to Idle state
                    await Promise.all(
                        nodes
                            .filter(isValidWorkflowNode)
                            .filter(node => node.id !== rootNode.id)
                            .map(node => transitionNode(node.id, AgentStatus.Idle))
                    );

                    // Start with first node
                    await transitionNode(firstNode.id, AgentStatus.Activating);

                    await createExecution({
                        sessionId,
                        agentId: firstNode.id,
                        input: {
                            nodeId: firstNode.id,
                            nodeType: firstNode.type,
                            workflowId: firstNode.data.workflowId
                        },
                        status: AgentStatus.Activating,
                        metadata: {
                            transitionFrom: AgentStatus.Idle
                        }
                    });

                    updateState({ workflowExecution: execution });
                } catch (error) {
                    console.error('Failed to start workflow:', error);
                    throw error;
                }
            },
            pauseWorkflow: () => {
                const { workflowExecution } = get();
                if (!workflowExecution) return;

                updateState({
                    workflowExecution: {
                        ...workflowExecution,
                        state: WorkflowState.Paused
                    }
                });
            },

            resumeWorkflow: async () => {
                const { workflowExecution, nodes } = get();
                if (!workflowExecution?.currentNodeId) return;

                const currentNode = nodes.find(n => n.id === workflowExecution.currentNodeId);
                if (!currentNode || !isValidWorkflowNode(currentNode)) return;

                try {
                    // Resume from current node with Activating state per state diagram
                    await transitionNode(currentNode.id, AgentStatus.Activating);

                    updateState({
                        workflowExecution: {
                            ...workflowExecution,
                            state: WorkflowState.Running,
                            error: undefined,
                            needsAssistance: false
                        }
                    });
                } catch (error) {
                    console.error('Failed to resume workflow:', error);
                    throw error;
                }
            },

            progressWorkflow: async (nodeId: string, status: AgentStatus) => {
                const { nodes, workflowExecution } = get();
                const node = nodes.find(n => n.id === nodeId);
                if (!node || !isValidWorkflowNode(node)) return;

                try {
                    // First update the UI state
                    transitionNode(nodeId, status);

                    // Map AgentStatus to WorkflowState for database update
                    let workflowState: WorkflowState;
                    switch (status) {
                        case AgentStatus.Initial:
                            workflowState = WorkflowState.Initial;
                            break;
                        case AgentStatus.Working:
                        case AgentStatus.Activating:
                            workflowState = WorkflowState.Running;
                            break;
                        case AgentStatus.Idle:
                            workflowState = WorkflowState.Paused;
                            break;
                        case AgentStatus.Complete:
                            workflowState = WorkflowState.Complete;
                            break;
                        case AgentStatus.Error:
                            workflowState = WorkflowState.Error;
                            break;
                        case AgentStatus.Assistance:
                            // When agent needs assistance, we keep the workflow running
                            workflowState = WorkflowState.Running;
                            break;
                        default:
                            workflowState = WorkflowState.Initial;
                    }

                    // Update database
                    await updateNodes({
                        workflowId: node.data.workflowId,
                        nodeId: node.id,
                        set: {
                            state: workflowState,
                            current_step: node.data.currentStep || '0',
                            updated_at: new Date()
                        }
                    });

                    // Handle error and assistance states
                    if (status === AgentStatus.Error || status === AgentStatus.Assistance) {
                        // Pause workflow and set all non-complete downstream nodes to idle
                        const setDownstreamToIdle = async (currentNodeId: string) => {
                            const nextNode = findNextNode(nodes, get().edges, currentNodeId);
                            if (nextNode && isWorkflowNode(nextNode) && nextNode.data.state !== WorkflowState.Complete) {
                                await transitionNode(nextNode.id, AgentStatus.Idle);
                                await setDownstreamToIdle(nextNode.id);
                            }
                        };
                        
                        await setDownstreamToIdle(nodeId);
                        
                        // Update workflow execution state
                        if (workflowExecution) {
                            updateState({
                                workflowExecution: {
                                    ...workflowExecution,
                                    state: WorkflowState.Paused,
                                    error: status === AgentStatus.Error ? 'Node execution failed' : undefined,
                                    needsAssistance: status === AgentStatus.Assistance
                                }
                            });
                        }
                        return;
                    }

                    // If node is complete, check for next node
                    if (status === AgentStatus.Complete) {
                        const nextNode = findNextNode(nodes, get().edges, nodeId);
                        if (nextNode && isWorkflowNode(nextNode)) {
                            // Start next node with Activating state per state diagram
                            transitionNode(nextNode.id, AgentStatus.Activating);
                        } else {
                            // No next node means workflow is complete
                            if (workflowExecution) {
                                updateState({
                                    workflowExecution: {
                                        ...workflowExecution,
                                        state: WorkflowState.Complete,
                                        completedAt: new Date()
                                    }
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error in progressWorkflow:', error);
                    // If there's an error during state transition, set node to error state
                    transitionNode(nodeId, AgentStatus.Error);
                    if (workflowExecution) {
                        updateState({
                            workflowExecution: {
                                ...workflowExecution,
                                state: WorkflowState.Error,
                                error: error instanceof Error ? error.message : 'Unknown error occurred'
                            }
                        });
                    }
                    throw error;
                }
            },

            // Helper functions
            findRootNode,
            findNextNode,
            getConnectedNodes,
            validateConnection,

            isCurrentNode: (nodeId: string): boolean => {
                const { workflowExecution } = get();
                return workflowExecution?.currentNodeId === nodeId;
            }
        };
    })
);
