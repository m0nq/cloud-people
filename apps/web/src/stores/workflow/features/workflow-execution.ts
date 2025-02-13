import { type Edge } from '@xyflow/react';
import { type Node } from '@xyflow/react';

import { type NodeData } from '@app-types/workflow/nodes';
import { type EdgeData } from '@app-types/workflow/edges';
import { AgentStatus } from '@app-types/agent/state';
import { updateExecution } from '@lib/actions/execution-actions';
import { createExecution } from '@lib/actions/execution-actions';
import { WorkflowState } from '@app-types/workflow';
import type { WorkflowExecution } from '@app-types/workflow';
import { updateState } from '@stores/workflow';
import { isWorkflowNode } from '@stores/workflow';
import { findRootNode } from '@stores/workflow';
import { NodeType } from '@app-types/workflow/node-types';

const isValidWorkflowNode = (node: Node<NodeData> | undefined): node is Node<NodeData> => node !== undefined;

const findNextNode = (nodes: Node<NodeData>[], edges: Edge<EdgeData>[], currentNodeId: string): Node<NodeData> | undefined => {
    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
    if (outgoingEdges.length === 0) return undefined;

    // For now, just take the first outgoing edge's target
    const nextNodeId = outgoingEdges[0].target;
    return nodes.find(node => node.id === nextNodeId);
};

export const transitionNode = (set: Function, nodes: Node<NodeData>[], nodeId: string, status: AgentStatus) => {
    const updatedNodes = nodes.map(node => {
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
                case AgentStatus.Error:
                    workflowState = WorkflowState.Paused;
                    break;
                case AgentStatus.Complete:
                    workflowState = WorkflowState.Completed;
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

    updateState(set, { nodes: updatedNodes });
};

export const createWorkflowExecution = (set: Function, get: Function) => {
        const startWorkflow = async () => {
            const { nodes, edges } = get();
            const rootNode = findRootNode(nodes);

            if (!rootNode) {
                throw new Error('No root node found');
            }

            if (!rootNode.data.workflowId) {
                throw new Error('Root node has no workflow ID');
            }

            try {
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
                    nodeId: firstNode.id,
                    workflowId: rootNode.data.workflowId,
                    current_status: AgentStatus.Activating,
                    metrics: {},
                    errors: null
                });

                // Update workflow state with execution record
                const workflowExecution: WorkflowExecution = {
                    id: dbExecution.id,
                    workflowId: rootNode.data.workflowId,
                    currentNodeId: firstNode.id,
                    state: WorkflowState.Running,
                    startedAt: new Date(dbExecution.created_at)
                };

                updateState(set, { workflowExecution });
            } catch (error) {
                console.error('Failed to start workflow:', error);
                throw error;
            }
        };

        const pauseWorkflow = async () => {
            const { workflowExecution } = get();
            if (!workflowExecution?.currentNodeId || !workflowExecution?.sessionId) return;

            try {
                await updateExecution({
                    ...workflowExecution,
                    current_status: WorkflowState.Paused
                });

                updateState(set, {
                    workflowExecution: {
                        ...workflowExecution,
                        state: WorkflowState.Paused
                    }
                });
            } catch (error) {
                console.error('Failed to pause workflow:', error);
                throw error;
            }
        };

        const resumeWorkflow = async () => {
            const { workflowExecution, nodes } = get();
            if (!workflowExecution?.currentNodeId) return;

            const currentNode = nodes.find(n => n.id === workflowExecution.currentNodeId);
            if (!currentNode || !isValidWorkflowNode(currentNode)) return;

            try {
                transitionNode(set, nodes, currentNode.id, AgentStatus.Activating);

                await updateExecution({
                    ...workflowExecution,
                    current_status: WorkflowState.Running
                });

                updateState(set, {
                    workflowExecution: {
                        ...workflowExecution,
                        state: WorkflowState.Running
                    }
                });
            } catch (error) {
                console.error('Failed to resume workflow:', error);
                throw error;
            }
        };

        const progressWorkflow = async (nodeId: string, status: AgentStatus) => {
            const { nodes, workflowExecution } = get();
            const node: Node<NodeData> | undefined = nodes.find((n: Node<NodeData>) => n.id === nodeId);
            if (!node || !isValidWorkflowNode(node)) return;

            try {
                // Get current workflow execution
                const { workflowExecution } = get();
                if (!workflowExecution) return;

                // If node is complete, check for next node
                if (status === AgentStatus.Complete) {
                    const nextNode = findNextNode(nodes, get().edges, nodeId);
                    if (nextNode && isWorkflowNode(nextNode)) {
                        // Start next node if it's an agent node
                        if (nextNode.type === NodeType.Agent) {
                            transitionNode(set, nodes, nextNode.id, AgentStatus.Activating);
                        }

                        // Update execution record with next node
                        await updateExecution({
                            ...workflowExecution,
                            nodeId: nextNode.id,
                            current_status: AgentStatus.Activating
                        });

                        updateState(set, {
                            workflowExecution: {
                                ...workflowExecution,
                                currentNodeId: nextNode.id,
                                current_status: AgentStatus.Activating
                            }
                        });
                    } else {
                        // No next node means workflow is complete
                        const completedAt = new Date().toISOString();
                        await updateExecution({
                            ...workflowExecution,
                            nodeId,
                            current_status: AgentStatus.Complete,
                            completedAt
                        });

                        updateState(set, {
                            workflowExecution: {
                                ...workflowExecution,
                                state: WorkflowState.Completed,
                                completedAt
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error in progressWorkflow:', error);

                // Only transition agent nodes
                if (node.type === NodeType.Agent) {
                    transitionNode(set, nodes, nodeId, AgentStatus.Error);
                }

                if (workflowExecution) {
                    // Update execution record with error
                    await updateExecution({
                        ...workflowExecution,
                        current_status: AgentStatus.Error,
                        errors: {
                            message: error instanceof Error ? error.message : 'Unknown error occurred',
                            timestamp: new Date().toISOString()
                        }
                    });

                    updateState(set, {
                        workflowExecution: {
                            ...workflowExecution,
                            state: WorkflowState.Paused,
                            error: error instanceof Error ? error.message : 'Unknown error occurred'
                        }
                    });
                }
            }
        };

        return {
            startWorkflow,
            pauseWorkflow,
            resumeWorkflow,
            progressWorkflow
        };
    }
;
