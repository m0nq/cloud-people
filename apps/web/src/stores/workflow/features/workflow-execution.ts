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
import { hasAgentNodes } from '@stores/workflow';
import { NodeType } from '@app-types/workflow/node-types';
import { useAgentStore } from '@stores/agent-store';

import { PauseResult } from '@lib/agent-operations';
import { pauseAgentNode } from '@lib/agent-operations';

const isValidWorkflowNode = (node: Node<NodeData> | undefined): node is Node<NodeData> => node !== undefined;

const findNextNode = (nodes: Node<NodeData>[], edges: Edge<EdgeData>[], currentNodeId: string): Node<NodeData> | undefined => {
    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
    if (outgoingEdges.length === 0) return undefined;

    // For now, just take the first outgoing edge's target
    const nextNodeId = outgoingEdges[0].target;
    return nodes.find(node => node.id === nextNodeId);
};

const findNonTerminalNodes = (nodes: Node<NodeData>[]): Node<NodeData>[] => {
    const agentStore = useAgentStore.getState();
    return nodes.filter(node => {
        // Only consider Agent nodes
        if (node.data.type !== NodeType.Agent || !isWorkflowNode(node)) {
            return false;
        }

        // Get the current state of the agent
        const agentId = node.data.agentRef.agentId;
        const agentState = agentStore.getAgentState(agentId)?.state || AgentState.Initial;

        // Log the node and its state for debugging
        console.log(`[DEBUG] Node ${node.id} (Agent ${agentId}) is in state: ${agentState}`);

        // Consider a node pausable if it's not in a terminal state
        // Terminal states are: Complete, Error, Initial, Assistance
        const isTerminalState = [
            AgentState.Complete,
            AgentState.Error,
            AgentState.Initial,
            AgentState.Assistance
        ].includes(agentState);

        // Return true if the node is not in a terminal state
        return !isTerminalState;
    });
};

const resetNodesToInitial = (set: Function, nodes: Node<NodeData>[], targetNodes: Node<NodeData>[]) => {
    console.log(`[DEBUG] Resetting ${targetNodes.length} nodes to initial state`);

    targetNodes.forEach(node => {
        try {
            console.log(`[DEBUG] Resetting node ${node.id} to AgentState.Initial`);
            transitionNode(set, nodes, node.id, AgentState.Initial);
        } catch (error) {
            console.error(`[DEBUG] Failed to transition node ${node.id} to AgentState.Initial:`, error);
        }
    });
};

const updateWorkflowState = async (
    set: Function,
    workflowExecution: GraphState['workflowExecution'],
    status: WorkflowState,
    nodeId?: string,
    errorMessage?: string
) => {
    if (!workflowExecution) {
        console.error('[DEBUG] Cannot update workflow state: workflowExecution is undefined');
        return;
    }

    console.log(`[DEBUG] Updating workflow state to ${status}`, {
        workflowId: workflowExecution.id,
        currentNodeId: nodeId || workflowExecution.currentNodeId,
        previousState: workflowExecution.state
    });

    try {
        // Update execution record
        await updateExecution({
            id: workflowExecution.id,
            nodeId: nodeId || workflowExecution.currentNodeId,
            workflowId: workflowExecution.workflowId,
            currentStatus: status,
            metrics: {},
            errors: errorMessage ? {
                message: errorMessage,
                timestamp: new Date().toISOString()
            } : undefined
        });

        console.log(`[DEBUG] Successfully updated execution record for workflow ${workflowExecution.id} to state ${status}`);

        // Update workflow state
        updateState(set, {
            workflowExecution: {
                ...workflowExecution,
                state: status,
                currentNodeId: nodeId || workflowExecution.currentNodeId,
                errors: errorMessage ? {
                    message: errorMessage,
                    timestamp: new Date().toISOString()
                } : undefined
            }
        });

        console.log(`[DEBUG] Successfully updated workflow state in store to ${status}`);
    } catch (error) {
        console.error(`[DEBUG] Error updating workflow state to ${status}:`, error);
        throw error;
    }
};

