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
            const workflowId = sourceNode?.data?.workflowId || '';
            if (!workflowId) {
                throw new Error('No workflow ID found for source node');
            }

            // Create edge in database
            const edgeId = await createEdge({
                data: {
                    workflowId: sourceNode?.data?.workflowId,
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
                    workflowId: sourceNode?.data?.workflowId,
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

    addNode: async (agent: AgentData) => {
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
            console.log('addNode called with agent:', agent.id);
        }

        try {
            const { nodes, edges } = get();
            const parentNode = nodes.find(node => node.id === agent.parentNodeId);

            if (!parentNode?.data?.workflowId) {
                throw new Error('Parent node not found or missing workflowId');
            }

            // Get existing children of the parent node
            const existingChildren = getSiblings(parentNode, edges);
            
            // TODO: Parallel node execution will be implemented in a future update.
            // For now, we restrict each node to having at most one child to maintain
            // a simple linear workflow structure.
            if (existingChildren.length >= 1) {
                alert('Node already has a child. Parallel execution is not yet supported.');
                return;
            }

            // TODO: ensure that an agent and it's tools are associated with this node
            const agentRecord = await fetchAgent({ agentId: agent.id });
            if (!agentRecord?.id) {
                throw new Error('Failed to fetch agent record');
            }

            // Get siblings and calculate positions
            const siblings = getSiblings(parentNode, edges);
            const allNodePositions = calculateNodePositions(parentNode, siblings, edges);

            // Prepare all changes to be applied in a single batch update
            let newNodeId = '';
            let newEdgeId = '';
            
            // Create the new node in the database
            const node = await createNodes({
                data: {
                    agentId: agentRecord.id,
                    workflowId: parentNode.data.workflowId,
                    name: agentRecord.name,
                    description: agentRecord.description,
                    tools: agentRecord.tools?.length && agentRecord.tools || []
                }
            });
            newNodeId = node.id;

            // Update the agent data with the node ID
            const agentStore = useAgentStore.getState();
            const updatedAgentData = {
                ...agent,
                id: newNodeId,
                nodeId: newNodeId
            };
            agentStore.setAgentData(newNodeId, updatedAgentData);

            // Get position for new node
            const newNodePosition = allNodePositions.find(pos => pos.id === 'new-node')?.position;

            // Create edge connecting to parent in the database
            const edgeId = await createEdge({
                data: {
                    workflowId: parentNode.data.workflowId,
                    toNodeId: newNodeId,
                    fromNodeId: parentNode.id
                }
            });
            newEdgeId = edgeId;

            // Prepare the new node with calculated position
            const newNode: Node<NodeData> = {
                id: newNodeId,
                type: NodeType.Agent,
                position: newNodePosition || { x: 0, y: 0 },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
                data: {
                    id: newNodeId,
                    type: NodeType.Agent,
                    workflowId: parentNode.data.workflowId,
                    agentRef: { agentId: agent.id },
                    state: AgentState.Initial
                }
            };

            // Create edge with unique ID and proper data
            const newEdge: Edge<EdgeData> = {
                id: newEdgeId,
                source: parentNode.id,
                target: newNodeId,
                type: EdgeType.Automation,
                animated: true,
                data: {
                    id: newEdgeId,
                    workflowId: parentNode.data.workflowId,
                    toNodeId: newNodeId,
                    fromNodeId: parentNode.id
                }
            };

            // Apply all changes in a single update to reduce rerenders
            if (process.env.NODE_ENV === 'development') {
                console.log('Updating state with new node and edge');
            }
            updateState(set, {
                nodes: [
                    ...nodes,
                    newNode
                ],
                edges: [
                    ...edges,
                    newEdge
                ]
            });

            // Update positions of existing siblings if needed
            if (siblings.length > 0) {
                const nodeChanges = allNodePositions
                    .filter(pos => pos.id !== 'new-node')
                    .map(pos => ({
                        type: 'position' as const,
                        id: pos.id,
                        position: pos.position
                    }));
                get().onNodesChange?.(nodeChanges);
            }

            return newNode;
        } catch (error) {
            console.error('Failed to add node:', error);
            throw error;
        }
    },

    onBeforeDelete: ({ nodes, edges }) => {
        // NOTE: This is a workaround until we implement concurrent node runs
        // where users can change node relations by their edge attachments
        const edgesToDelete = edges.filter(edge => edge.selected);
        
        if (edgesToDelete.length) {
            // If there are edges selected for deletion, prevent the deletion
            return false;
        }
        
        // Allow deletion of nodes (but not edges)
        return true;
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

        updateState(set, {
            nodes: nodes.filter(({ id }) => !deletedNodes.some((node: Node) => node.id === id)),
            edges: edges.filter(({ id }) => !connectedEdges.some((edge: Edge) => edge.id === id))
        });
    }
});
