import { type Node } from '@xyflow/react';

import { findRootNode } from '@stores/workflow';
import { updateState } from '@stores/workflow';
import { isInitialStateNode } from '@stores/workflow';
import { hasWorkflowId } from '@stores/workflow';
import { createWorkflow } from '@lib/actions/workflow-actions';
import { initialState } from '../constants';
import { WorkflowState } from '@app-types/workflow';
import type { NodeData } from '@app-types/workflow';
import { fetchWorkflowNodes } from '@lib/actions/canvas-actions';
import { fetchWorkflowEdges } from '@lib/actions/canvas-actions';
import { createNodes } from '@lib/actions/node-actions';
import { updateNodes } from '@lib/actions/node-actions';
import { ROOT_NODE_POSITION } from '@config/layout.const';
import { NodeType } from '@app-types/workflow/node-types';
import type { AgentData } from '@app-types/agent';
import { v4 as uuidv4 } from 'uuid';

export function createWorkflowLifecycle(set: Function, get: Function) {
    return {
        createNewWorkflow: async () => {
            try {
                // Create workflow first
                const workflowId = await createWorkflow();
                if (!workflowId) {
                    throw new Error('Failed to create workflow');
                }

                // Create root node in database
                const dbNode = await createNodes({
                    data: {
                        workflowId,
                        nodeType: 'root'
                    }
                });
                if (!dbNode || !dbNode?.id) {
                    throw new Error('Failed to create node');
                }

                // Map database node to UI node, ensuring workflowId is set
                const node = {
                    id: dbNode.id,
                    type: NodeType.Root,
                    data: {
                        id: dbNode.id,
                        type: NodeType.Root,
                        workflowId  // Explicitly set workflowId
                    },
                    position: ROOT_NODE_POSITION
                } as Node<NodeData>;

                // Update UI state
                updateState(set, {
                    nodes: [node],
                    edges: []
                });

                // Update node in database
                try {
                    await updateNodes({
                        data: {
                            workflowId,
                            nodeId: node.id,
                            set: {
                                state: WorkflowState.Initial,
                                current_step: '0',
                                updated_at: new Date()
                            }
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

        createMockWorkflow: () => {
            console.log('Workflow Store: Creating MOCK workflow');
            try {
                // Generate mock IDs
                const mockWorkflowId = `mock-wf-${uuidv4()}`;
                const mockNodeId = `mock-root-${uuidv4()}`;

                // Create mock root node for UI state
                const mockNode = {
                    id: mockNodeId,
                    type: NodeType.Root,
                    data: {
                        id: mockNodeId,
                        type: NodeType.Root,
                        workflowId: mockWorkflowId, // Set mock workflowId
                        // Add any other default data needed for a root node
                        label: 'Workflow Root',
                        state: undefined, // Changed from WorkflowState.Initial
                        current_step: '0',
                        agentRef: { agentId: '' } // Changed to placeholder object
                    },
                    position: ROOT_NODE_POSITION
                } as Node<NodeData>;

                // Update UI state directly
                updateState(set, {
                    nodes: [mockNode],
                    edges: []
                    // Removed workflowId: mockWorkflowId from here
                });

                console.log('Mock workflow created locally with root node:', mockNode);
                return mockWorkflowId; // Return mock ID for potential use
            } catch (error) {
                console.error('Failed to create mock workflow:', error);
                // Handle potential state update errors if necessary
            }
        },

        addAgentToWorkflow: async (agent: AgentData) => {
            const { nodes, edges } = get();
            let parentNodeId = agent.parentNodeId;
            let workflowId: string | null = null;

            // If there's an existing workflow but no specific parent node is provided,
            // find the leaf node of the workflow to use as parent
            if (!parentNodeId && nodes.length > 0) {
                // Find nodes that have no outgoing edges (leaf nodes)
                const nodesWithOutgoingEdges = new Set(edges.map(edge => edge.source));

                // Find valid leaf nodes (must be valid workflow nodes, not initial state or root nodes)
                const leafNodes = nodes.filter(node =>
                    !isInitialStateNode(node) && // Not an initial state node
                    node.type !== NodeType.Root && // Not a root node
                    !nodesWithOutgoingEdges.has(node.id) && // No outgoing edges
                    hasWorkflowId(node) // Must have a workflowId
                );

                // If we found leaf nodes, use the first one as parent
                if (leafNodes.length > 0) {
                    parentNodeId = leafNodes[0].id;
                    console.log('Using leaf node as parent:', parentNodeId);
                } else if (nodes.length > 0) {
                    // If no valid leaf nodes but we have nodes, find the root node
                    const rootNode = findRootNode(nodes);
                    if (rootNode && hasWorkflowId(rootNode)) {
                        parentNodeId = rootNode.id;
                        console.log('Using root node as parent:', parentNodeId);
                    }
                }
            }

            // Check if we need to create a new workflow
            if (!parentNodeId || !nodes.find(node => node.id === parentNodeId && hasWorkflowId(node))) {
                try {
                    // Create a new workflow with root node
                    workflowId = await get().createNewWorkflow();
                    console.log('Created new workflow with ID:', workflowId);

                    // IMPORTANT: We need to ensure the state is updated and accessible
                    // Get the updated nodes after workflow creation
                    const updatedNodes = get().nodes;
                    console.log('Updated nodes after workflow creation:', updatedNodes);

                    if (!updatedNodes || updatedNodes.length === 0) {
                        throw new Error('No nodes found after workflow creation');
                    }

                    // Get the root node that was just created
                    const rootNode = findRootNode(updatedNodes);
                    console.log('Root node found:', rootNode);

                    if (!rootNode) {
                        throw new Error('Failed to find root node after workflow creation');
                    }

                    if (!hasWorkflowId(rootNode)) {
                        throw new Error('Root node is missing workflowId after workflow creation');
                    }

                    // Use the root node as parent
                    parentNodeId = rootNode.id;
                } catch (error) {
                    console.error('Failed to create workflow:', error);
                    throw error;
                }
            }

            // Now add the agent to the workflow (existing or new)
            try {
                // Double-check that the parent node exists in the current state and is valid
                const currentNodes = get().nodes;
                const parentNode = currentNodes.find(node => node.id === parentNodeId);

                if (!parentNode) {
                    throw new Error(`Parent node ${parentNodeId} not found in current state`);
                }

                if (!hasWorkflowId(parentNode)) {
                    throw new Error(`Parent node ${parentNodeId} is missing workflowId`);
                }

                // Update agent with correct parent node
                const updatedAgent = {
                    ...agent,
                    parentNodeId
                };

                console.log('Adding agent with parent node:', parentNodeId);

                // Add the node to the workflow using the existing addNode method
                return await get().addNode(updatedAgent);
            } catch (error) {
                console.error('Failed to add agent to workflow:', error);
                throw error;
            }
        },

        fetchGraph: async (workflowId: string) => {
            try {
                // used when needing to get a workflow graph already stored in the db
                // make a fetch to back end api to get a workflow by the id
                // will need to parse graph into singular lists of nodes and edges
                // then update zustand state
                updateState(set, {
                    nodes: await fetchWorkflowNodes(), // Added await
                    edges: await fetchWorkflowEdges()  // Added await
                });
            } catch (error) {
                console.error('Failed to fetch graph from database:', error);
                // TODO: Add error handling/recovery
            }
        },

        reset: () => {
            updateState(set, initialState);
        }
    };
}