export const transitionNode = (set: Function, nodes: Node<NodeData>[], nodeId: string, newState: AgentState) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !isWorkflowNode(node)) {
        console.error(`[DEBUG] Cannot transition node ${nodeId}: Node not found or not a workflow node`);
        return;
    }

    // If this is an agent node, update agent state
    if (node.data.type === NodeType.Agent) {
        const { agentId } = node.data.agentRef;
        const agentStore = useAgentStore.getState();
        const currentAgent = agentStore.getAgentState(agentId);

        if (!currentAgent) {
            console.error(`[DEBUG] Agent ${agentId} not found for node ${nodeId}`);
            return;
        }

        const currentState = currentAgent.state;
        console.log(`[DEBUG] Transitioning node ${nodeId} (Agent ${agentId}) from ${currentState} to ${newState}`);

        if (agentStore.isTransitionAllowed(agentId, newState)) {
            // Update the agent state in the agent store
            agentStore.transition(agentId, newState);
            console.log(`[DEBUG] Successfully updated agent ${agentId} state to ${newState}`);

            // Update only the specific node that's being transitioned
            const updatedNodes = nodes.map(n => {
                if (n.id === nodeId) {
                    console.log(`[DEBUG] Updating node ${n.id} data state to ${newState}`);
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            state: newState
                        }
                    };
                }
                return n;
            });

            // Update workflow store
            updateState(set, { nodes: updatedNodes });
            console.log(`[DEBUG] Updated workflow store with new node state for ${nodeId}`);
        } else {
            console.error(`[DEBUG] Invalid transition for node ${nodeId} (Agent ${agentId}) from ${currentState} to ${newState}`);
        }
    } else {
        console.warn(`[DEBUG] Node ${nodeId} is not an agent node, cannot transition state`);
    }
};

