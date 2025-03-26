import { type Node } from '@xyflow/react';

import { findRootNode } from '@stores/workflow';
import { updateState } from '@stores/workflow';
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

        addAgentToWorkflow: async (agent: AgentData) => {
            const { nodes } = get();
            let parentNodeId = agent.parentNodeId;

            // Check if we need to create a new workflow
            if (!parentNodeId || !nodes.find(node => node.id === parentNodeId)) {
                try {
                    // Create a new workflow with root node
                    const workflowId = await get().createNewWorkflow();

                    // Get the updated nodes after workflow creation
                    const updatedNodes = get().nodes;

                    // Get the root node that was just created
                    const rootNode = findRootNode(updatedNodes);

                    if (!rootNode) {
                        throw new Error('Failed to find root node after workflow creation');
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
                // Update agent with correct parent node
                const updatedAgent = {
                    ...agent,
                    parentNodeId
                };

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
                    nodes: fetchWorkflowNodes(),
                    edges: fetchWorkflowEdges()
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
