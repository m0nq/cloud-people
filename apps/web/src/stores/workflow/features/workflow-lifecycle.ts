import { type Node } from '@xyflow/react';

import { createWorkflow } from '@lib/actions/workflow-actions';
import { createExecution } from '@lib/actions/execution-actions';
import { initialState } from '../constants';
import { updateState } from '@stores/workflow';
import { findRootNode } from '@stores/workflow';
import { isValidWorkflowNode } from '@stores/workflow';
import { findNextNode } from '@stores/workflow';
import { WorkflowState } from '@app-types/workflow';
import type { WorkflowExecution } from '@app-types/workflow';
import type { NodeData } from '@app-types/workflow';
import { AgentStatus } from '@app-types/agent';
import { fetchWorkflowNodes } from '@lib/actions/sandbox-actions';
import { fetchWorkflowEdges } from '@lib/actions/sandbox-actions';
import { transitionNode } from './workflow-execution';
import { createNodes } from '@lib/actions/node-actions';
import { Config } from '@config/constants';
import { ROOT_NODE_POSITION } from '@config/layout.const';
import { updateNodes } from '@lib/actions/node-actions';

const { WorkflowNode } = Config;

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
                    type: WorkflowNode.RootNode,
                    data: {
                        id: newNode.id,
                        type: WorkflowNode.RootNode,
                        workflowId,
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
        },

        startWorkflow: async () => {
            const { nodes, edges } = get();
            const rootNode = findRootNode(nodes);

            if (!rootNode) {
                throw new Error('No root node found');
            }

            if (!rootNode.data.workflowId) {
                throw new Error('Root node has no workflow ID');
            }

            try {
                const sessionId = crypto.randomUUID();

                // Find the first node connected to root
                const firstNode = findNextNode(nodes, edges, rootNode.id);
                if (!firstNode || !isValidWorkflowNode(firstNode)) {
                    throw new Error('No valid starting node found');
                }

                // Initialize all non-root nodes to Idle state
                nodes.filter(node => node.id !== rootNode.id).forEach(node => transitionNode(set, nodes, node.id, AgentStatus.Idle));

                // Start with first node
                transitionNode(set, nodes, firstNode.id, AgentStatus.Activating);

                // Create execution record in database
                const dbExecution = await createExecution({
                    sessionId,
                    agentId: firstNode.id,
                    input: {
                        nodeId: firstNode.id,
                        nodeType: firstNode.type,
                        workflowId: rootNode.data.workflowId
                    },
                    current_status: AgentStatus.Activating,
                    history: [],
                    metrics: {},
                    errors: null,
                    output: null
                });

                // Update workflow state with execution record
                const workflowExecution: WorkflowExecution = {
                    workflowId: rootNode.data.workflowId,
                    sessionId: dbExecution.session_id,
                    currentNodeId: firstNode.id,
                    state: WorkflowState.Running,
                    startedAt: new Date(dbExecution.created_at)
                };

                updateState(set, { workflowExecution });
            } catch (error) {
                console.error('Failed to start workflow:', error);
                throw error;
            }
        }

        // createExecution: async () => {
        //     const { workflowId } = get();
        //     if (!workflowId) {
        //         throw new Error('No workflow ID available');
        //     }
        //
        //     try {
        //         const execution = await createExecution({
        //             input: { workflowId },
        //             output: null,
        //             errors: null,
        //             metrics: null
        //         });
        //
        //         updateState(set, {
        //             workflowExecution: {
        //                 session_id: execution.session_id,
        //                 currentNodeId: null,
        //                 state: WorkflowState.Created,
        //                 needsAssistance: false,
        //                 error: null
        //             }
        //         });
        //
        //         return execution;
        //     } catch (err) {
        //         console.error('Failed to create execution:', err);
        //         throw err;
        //     }
        // }
    };
}