export const createWorkflowExecution = (set: Function, get: Function) => {
    const startWorkflow = async () => {
        const { nodes, edges } = get();
        const rootNode = findRootNode(nodes);

        if (!rootNode) {
            throw new Error('No root node found');
        }

        // Check if there are any agent nodes in the graph
        if (!hasAgentNodes(nodes)) {
            throw new Error('Cannot start workflow: No agent nodes detected in the graph.');
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
        if (!workflowExecution) {
            console.error('[DEBUG] Cannot pause workflow - workflowExecution is undefined');
            return;
        }

        try {
            // Debug logging to help identify workflow state
            console.log('[DEBUG] Pausing workflow with state:', {
                workflowId: workflowExecution?.id,
                workflowState: workflowExecution?.state,
                nodeCount: nodes.length
            });

            // First, update the workflow state to Paused immediately
            // This prevents any new nodes from being activated during the pause process
            await updateWorkflowState(set, workflowExecution, WorkflowState.Paused);
            console.log('[DEBUG] Updated workflow state to Paused');

            // Find all non-terminal nodes (nodes that are not in Complete, Error, or Initial state)
            const nonTerminalNodes = findNonTerminalNodes(nodes);
            console.log(`[DEBUG] Found ${nonTerminalNodes.length} non-terminal nodes to pause`);

            if (nonTerminalNodes.length === 0) {
                console.log('[DEBUG] No non-terminal nodes found to pause');
                return;
            }

            // Pause all non-terminal nodes
            const pauseResults: PauseResult[] = await Promise.all(
                nonTerminalNodes.map(node => {
                    if (isWorkflowNode(node) && node.data.type === NodeType.Agent) {
                        const agentId = node.data.agentRef.agentId;
                        console.log(`[DEBUG] Attempting to pause node ${node.id} with agent ID ${agentId}`);

                        try {
                            return pauseAgentNode(node.id, agentId, (status: AgentState) => {
                                console.log(`[DEBUG] Node ${node.id} transitioned to state: ${status}`);
                                transitionNode(set, nodes, node.id, status);
                            });
                        } catch (error) {
                            console.error(`[DEBUG] Error in pauseAgentNode for node ${node.id}:`, error);
                            // Even if pauseAgentNode throws an error, transition the node to Paused
                            transitionNode(set, nodes, node.id, AgentState.Paused);
                            return {
                                nodeId: node.id,
                                agentId,
                                success: true, // Consider this "successful" in terms of pausing the workflow
                                error: `Error during pause operation, but node transitioned to Paused state: ${error instanceof Error ? error.message : 'Unknown error'}`
                            };
                        }
                    }
                    return {
                        nodeId: node.id,
                        success: false,
                        error: 'Not a valid agent node'
                    };
                })
            );

            // Log the results of pause attempts
            pauseResults.forEach(result => {
                if (result.success) {
                    console.log(`[DEBUG] Successfully paused node ${result.nodeId}`);
                } else {
                    console.warn(`[DEBUG] Failed to pause node ${result.nodeId}: ${result.error}`);
                }
            });

            // Check if any nodes were successfully paused
            const anySuccess = pauseResults.some(result => result.success);

            if (!anySuccess) {
                console.warn('[DEBUG] Failed to pause any nodes, but workflow state is still Paused');
            } else {
                console.log(`[DEBUG] Successfully paused ${pauseResults.filter((r) => r.success).length} nodes`);
            }
        } catch (error) {
            console.error('[DEBUG] Failed to pause workflow:', error);

            // Try to update workflow state even if an error occurred
            try {
                if (workflowExecution) {
                    await updateWorkflowState(set, workflowExecution, WorkflowState.Paused);
                    console.log('[DEBUG] Updated workflow state to Paused despite error');
                }
            } catch (stateError) {
                console.error('[DEBUG] Failed to update workflow state after error:', stateError);
            }

            throw error;
        }
    };

    const resumeWorkflow = async () => {
        const { nodes, workflowExecution }: GraphState = get();
        if (!workflowExecution) return;

        try {
            // Update workflow state
            await updateWorkflowState(set, workflowExecution, WorkflowState.Running);

            // Find the last active node
            const lastNodeId = workflowExecution.currentNodeId;
            if (!lastNodeId) {
                console.warn('No last node ID found when attempting to resume workflow');
                return;
            }

            const lastNode = nodes.find(n => n.id === lastNodeId);

            // Transition all non-active agent nodes to Idle state
            nodes.forEach(node => {
                if (node.id !== lastNodeId &&
                    isValidWorkflowNode(node) &&
                    node.data.type === NodeType.Agent) {
                    transitionNode(set, nodes, node.id, AgentState.Idle);
                }
            });

            // Resume the agent's execution if it's an agent node
            if (lastNode && isValidWorkflowNode(lastNode) && lastNode.data.type === NodeType.Agent) {
                // Use node ID as task ID for browser-use service
                const nodeId = lastNode.id;
                // Use agent ID for agent store operations
                const agentId = lastNode.data.agentRef.agentId;

                const agentStore = useAgentStore.getState();
                const agentData = agentStore.getAgentData(agentId);

                // Set isResuming flag with node ID as the key for resumption
                agentStore.setAgentData(agentId, {
                    ...agentData,
                    isResuming: true,
                    nodeId: nodeId // Store the node ID for reference
                });

                transitionNode(set, nodes, nodeId, AgentState.Activating);
            }
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

            console.log(`[DEBUG] Progressing workflow for node ${nodeId} with status ${status}`, {
                workflowState: workflowExecution.state,
                currentNodeId: workflowExecution.currentNodeId
            });

            if (status === AgentState.Complete) {
                // Check if the workflow is paused before proceeding to the next node
                if (workflowExecution.state === WorkflowState.Paused) {
                    console.log(`[DEBUG] Workflow is paused, not activating next node after completion of ${nodeId}`);

                    // Update the current node ID but maintain the paused state
                    await updateWorkflowState(
                        set,
                        workflowExecution,
                        WorkflowState.Paused,
                        nodeId
                    );
                    return;
                }

                const nextNode = findNextNode(nodes, edges, nodeId);
                if (nextNode && isWorkflowNode(nextNode)) {
                    console.log(`[DEBUG] Activating next node ${nextNode.id} after completion of ${nodeId}`);

                    // Start next node
                    useAgentStore.getState().transition(nextNode.id, AgentState.Activating);
                    transitionNode(set, nodes, nextNode.id, AgentState.Activating);

                    // Update workflow state with next node
                    await updateWorkflowState(
                        set,
                        workflowExecution,
                        WorkflowState.Running,
                        nextNode.id
                    );
                } else {
                    console.log(`[DEBUG] No next node found after ${nodeId}, marking workflow as completed`);

                    // No next node, workflow is complete
                    await updateWorkflowState(
                        set,
                        workflowExecution,
                        WorkflowState.Completed,
                        nodeId
                    );
                }
            } else if (status === AgentState.Error || status === AgentState.Assistance) {
                console.log(`[DEBUG] Node ${nodeId} entered ${status} state, pausing workflow`);

                // Reset all non-terminal nodes
                const nonTerminalNodes = findNonTerminalNodes(nodes);
                console.log(`[DEBUG] Resetting ${nonTerminalNodes.length} non-terminal nodes to Initial state`);
                resetNodesToInitial(set, nodes, nonTerminalNodes);

                // Update workflow state
                const errorMessage = status === AgentState.Error ? 'Agent encountered an error' : undefined;
                await updateWorkflowState(set, workflowExecution, WorkflowState.Paused, nodeId, errorMessage);
            }
        } catch (error) {
            console.error('[DEBUG] Error in progressWorkflow:', error);

            // Reset all non-terminal nodes
            const nonTerminalNodes = findNonTerminalNodes(nodes);
            resetNodesToInitial(set, nodes, nonTerminalNodes);

            // Update workflow state with error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            await updateWorkflowState(
                set,
                workflowExecution,
                WorkflowState.Paused,
                nodeId,
                errorMessage
            );
        }
    };

    return {
        startWorkflow,
        pauseWorkflow,
        resumeWorkflow,
        progressWorkflow
    };
};
