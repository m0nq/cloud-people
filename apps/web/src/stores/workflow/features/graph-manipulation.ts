import { addEdge } from '@xyflow/react';
import { Connection } from '@xyflow/react';
import { Position } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { type NodeChange } from '@xyflow/react';
import { type EdgeChange } from '@xyflow/react';
import { applyNodeChanges } from '@xyflow/react';
import { applyEdgeChanges } from '@xyflow/react';
import { getConnectedEdges } from '@xyflow/react';

import { createNodes } from '@lib/actions/node-actions';
import { deleteNodes } from '@lib/actions/node-actions';
import { updateNodes } from '@lib/actions/node-actions';
import { createEdge } from '@lib/actions/edge-actions';
import { deleteEdges } from '@lib/actions/edge-actions';
import { updateEdges } from '@lib/actions/edge-actions';
import type { EdgeData } from '@app-types/workflow';
import type { NodeData } from '@app-types/workflow';
import type { InitialStateNodeData } from '@app-types/workflow';
import type { WorkflowStore } from '@app-types/workflow';
import { isValidWorkflowNode } from '@stores/workflow';
import { updateState } from '@stores/workflow';
import { validateConnection } from '@stores/workflow';
import type { AgentData } from '@app-types/agent';
import { AgentState } from '@app-types/agent';
import { NodeType } from '@app-types/workflow/node-types';
import { EdgeType } from '@app-types/workflow/node-types';
import { fetchAgent } from '@lib/actions/agent-actions';
import { calculateNodePositions } from '@lib/layout/node-layout';
import { getSiblings } from '@lib/layout/node-layout';
import { useAgentStore } from '@stores/agent-store';

type PositionNodeChange = NodeChange & {
    type: 'position';
    id: string;
    position: { x: number; y: number };
};

type DeleteEdgeChange = EdgeChange & {
    type: 'remove';
    id: string;
};

