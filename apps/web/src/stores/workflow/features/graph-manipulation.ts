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
import { WorkflowState } from '@app-types/workflow';
import type { WorkflowStore } from '@stores/workflow';
import { isValidWorkflowNode } from '@stores/workflow';
import { updateState } from '@stores/workflow';
import { validateConnection } from '@stores/workflow';
import { Config } from '@config/constants';
import type { AgentData } from '@app-types/agent';
import { AgentStatus } from '@app-types/agent';
import { createAgent } from '@lib/actions/agent-actions';
import { NODE_SPACING_X } from '@config/layout.const';
import { NODE_SPACING_Y } from '@config/layout.const';
import type { QueryConfig } from '@app-types/api';
import { useAgentStore } from '@stores/agent-store';

const { WorkflowNode } = Config;

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
                updatedNodes.filter(isValidWorkflowNode).map(async node => {
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
                type: WorkflowNode.AutomationEdge,
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

    addNode: async (agent: AgentData): Promise<void> => {
        try {
            const parentNode = get().nodes.find((n: Node<NodeData>) => n.id === agent.parentNodeId);

            if (!parentNode || !parentNode.data || !parentNode.data.workflowId) {
                console.error('Parent node not found or missing workflowId. Modal state:', parentNode);
                return;
            }

            const workflowId = parentNode.data.workflowId;

            // Create the agent first
            const agentRecord = await createAgent({
                data: {
                    config: {
                        name: agent.name,
                        description: agent.description,
                        workflowId: workflowId
                    },
                    tools: agent.tools || []
                }
            });

            if (!agentRecord?.id) {
                throw new Error('Failed to create agent record');
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

            // Create node with agent ID
            const nodeConfig: QueryConfig = {
                data: {
                    workflowId,
                    nodeType: WorkflowNode.AgentNode,
                    data: {
                        agentId: agentRecord.id,
                        workflowId,
                        name: agent.name,
                        description: agent.description,
                        tools: agent.tools || []
                    }
                }
            };

            const node = await createNodes(nodeConfig);

            if (!node?.id) {
                throw new Error('Failed to create node');
            }

            // Initialize agent state before creating the node
            const agentStore = useAgentStore.getState();
            agentStore.updateAgent(node.id, {
                status: AgentStatus.Initial,
                isEditable: true
            });

            // Create new node with agent data and the ID from the created node
            const newNode = {
                id: node.id,
                type: WorkflowNode.AgentNode,
                data: {
                    // This needs to match our NodeData type
                    id: node.id, // Add this
                    type: WorkflowNode.AgentNode, // Add this
                    workflowId,
                    agent: { ...agent },
                    status: AgentStatus.Initial,
                    state: WorkflowState.Initial
                },
                position: newPosition,
                dragHandle: '.nodrag',
                sourcePosition: Position.Right,
                targetPosition: Position.Left
            } as Node<NodeData>;

            try {
                // Update node state in database
                await updateNodes({
                    data: {
                        workflowId: workflowId,
                        nodeId: node.id,
                        set: {
                            state: WorkflowState.Initial,
                            current_step: '0',
                            data: newNode.data,
                            updated_at: new Date()
                        }
                    }
                });

                // Update UI with the new node
                updateState(set, { nodes: [...get().nodes, newNode] });

                // Create edge if parent node exists
                if (agent.parentNodeId) {
                    const edgeId = await createEdge({
                        data: {
                            workflowId: parentNode.data?.workflowId,
                            toNodeId: node.id,
                            fromNodeId: parentNode.id
                        }
                    });

                    if (!edgeId) {
                        throw new Error('Failed to create edge');
                    }

                    // Update the store with the edge
                    const newEdge = {
                        id: edgeId,
                        source: parentNode.id,
                        target: node.id,
                        type: WorkflowNode.AutomationEdge,
                        animated: true,
                        data: {
                            id: edgeId,
                            workflowId,
                            toNodeId: node.id,
                            fromNodeId: parentNode.id
                        }
                    } as Edge<EdgeData>;

                    updateState(set, {
                        edges: [...get().edges, newEdge]
                    });
                }
            } catch (error) {
                console.error('Failed to update node or create edge:', error);
                throw error;
            }
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
