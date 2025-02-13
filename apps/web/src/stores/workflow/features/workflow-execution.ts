import { type Edge } from '@xyflow/react';
import { type Node } from '@xyflow/react';

import { type NodeData } from '@app-types/workflow/nodes';
import { type EdgeData } from '@app-types/workflow/edges';
import { AgentStatus } from '@app-types/agent/state';
import { updateExecution } from '@lib/actions/execution-actions';
import { createExecution } from '@lib/actions/execution-actions';
import { WorkflowState } from '@app-types/workflow';
import { updateState } from '@stores/workflow';
import { isWorkflowNode } from '@stores/workflow';
import { findRootNode } from '@stores/workflow';
import { NodeType } from '@app-types/workflow/node-types';
import { useAgentStore } from '@stores/agent-store';

const isValidWorkflowNode = (node: Node<NodeData> | undefined): node is Node<NodeData> => node !== undefined;

const findNextNode = (nodes: Node<NodeData>[], edges: Edge<EdgeData>[], currentNodeId: string): Node<NodeData> | undefined => {
    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
    if (outgoingEdges.length === 0) return undefined;

    // For now, just take the first outgoing edge's target
    const nextNodeId = outgoingEdges[0].target;
    return nodes.find(node => node.id === nextNodeId);
};

export const transitionNode = (set: Function, nodes: Node<NodeData>[], nodeId: string, status: AgentStatus) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !isWorkflowNode(node)) return;

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

    // Update workflow node state
    const updatedNodes = nodes.map(n => {
        if (n.id === nodeId && isWorkflowNode(n)) {
            return {
                ...n,
                data: {
                    ...n.data,
                    state: workflowState
                }
            };
        }
        return n;
    });

    // Update workflow store
    updateState(set, { nodes: updatedNodes });

    // If this is an agent node, update agent state
    if (node.type === NodeType.Agent) {
        const agentStore = useAgentStore.getState();
        agentStore.transition(nodeId, status);
    }
};

export const createWorkflowExecution = (set: Function, get: Function) => {
    const startWorkflow = async () => {
        const { nodes, edges } = get();
        const rootNode = findRootNode(nodes);

        if (!rootNode) {
            throw new Error('No root node found');
        }

        // Get workflow ID from root node
        const workflowId = rootNode.data?.workflowId;
        if (!workflowId) {
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

            // Create execution record in database with workflow ID from root node
            const workflowExecution = await createExecution({
                nodeId: firstNode.id,
                workflowId,
                currentStatus: WorkflowState.Running
            });

            // Update workflow state with execution record
            updateState(set, { workflowExecution });
        } catch (error) {
            console.error('Failed to start workflow:', error);
            throw error;
        }
    };

    const pauseWorkflow = async () => {
        const { nodes, workflowExecution } = get();
        if (!workflowExecution) return;

        try {
            // Find all agent nodes that are not in a terminal state
            const agentNodes = nodes.filter(
                node =>
                    node.type === NodeType.Agent &&
                    isWorkflowNode(node) &&
                    ![AgentStatus.Complete, AgentStatus.Error, AgentStatus.Assistance].includes(useAgentStore.getState().getAgentState(node.id)?.status || AgentStatus.Initial)
            );

            // Set all active agents to initial so they're editable
            agentNodes.forEach(node => {
                transitionNode(set, nodes, node.id, AgentStatus.Initial);
            });

            // Update workflow execution state
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
        const { nodes, workflowExecution } = get();
        if (!workflowExecution) return;

        try {
            // Find current node and transition it back to Activating
            const currentNode = nodes.find(n => n.id === workflowExecution.currentNodeId);
            if (!currentNode || !isWorkflowNode(currentNode)) return;

            // Set current node to Activating to resume workflow
            transitionNode(set, nodes, currentNode.id, AgentStatus.Activating);

            // Find all agent nodes in Initial state
            const initialAgents = nodes.filter(
                node =>
                    node.type === NodeType.Agent &&
                    isWorkflowNode(node) &&
                    node.id !== currentNode.id && // Skip current node
                    useAgentStore.getState().getAgentState(node.id)?.status === AgentStatus.Initial
            );

            // Set all agents in initial state to idle
            initialAgents.forEach(node => {
                transitionNode(set, nodes, node.id, AgentStatus.Idle);
            });

            // Update workflow execution state
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
        const { nodes, edges, workflowExecution } = get();
        const node = nodes.find(n => n.id === nodeId);
        if (!node || !isWorkflowNode(node)) return;

        try {
            // Update node state
            transitionNode(set, nodes, nodeId, status);

            // Get current workflow execution
            if (!workflowExecution) return;

            // If node is complete, check for next node
            if (status === AgentStatus.Complete) {
                const nextNode = findNextNode(nodes, edges, nodeId);
                if (nextNode && isWorkflowNode(nextNode)) {
                    // Start next node
                    transitionNode(set, nodes, nextNode.id, AgentStatus.Activating);

                    // Update execution record with next node
                    await updateExecution({
                        ...workflowExecution,
                        nodeId: nextNode.id
                    });

                    updateState(set, {
                        workflowExecution: {
                            ...workflowExecution,
                            currentNodeId: nextNode.id
                        }
                    });
                } else {
                    // No next node means workflow is complete
                    await updateExecution({
                        ...workflowExecution,
                        currentStatus: WorkflowState.Completed
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

            // Transition node to initial state
            transitionNode(set, nodes, nodeId, AgentStatus.Initial);

            if (workflowExecution) {
                // Update execution record with error
                await updateExecution({
                    ...workflowExecution,
                    currentStatus: WorkflowState.Paused,
                    metrics: {},
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
};