export const createGraphManipulation = (set: (state: WorkflowStore) => void, get: () => WorkflowStore) => ({
    onNodesChange: async (changes: NodeChange<Node>[]) => {
        const { nodes } = get();

        // Keep track of original nodes for rollback
        const originalNodes = [...nodes];

        try {
            // Create a deep copy of nodes to avoid read-only property issues
            const nodesCopy = nodes.map(node => ({
                ...node,
                // Ensure position is a new object to avoid read-only issues
                position: { ...node.position },
                // Create new data object to avoid read-only issues
                data: { ...node.data }
            }));
            
            // Apply changes to the copied nodes
            const updatedNodes = applyNodeChanges(changes, nodesCopy) as (Node<NodeData> | Node<InitialStateNodeData>)[];
            updateState(set, { nodes: updatedNodes });

            // Only update database for position changes to reduce unnecessary calls
            const positionChanges = changes.filter(
                (change): change is PositionNodeChange => change.type === 'position'
            );

            if (positionChanges.length > 0) {
                await Promise.all(
                    positionChanges.map(async change => {
                        const node = updatedNodes.find(n => n.id === change.id);
                        if (node && isValidWorkflowNode(node)) {
                            await updateNodes({
                                data: {
                                    workflowId: node.data.workflowId,
                                    nodeId: node.id,
                                    set: {
                                        state: node.data.state,
                                        updated_at: new Date()
                                    }
                                }
                            }).catch(err => {
                                console.warn('Node update warning (non-critical):', err);
                                // Don't throw here to prevent UI disruption
                            });
                        }
                    })
                );
            }
        } catch (error) {
            console.error('Failed to update nodes:', error);
            // Rollback on error
            updateState(set, { nodes: originalNodes });
            // Don't throw error to prevent UI disruption
            console.warn('Failed to update nodes. Changes have been reverted.');
        }
    },

    onEdgesChange: async (changes: EdgeChange<Edge<EdgeData>>[]) => {
        // Clear memoization cache when edges change
        // findNextNodeMemo.cache.clear?.();
        // getConnectedNodesMemo.cache.clear?.();

        // Keep track of original edges for rollback
        const originalEdges = get().edges;

        try {
            // Create deep copies of edges to avoid read-only property issues
            const edgesCopy = originalEdges.map(edge => ({
                ...edge,
                data: edge.data ? { ...edge.data } : undefined
            }));

            // Group changes by type for atomic operations
            const deleteChanges = changes.filter(
                (
                    change
                ): change is {
                    type: 'remove';
                    id: string;
                } => change.type === 'remove' && 'id' in change
            );
            const updateChanges = changes.filter(change => change.type !== 'remove');

            // Handle deletions first
            if (deleteChanges.length > 0) {
                // Delete edges from database
                await Promise.all(
                    deleteChanges.map(async (change: DeleteEdgeChange) => {
                        try {
                            await deleteEdges({ edgeId: change.id });
                        } catch (error) {
                            console.warn(`Failed to delete edge ${change.id}:`, error);
                            // Continue with UI updates even if DB delete fails
                        }
                    })
                );
            }

            // Apply updates to the UI state
            const updatedEdges = applyEdgeChanges(changes, edgesCopy) as Edge<EdgeData>[];
            updateState(set, { edges: updatedEdges });

            // Handle updates
            if (updateChanges.length > 0) {
                // Update edges in database
                await Promise.all(
                    updateChanges.map(async change => {
                        // Safely check for ID property
                        const changeId = 'id' in change ? change.id : undefined;
                        if (!changeId) return;
                        
                        const edge = updatedEdges.find(e => e.id === changeId);
                        if (edge?.data) {
                            try {
                                await updateEdges({
                                    data: {
                                        edgeId: edge.id,
                                        workflowId: edge.data.workflowId,
                                        set: {
                                            updated_at: new Date()
                                        }
                                    }
                                });
                            } catch (error) {
                                console.warn(`Failed to update edge ${edge.id}:`, error);
                                // Continue with UI updates even if DB update fails
                            }
                        }
                    })
                );
            }
        } catch (error) {
            console.error('Failed to update edges:', error);
            // Rollback on error
            updateState(set, { edges: originalEdges });
            // Don't throw to prevent UI disruption
            console.warn('Failed to update edges. Changes have been reverted.');
        }
    },

    onConnect: async (connection: Connection) => {
        if (!validateConnection(get, connection)) {
            return;
        }

        try {
            // Get workflow ID from source node
            const sourceNode = get().nodes.find(n => n.id === connection.source);
            const workflowId = sourceNode?.data && 'workflowId' in sourceNode.data ? String(sourceNode.data.workflowId) : undefined;
            if (!workflowId) {
                throw new Error('No workflow ID found for source node');
            }

            // Create edge in database
            const edgeId = await createEdge({
                data: {
                    workflowId: workflowId,
                    toNodeId: connection.target,
                    fromNodeId: connection.source
                }
            });

            // Create edge in UI
            const newEdge: Edge<EdgeData> = {
                id: edgeId,
                source: connection.source,
                target: connection.target,
                type: EdgeType.Automation,
                animated: true,
                data: {
                    id: edgeId,
                    workflowId: workflowId,
                    toNodeId: connection.target,
                    fromNodeId: connection.source
                }
            };

            // Use addEdge to update the edges in state
            const updatedEdges = addEdge(newEdge, get().edges);
            updateState(set, { edges: updatedEdges });
        } catch (error) {
            console.error('Failed to create edge:', error);
            throw error;
        }
    },

    addNode: async (agent: AgentData, parentNodeId?: string | null): Promise<Node<NodeData> | null> => { 
        const { nodes, edges } = get();
        const agentStore = useAgentStore.getState();

        // --- GUARD: Check if agent already exists or is being processed ---
        const existingAgentData = agentStore.getAgentData(agent.id);
        if (existingAgentData?.nodeId) {
            console.warn(`[addNode] Agent ${agent.id} already has nodeId ${existingAgentData.nodeId}. Skipping add.`);
            const existingNode = nodes.find(n => n.id === existingAgentData.nodeId);
            return existingNode ? existingNode as Node<NodeData> : null;
        }

        try {
            let parentNode: Node<NodeData> | null = null;
            let workflowId: string | undefined = undefined;

            // --- 1. Determine Parent Node and Initial Workflow ID ---
            if (parentNodeId) {
                parentNode = nodes.find(node => node.id === parentNodeId) as Node<NodeData> ?? null;
                if (!parentNode) {
                    console.error(`Parent node with ID ${parentNodeId} not found. Cannot add node.`);
                    throw new Error(`Parent node with ID ${parentNodeId} not found.`);
                }
                workflowId = parentNode.data.workflowId;
                if (!workflowId) {
                     console.error(`Parent node ${parentNodeId} is missing required workflowId.`);
                     throw new Error(`Parent node ${parentNodeId} is missing required workflowId.`);
                }
            } else if (nodes.length > 0) {
                parentNode = nodes[nodes.length - 1] as Node<NodeData>;
                workflowId = parentNode.data.workflowId;
                 if (!workflowId) {
                    console.error(`Default parent node ${parentNode.id} is missing required workflowId.`);
                    throw new Error(`Default parent node ${parentNode.id} is missing required workflowId.`);
                }
                console.log(`No parentNodeId specified, defaulting parent to last node: ${parentNode.id} with workflowId: ${workflowId}`);
            }

            // --- 2. Add/Update Agent in Agent Store (Initial) ---
            agentStore.setAgentData(agent.id, agent);

            // --- 3. Calculate Node Positions ---
            let newNodePosition: { x: number; y: number } = { x: 100, y: 100 };
            let nodeChangesForLayout: NodeChange[] = [];
            if (parentNode) {
                const siblings = getSiblings(parentNode, edges);
                const nodePositions = calculateNodePositions(parentNode, siblings, edges);
                newNodePosition = nodePositions.find(p => p.id === 'new-node')?.position ?? newNodePosition;
                nodeChangesForLayout = nodePositions
                    .filter(pos => pos.id !== 'new-node')
                    .map(pos => ({ type: 'position' as const, id: pos.id, position: pos.position }));
            }

            // --- 4. Create Node in Database ---
            const currentWorkflowId = workflowId;

            // Ensure workflowId is defined before creating an agent node
            if (typeof currentWorkflowId !== 'string') {
                console.error('Cannot create agent node: workflowId is undefined. This indicates an issue with workflow initialization.');
                throw new Error('Cannot add agent node without a valid workflow ID.');
            }

            const newNodeServerData: Omit<NodeData, 'id' | 'agentRef'> & { agentId: string; workflowId?: string } = {
                type: NodeType.Agent,
                agentId: agent.id,
                state: AgentState.Initial,
                workflowId: currentWorkflowId // Send workflowId if known (from parent), otherwise backend creates/assigns
            };
            const createNodeResult = await createNodes({
                data: {
                    workflowId: currentWorkflowId,
                    nodeType: NodeType.Agent,
                    agentId: agent.id
                }
            });

            if (!createNodeResult?.id) {
                throw new Error('Failed to create node in database or node missing ID.');
            }
            const newNodeId = createNodeResult.id;

            // --- 5. Determine Final Workflow ID (Guaranteed String) ---
            let finalWorkflowId: string;
            if (workflowId) {
                finalWorkflowId = workflowId;
            } else {
                if (!createNodeResult.data?.workflowId) {
                    console.error("Backend did not return workflowId for the newly created first node.", createNodeResult);
                    throw new Error("Failed to get workflowId for the first node from backend.");
                }
                finalWorkflowId = createNodeResult.data.workflowId;
                console.log(`First node created, obtained workflowId from backend: ${finalWorkflowId}`);
            }

            // --- 6. Update Agent Store (Final) ---
            const finalAgentData = { ...agent, nodeId: newNodeId };
            agentStore.setAgentData(agent.id, finalAgentData);

            // --- 7. Create Edge in Database (if applicable) ---
            let newEdgeId: string | null = null;
            if (parentNode) { // Use guaranteed finalWorkflowId here
                newEdgeId = await createEdge({
                    data: {
                        workflowId: finalWorkflowId, // FIX: Use guaranteed string workflowId
                        toNodeId: newNodeId,
                        fromNodeId: parentNode.id
                    }
                });
                if (!newEdgeId) {
                    throw new Error('Failed to create edge in database or edge ID missing.');
                }
            }

            // --- 8. Prepare Local State Update ---
            const newNode: Node<NodeData> = {
                id: newNodeId,
                type: NodeType.Agent,
                position: newNodePosition,
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
                data: {
                    id: newNodeId,
                    type: NodeType.Agent,
                    workflowId: finalWorkflowId,
                    agentRef: { agentId: agent.id },
                    state: AgentState.Initial
                }
            };

            const finalEdges = [...edges];
            if (parentNode && newEdgeId) {
                const newEdge: Edge<EdgeData> = {
                    id: newEdgeId,
                    source: parentNode.id,
                    target: newNodeId,
                    type: EdgeType.Automation,
                    animated: true,
                    data: {
                        id: newEdgeId,
                        workflowId: finalWorkflowId,
                        toNodeId: newNodeId,
                        fromNodeId: parentNode.id
                    }
                };
                finalEdges.push(newEdge);
            }

            // --- 9. Update Local State ---
            if (process.env.NODE_ENV === 'development') {
                console.log('Updating state with new node:', newNode, 'Edges:', finalEdges);
            }
            updateState(set, {
                nodes: [...nodes, newNode],
                edges: finalEdges
            });

            // Apply layout updates to siblings if necessary
            if (nodeChangesForLayout.length > 0) {
                get().onNodesChange?.(nodeChangesForLayout);
            }

            return newNode;

        } catch (error) {
            console.error('Failed to add node:', error);
            throw error; // Re-throw for caller to handle
        }
    },

    onBeforeDelete: ({ nodes, edges }) => {
        const edgesToDelete = edges.filter(edge => edge.selected);
        if (edgesToDelete.length) {
            return false;
        }
        return true;
    },

    onNodesDelete: async (deletedNodes: Node[]) => {
        if (!deletedNodes.length) {
            return;
        }
        const { nodes, edges } = get();
        const connectedEdges = getConnectedEdges(deletedNodes, edges);
        await Promise.all([...deletedNodes.map(async (node: Node) => deleteNodes({ nodeId: node.id }))]);

        updateState(set, {
            nodes: nodes.filter(({ id }) => !deletedNodes.some((node: Node) => node.id === id)),
            edges: edges.filter(({ id }) => !connectedEdges.some((edge: Edge) => edge.id === id))
        });
    }
});
