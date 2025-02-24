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
            const updatedNodes = applyNodeChanges(changes, nodes) as (Node<NodeData> | Node<InitialStateNodeData>)[];
            updateState(set, { nodes: updatedNodes });

            // Update database for each changed node
            await Promise.all(
                updatedNodes.filter(isValidWorkflowNode)
                    .map(async node => {
                        await updateNodes({
                            data: {
                                workflowId: node.data.workflowId,
                                nodeId: node.id,
                                set: {
                                    state: node.data.state,
                                    updated_at: new Date()
                                }
                            }
                        });
                    })
            );
        } catch (error) {
            console.error('Failed to update nodes:', error);
            // Rollback on error
            updateState(set, { nodes: originalNodes });
            throw new Error('Failed to update nodes. Changes have been reverted.');
        }
    },

    onEdgesChange: async (changes: EdgeChange<Edge<EdgeData>>[]) => {
        // Clear memoization cache when edges change
        // findNextNodeMemo.cache.clear?.();
        // getConnectedNodesMemo.cache.clear?.();

        // Keep track of original edges for rollback
        const originalEdges = get().edges;

        try {
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
            const updatedEdges = applyEdgeChanges<Edge<EdgeData>>(changes, originalEdges);
            updateState(set, { edges: updatedEdges });

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
            updateState(set, { edges: originalEdges });
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

            // Update positions of existing siblings
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

            // Get position for new node
            const newNodePosition = allNodePositions.find(pos => pos.id === 'new-node')?.position;

            // Create the new node
            const node = await createNodes({
                data: {
                    agentId: agentRecord.id,
                    workflowId: parentNode.data.workflowId,
                    name: agentRecord.name,
                    description: agentRecord.description,
                    tools: agentRecord.tools?.length && agentRecord.tools || []
                }
            });

            // Create the new node with calculated position
            const newNode: Node<NodeData> = {
                id: node.id,
                type: NodeType.Agent,
                position: newNodePosition || { x: 0, y: 0 },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
                dragHandle: '.nodrag',
                data: {
                    id: node.id,
                    type: NodeType.Agent,
                    workflowId: parentNode.data.workflowId,
                    agentRef: { agentId: agent.id },
                    state: AgentState.Initial
                }
            };

            // Create edge connecting to parent
            const edgeId = await createEdge({
                data: {
                    workflowId: parentNode.data.workflowId,
                    toNodeId: newNode.id,
                    fromNodeId: parentNode.id
                }
            });

            // Create edge with unique ID and proper data
            const newEdge: Edge<EdgeData> = {
                id: edgeId,
                source: parentNode.id,
                target: newNode.id,
                type: EdgeType.Automation,
                animated: true,
                data: {
                    id: edgeId,
                    workflowId: parentNode.data.workflowId,
                    toNodeId: newNode.id,
                    fromNodeId: parentNode.id
                }
            };

            // Update store with both new node and edge atomically
            updateState(set, {
                nodes: [...nodes, newNode],
                edges: [...edges, newEdge]
            });

            return newNode;
        } catch (error) {
            console.error('Failed to add node:', error);
            throw error;
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

        updateState(set, {
            nodes: nodes.filter(({ id }) => !deletedNodes.some((node: Node) => node.id === id)),
            edges: edges.filter(({ id }) => !connectedEdges.some((edge: Edge) => edge.id === id))
        });
    }
});
