import { type Node } from '@xyflow/react';

import { createWorkflow } from '@lib/actions/workflow-actions';
import { initialState } from '../constants';
import { updateState } from '@stores/workflow';
import { WorkflowState } from '@app-types/workflow';
import type { NodeData } from '@app-types/workflow';
import { fetchWorkflowNodes } from '@lib/actions/sandbox-actions';
import { fetchWorkflowEdges } from '@lib/actions/sandbox-actions';
import { createNodes } from '@lib/actions/node-actions';
import { updateNodes } from '@lib/actions/node-actions';
import { ROOT_NODE_POSITION } from '@config/layout.const';
import { NodeType } from '@app-types/workflow/node-types';

export function createWorkflowLifecycle(set: Function, get: Function) {
    return {
        createNewWorkflow: async () => {
            try {
                // Create workflow first
                const workflowId = await createWorkflow();
                if (!workflowId) {
                    throw new Error('Failed to create workflow');
                }

                // Create root node
                const newNode: Node<NodeData> = await createNodes({
                    data: {
                        workflowId,
                        nodeType: 'root'
                    }
                });
                if (!newNode || !newNode?.id) {
                    throw new Error('Failed to create node');
                }

                const node = {
                    id: newNode.id,
                    type: NodeType.Root,
                    data: {
                        id: newNode.id,
                        type: NodeType.Root,
                        workflowId
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
