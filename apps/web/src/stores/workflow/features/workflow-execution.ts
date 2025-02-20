import { type Edge } from '@xyflow/react';
import { type Node } from '@xyflow/react';

import { type NodeData } from '@app-types/workflow/nodes';
import { type EdgeData } from '@app-types/workflow/edges';
import { AgentState } from '@app-types/agent/state';
import { updateExecution } from '@lib/actions/execution-actions';
import { createExecution } from '@lib/actions/execution-actions';
import { WorkflowState } from '@app-types/workflow';
import type { GraphState } from '@app-types/workflow';
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

export const transitionNode = (set: Function, nodes: Node<NodeData>[], nodeId: string, newState: AgentState) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !isWorkflowNode(node)) return;

    // If this is an agent node, update agent state
    if (node.data.type === NodeType.Agent) {
        const { agentId } = node.data.agentRef;
        const agentStore = useAgentStore.getState();
        const currentAgent = agentStore.getAgentState(agentId);

        if (!currentAgent) {
            console.error(`Agent ${agentId} not found`);
            return;
        }

        const currentState = currentAgent.state;
        if (agentStore.isTransitionAllowed(agentId, newState)) {
            agentStore.transition(agentId, newState);

            // Update node data with the new agent state
            const updatedNodes = nodes.map(n => {
                if (isWorkflowNode(n) && n.data.agentRef.agentId === agentId) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            state: newState // Update with AgentState directly
                        }
                    };
                }
                return n;
            });

            // Update workflow store
            updateState(set, { nodes: updatedNodes });
        } else {
            console.error(`Invalid transition from ${currentAgent.state} to ${newState}`);
        }
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
            nodes.filter(node => node.id !== rootNode.id)
                .forEach(node => {
                    transitionNode(set, nodes, node.id, AgentState.Idle);
                });

            // Start with first node
            transitionNode(set, nodes, firstNode.id, AgentState.Activating);

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
        const { nodes, workflowExecution }: GraphState = get();
        if (!workflowExecution) return;

        try {
            // Get agent store state directly instead of using hook
            const agentStore = useAgentStore.getState();

            // Find all agent nodes that are not in a terminal state
            const agentNodes = nodes.filter(node =>
                node.data.type === NodeType.Agent &&
                isWorkflowNode(node) &&
                ![AgentState.Complete, AgentState.Error, AgentState.Assistance, AgentState.Initial].includes(
                    agentStore.getAgentState(node.data.agentRef.agentId)?.state || AgentState.Initial
                )
            );

            // Set all active agents to initial state
            agentNodes.forEach(node => {
                try {
                    transitionNode(set, nodes, node.id, AgentState.Initial);
                } catch (error) {
                    console.error(`Failed to transition node ${node.id} to AgentState.Initial:`, error);
                }
            });

            // Update workflow execution state
            await updateExecution({
                id: workflowExecution.id,
                nodeId: workflowExecution.currentNodeId,
                workflowId: workflowExecution.workflowId,
                currentStatus: WorkflowState.Paused
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
            // Find current node
            const currentNode = nodes.find(n => n.id === workflowExecution.currentNodeId);
            if (!currentNode || !isWorkflowNode(currentNode)) return;

            // Set current node to Activating to resume workflow
            transitionNode(set, nodes, currentNode.id, AgentState.Activating);

            // Find all agent nodes that are not root and not current node
            nodes.filter((node: Node<NodeData>) => node.type !== NodeType.Root && isWorkflowNode(node) && node.id !== currentNode.id /* Skip current node */)
                .forEach(node => transitionNode(set, nodes, node.id, AgentState.Idle));

            // Update workflow execution state
            await updateExecution({
                id: workflowExecution.id,
                nodeId: workflowExecution.currentNodeId,
                workflowId: workflowExecution.workflowId,
                currentStatus: WorkflowState.Running
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

    const progressWorkflow = async (nodeId: string, status: AgentState) => {
        const { nodes, edges, workflowExecution } = get();
        const node = nodes.find(n => n.id === nodeId);
        if (!node || !isWorkflowNode(node)) return;

        try {
            if (!workflowExecution) return;

            // If node is complete, check for next node
            if (status === AgentState.Complete) {
                const nextNode = findNextNode(nodes, edges, nodeId);
                if (nextNode && isWorkflowNode(nextNode)) {
                    // Start next node
                    useAgentStore.getState().transition(nextNode.id, AgentState.Activating);
                    transitionNode(set, nodes, nextNode.id, AgentState.Activating);

                    // Update execution record with next node
                    await updateExecution({
                        id: workflowExecution.id,
                        nodeId: nextNode.id,
                        workflowId: workflowExecution.workflowId,
                        currentStatus: WorkflowState.Running
                    });

                    updateState(set, {
                        workflowExecution: {
                            ...workflowExecution,
                            currentNodeId: nextNode.id
                        }
                    });
                } else {
                    // No next node, workflow is complete
                    await updateExecution({
                        id: workflowExecution.id,
                        nodeId: nodeId,
                        workflowId: workflowExecution.workflowId,
                        currentStatus: WorkflowState.Completed
                    });

                    updateState(set, {
                        workflowExecution: {
                            ...workflowExecution,
                            state: WorkflowState.Completed
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error in progressWorkflow:', error);

            // Transition node to initial state
            transitionNode(set, nodes, nodeId, AgentState.Initial);

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
