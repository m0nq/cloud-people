import { type Edge } from '@xyflow/react';
import { type Node } from '@xyflow/react';

import { type NodeData } from '@app-types/workflow/nodes';
import { type EdgeData } from '@app-types/workflow/edges';
import { AgentStatus } from '@app-types/agent/state';
import { updateExecution } from '@lib/actions/execution-actions';
import { Config } from '@config/constants';
import { WorkflowState } from '@app-types/workflow';
import { updateState } from '@stores/workflow';
import { isWorkflowNode } from '@stores/workflow';
import { useAgentStore } from '@stores/agent-store';

const { WorkflowNode } = Config;

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
    const pauseWorkflow = async () => {
        const { workflowExecution } = get();
        if (!workflowExecution?.currentNodeId || !workflowExecution?.sessionId) return;

        try {
            await updateExecution({
                sessionId: workflowExecution.sessionId,
                agentId: workflowExecution.currentNodeId,
                current_status: WorkflowState.Paused,
                input: {
                    nodeId: workflowExecution.currentNodeId,
                    nodeType: WorkflowNode.AgentNode,
                    workflowId: workflowExecution.workflowId
                },
                output: null,
                errors: null,
                metrics: null
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
        if (!workflowExecution?.currentNodeId || !workflowExecution?.sessionId) return;

        const currentNode = nodes.find(n => n.id === workflowExecution.currentNodeId);
        if (!currentNode || !isValidWorkflowNode(currentNode)) return;

        try {
            transitionNode(set, nodes, currentNode.id, AgentStatus.Activating);

            await updateExecution({
                sessionId: workflowExecution.sessionId,
                agentId: workflowExecution.currentNodeId,
                current_status: WorkflowState.Running,
                input: {
                    nodeId: workflowExecution.currentNodeId,
                    nodeType: WorkflowNode.AgentNode,
                    workflowId: workflowExecution.workflowId
                },
                output: null,
                errors: null,
                metrics: null
            });

            updateState(set, {
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
    };

    const progressWorkflow = async (nodeId: string, status: AgentStatus) => {
        const { nodes, workflowExecution } = get();
        const node = nodes.find(n => n.id === nodeId);
        if (!node || !isValidWorkflowNode(node)) return;

        try {
            // Update agent state
            const agentStore = useAgentStore.getState();
            agentStore.transition(nodeId, status);

            // Get current workflow execution
            const workflowExecution = get().workflowExecution;
            if (!workflowExecution) {
                return;
            }

            // If node is complete, check for next node
            if (status === AgentStatus.Complete) {
                const nextNode = findNextNode(nodes, get().edges, nodeId);
                if (nextNode && isWorkflowNode(nextNode)) {
                    // Start next node with Activating state per state diagram
                    transitionNode(set, nodes, nextNode.id, AgentStatus.Activating);

                    // Update execution record with next node
                    await updateExecution({
                        agentId: nextNode.id,
                        sessionId: workflowExecution.sessionId,
                        current_status: AgentStatus.Activating,
                        input: {
                            nodeId: nextNode.id,
                            nodeType: nextNode.type,
                            workflowId: nextNode.data.workflowId
                        },
                        history: [],
                        metrics: {},
                        errors: null,
                        output: null
                    });

                    updateState(set, {
                        workflowExecution: {
                            ...workflowExecution,
                            currentNodeId: nextNode.id
                        }
                    });
                } else {
                    // No next node means workflow is complete
                    // Update execution record to complete
                    await updateExecution({
                        agentId: nodeId,
                        sessionId: workflowExecution.sessionId,
                        current_status: AgentStatus.Complete,
                        input: {
                            nodeId,
                            nodeType: node.type,
                            workflowId: node.data.workflowId
                        },
                        history: [],
                        metrics: {},
                        errors: null,
                        output: null
                    });

                    updateState(set, {
                        workflowExecution: {
                            ...workflowExecution,
                            state: WorkflowState.Completed,
                            completedAt: new Date()
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error in progressWorkflow:', error);
            // If there's an error during state transition, set node to error state
            transitionNode(set, nodes, nodeId, AgentStatus.Error);

            if (workflowExecution) {
                // Update execution record with error
                await updateExecution({
                    agentId: nodeId,
                    sessionId: workflowExecution.sessionId,
                    current_status: AgentStatus.Error,
                    input: {
                        nodeId,
                        nodeType: node.type,
                        workflowId: node.data.workflowId
                    },
                    history: [],
                    metrics: {},
                    errors: {
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        timestamp: new Date().toISOString()
                    },
                    output: null
                });

                updateState(set, {
                    workflowExecution: {
                        ...workflowExecution,
                        state: WorkflowState.Paused,
                        error: error instanceof Error ? error.message : 'Unknown error occurred'
                    }
                });
            }
            throw error;
        }
    };

    return {
        pauseWorkflow,
        resumeWorkflow,
        progressWorkflow
    };
};
