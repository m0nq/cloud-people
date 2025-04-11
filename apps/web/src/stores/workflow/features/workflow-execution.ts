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
import { AgentSpeed } from '@app-types/agent';
import { MemoryLimit } from '@app-types/agent';

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
        const { nodes, edges, workflowExecution: currentExecution } = get();
        const rootNode = findRootNode(nodes);

        if (!rootNode) {
            console.error('Cannot start workflow: Root node not found.');
            // Cannot update state if root isn't found, maybe handle differently?
            return;
        }

        const workflowId = rootNode.data?.workflowId;
        if (!workflowId) {
            console.error('Cannot start workflow: Workflow ID not found on root node.');
            // Cannot update state if workflowId isn't found
            return;
        }

        console.log('[WorkflowExecution] Starting workflow:', workflowId);

        // --- Find First Node --- Corrected arguments
        const firstNode = findNextNode(nodes, edges, rootNode.id);

        if (!firstNode) {
            console.warn('Workflow has no nodes connected to the root. Ending.');
            // Update state to Completed if no nodes follow root
            if (currentExecution) {
                await updateWorkflowState(set, currentExecution, WorkflowState.Completed);
            }
            return;
        }

        // --- Ensure workflowExecution exists --- Need to create if null
        let executionToUse = currentExecution;
        if (!executionToUse) {
            console.log(`[WorkflowExecution] No existing execution found for ${workflowId}. Creating new one.`);
            try {
                executionToUse = await createExecution({
                    workflowId,
                    nodeId: rootNode.id, // Start tracking from root
                    currentStatus: WorkflowState.Initial, // Initial state before starting
                });
                updateState(set, { workflowExecution: executionToUse }); // Store the new execution object
            } catch (error) {
                console.error('Failed to create workflow execution record:', error);
                return; // Cannot proceed without an execution record
            }
        }

        // --- Update state to Running --- (using the helper)
        await updateWorkflowState(set, executionToUse, WorkflowState.Running, firstNode.id);

        // --- Transition the first node --- Pass the updated execution from get()
        console.log(`[WorkflowExecution] Activating first node: ${firstNode.id}`);
        transitionNode(set, get().nodes, firstNode.id, AgentState.Activating);

        // --- Verify first node state and update workflow status accordingly ---
        const updatedNodes = get().nodes;
        const finalFirstNode = updatedNodes.find(n => n.id === firstNode.id);
        const finalFirstNodeState = finalFirstNode?.data?.state;

        // Fetch the potentially updated execution record again
        const finalExecution = get().workflowExecution;
        if (!finalExecution) {
             console.error('[WorkflowExecution] Critical Error: Execution record disappeared after starting.');
             return;
        }

        if (finalFirstNodeState === AgentState.Activating) {
            console.log(`[WorkflowExecution] First node ${firstNode.id} successfully transitioned to ACTIVATING.`);
            // State is already Running, node is marked in updateWorkflowState above
        } else {
            console.error(`[WorkflowExecution] First node ${firstNode.id} failed to reach ACTIVATING state. Current state: ${finalFirstNodeState}. Halting workflow.`);
            // Update workflow state to Paused with an error message
            await updateWorkflowState(
                set,
                finalExecution,
                WorkflowState.Paused, // Use Paused for errors
                firstNode.id,
                `First node (${firstNode.id}) failed to activate.`
            );
        }
    };

    const pauseWorkflow = async () => {
        const { nodes, edges, workflowExecution }: GraphState = get();
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

            // Pause all non-terminal nodes with a timeout to prevent hanging
            const pausePromises = nonTerminalNodes.map(node => {
                if (isWorkflowNode(node) && node.data.type === NodeType.Agent) {
                    const agentId = node.data.agentRef.agentId;
                    console.log(`[DEBUG] Attempting to pause node ${node.id} with agent ID ${agentId}`);

                    // Create a promise that will resolve after a timeout if the pause operation takes too long
                    return Promise.race([
                        // The actual pause operation
                        pauseAgentNode(node.id, agentId, (status: AgentState) => {
                            console.log(`[DEBUG] Node ${node.id} transitioned to state: ${status}`);
                            transitionNode(set, nodes, node.id, status);
                        }),

                        // A timeout promise that will resolve after 5 seconds
                        new Promise<PauseResult>((resolve) => {
                            setTimeout(() => {
                                console.warn(`[DEBUG] Pause operation timed out for node ${node.id}`);
                                // Force transition to paused state
                                transitionNode(set, nodes, node.id, AgentState.Paused);
                                resolve({
                                    nodeId: node.id,
                                    agentId,
                                    success: true, // Consider this "successful" for workflow purposes
                                    error: 'Pause operation timed out, but node transitioned to Paused state'
                                });
                            }, 5000); // 5 second timeout
                        })
                    ]);
                }
                return Promise.resolve({
                    nodeId: node.id,
                    success: false,
                    error: 'Not a valid agent node'
                });
            });

            // Wait for all pause operations to complete or timeout
            const pauseResults: PauseResult[] = await Promise.all(pausePromises);

            // Log the results of pause attempts
            pauseResults.forEach(result => {
                if (result.success) {
                    console.log(`[DEBUG] Successfully paused node ${result.nodeId}`);
                } else {
                    console.warn(`[DEBUG] Failed to pause node ${result.nodeId}: ${result.error}`);

                    // Even if pauseAgentNode returns failure, force the node to Paused state
                    const node = nodes.find(n => n.id === result.nodeId);
                    if (node && isWorkflowNode(node) && node.data.type === NodeType.Agent) {
                        console.log(`[DEBUG] Forcing node ${node.id} to Paused state after failure`);
                        transitionNode(set, nodes, node.id, AgentState.Paused);
                    }
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

                    // Force all non-terminal nodes to Paused state
                    const nonTerminalNodes = findNonTerminalNodes(nodes);
                    nonTerminalNodes.forEach(node => {
                        console.log(`[DEBUG] Forcing node ${node.id} to Paused state after error`);
                        transitionNode(set, nodes, node.id, AgentState.Paused);
                    });
                }
            } catch (stateError) {
                console.error('[DEBUG] Failed to update workflow state after error:', stateError);
            }

            throw error;
        }
    };

    const resumeWorkflow = async () => {
        const { nodes, workflowExecution }: GraphState = get();
        if (!workflowExecution) {
            console.error('[DEBUG] Cannot resume workflow - workflowExecution is undefined');
            return;
        }

        try {
            // Debug logging to help identify workflow state
            console.log('[DEBUG] Resuming workflow with state:', {
                workflowId: workflowExecution?.id,
                workflowState: workflowExecution?.state,
                currentNodeId: workflowExecution?.currentNodeId,
                nodeCount: nodes.length
            });

            // Update workflow state
            await updateWorkflowState(set, workflowExecution, WorkflowState.Running);

            // Find the last active node
            const lastNodeId = workflowExecution.currentNodeId;
            if (!lastNodeId) {
                console.warn('[DEBUG] No last node ID found when attempting to resume workflow');

                // Recovery: Find the first agent node and use it as a starting point
                const firstAgentNode = nodes.find(node =>
                    isValidWorkflowNode(node) && node.data.type === NodeType.Agent
                );

                if (firstAgentNode) {
                    console.log(`[DEBUG] Recovered workflow by using node ${firstAgentNode.id} as starting point`);
                    // Update workflow state with the new node
                    await updateWorkflowState(
                        set,
                        workflowExecution,
                        WorkflowState.Running,
                        firstAgentNode.id
                    );

                    // Resume with this node
                    transitionNode(set, nodes, firstAgentNode.id, AgentState.Activating);
                    return;
                } else {
                    throw new Error('Cannot resume workflow: No valid agent nodes found');
                }
            }

            const lastNode = nodes.find(n => n.id === lastNodeId);

            // Recovery for missing node
            if (!lastNode) {
                console.warn(`[DEBUG] Last node ${lastNodeId} not found in workflow, attempting recovery`);

                // Find the first agent node and use it as a fallback
                const firstAgentNode = nodes.find(node =>
                    isValidWorkflowNode(node) && node.data.type === NodeType.Agent
                );

                if (firstAgentNode) {
                    console.log(`[DEBUG] Recovered workflow by using node ${firstAgentNode.id} as starting point`);
                    // Update workflow state with the new node
                    await updateWorkflowState(
                        set,
                        workflowExecution,
                        WorkflowState.Running,
                        firstAgentNode.id
                    );

                    // Resume with this node
                    transitionNode(set, nodes, firstAgentNode.id, AgentState.Activating);
                    return;
                } else {
                    throw new Error('Cannot resume workflow: No valid agent nodes found');
                }
            }

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

                // Check if agent data exists
                if (!agentData) {
                    console.warn(`[DEBUG] Agent data not found for agent ${agentId}, creating minimal data`);

                    // Create minimal agent data to prevent errors
                    const minimalAgentData = {
                        id: agentId,
                        nodeId: nodeId,
                        name: `Agent ${agentId.substring(0, 8)}`,
                        description: '',
                        speed: AgentSpeed.Fast,
                        memoryLimit: MemoryLimit.Medium,
                        model: 'gemini-2.0-flash',
                        tools: [],
                        budget: '0',
                        createdBy: 'system'
                    };

                    // Set the minimal agent data
                    agentStore.setAgentData(agentId, minimalAgentData);
                }

                // Set isResuming flag with node ID as the key for resumption
                const currentAgentData = agentStore.getAgentData(agentId);
                if (currentAgentData) {
                    agentStore.setAgentData(agentId, {
                        ...currentAgentData,
                        isResuming: true,
                        nodeId: nodeId // Store the node ID for reference
                    });
                }

                transitionNode(set, nodes, nodeId, AgentState.Activating);
            } else {
                console.warn(`[DEBUG] Last node ${lastNodeId} is not a valid agent node or is missing`);
                throw new Error(`Cannot resume workflow: Last node ${lastNodeId} is not a valid agent node`);
            }
        } catch (error) {
            console.error('[DEBUG] Failed to resume workflow:', error);

            // Try to update the workflow state to error
            try {
                if (workflowExecution) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    await updateWorkflowState(
                        set,
                        workflowExecution,
                        WorkflowState.Paused,
                        workflowExecution.currentNodeId,
                        errorMessage
                    );
                    console.log('[DEBUG] Updated workflow state to Paused due to resume failure');
                }
            } catch (stateError) {
                console.error('[DEBUG] Failed to update workflow state after error:', stateError);
            }

            throw error;
        }
    };

    const progressWorkflow = async (nodeId: string, status: AgentState) => {
        const { nodes, edges, workflowExecution, updateWorkflowContext } = get();
        const node = nodes.find(n => n.id === nodeId);
        if (!node || !isWorkflowNode(node)) return;

        try {
            if (!workflowExecution) return;

            console.log(`[WorkflowProgress] Node ${nodeId} completed with status ${status}. Starting progression logic.`);

            const completedNode = nodes.find(n => n.id === nodeId);
            if (!completedNode) {
                console.error(`[WorkflowProgress] Completed node ${nodeId} not found.`);
                return;
            }
            console.log(`[WorkflowProgress] Found completed node: ${completedNode.id}, Type: ${completedNode.type}. Received status: ${status}, Store status: ${completedNode.data.state?.state}`);

            // --- Fix: Ensure completed node state is updated in the store ---
            // Check the actual current state in the store *before* potentially transitioning
            const currentNodeInStore = get().nodes.find(n => n.id === nodeId);
            const currentNodeState = currentNodeInStore?.data.state?.state;
            console.log(`[WorkflowProgress] Current state of node ${nodeId} in store: ${currentNodeState}`);

            // Only transition to COMPLETE if the node isn't already marked as Complete and the received status indicates completion
            if (status === AgentState.Complete && currentNodeState !== AgentState.Complete) {
                console.log(`[WorkflowProgress] Node ${nodeId} is not COMPLETE in store (${currentNodeState}). Transitioning to COMPLETE.`);
                transitionNode(set, get().nodes, nodeId, AgentState.Complete);
            } else if (currentNodeState === AgentState.Complete) {
                console.log(`[WorkflowProgress] Node ${nodeId} is already COMPLETE in store. Skipping transition.`);
            } else {
                console.log(`[WorkflowProgress] Node ${nodeId} finished with status ${status}, not transitioning to COMPLETE.`);
                if (status !== AgentState.Complete) {
                    console.log(`[WorkflowProgress] Halting progression for branch from ${nodeId} due to non-COMPLETE status: ${status}.`);
                    return;
                }
            }

            // Find outgoing edges
            const outgoingEdges = get().edges.filter(edge => edge.source === nodeId);
            console.log(`[WorkflowProgress] Found ${outgoingEdges.length} outgoing edges from node ${nodeId}`);

            if (outgoingEdges.length === 0) {
                console.log(`[WorkflowProgress] No outgoing edges from ${nodeId}. Checking if workflow should complete.`);
                await updateWorkflowState(
                    set,
                    workflowExecution,
                    WorkflowState.Completed,
                    nodeId
                );
                console.log('[WorkflowProgress] No next node, workflow marked as completed via updateWorkflowState.');
                return;
            }

            for (const edge of outgoingEdges) {
                const nextNodeId = edge.target;
                console.log(`[WorkflowProgress] Processing edge ${edge.id} -> target node ${nextNodeId}`);

                const nextNode = get().nodes.find(n => n.id === nextNodeId);
                if (!nextNode || !isWorkflowNode(nextNode)) {
                    console.error(`[WorkflowProgress] Next node ${nextNodeId} not found or is not a valid workflow node.`);
                    continue;
                }
                console.log(`[WorkflowProgress] Found next node: ${nextNode.id}, Type: ${nextNode.type}`);

                const incomingEdges = get().edges.filter(e => e.target === nextNodeId);
                const allInputsCompleted = incomingEdges.every(inEdge => {
                    const sourceNode = get().nodes.find(n => n.id === inEdge.source);
                    const isCompleted = sourceNode?.data.state?.state === AgentState.Complete;
                    console.log(`[WorkflowProgress] Checking input ${inEdge.source} for node ${nextNodeId}: State = ${sourceNode?.data.state?.state}, IsCompleted = ${isCompleted}`);
                    return isCompleted;
                });

                if (allInputsCompleted) {
                    console.log(`[WorkflowProgress] All inputs for node ${nextNodeId} are completed. Preparing to activate.`);

                    const completedAgentId = completedNode.data.agentRef.agentId;
                    const completedAgentResult = get().getAgentContextData(completedAgentId);
                    const nextAgentId = nextNode.data.agentRef.agentId;

                    if (completedAgentResult) {
                        const nextAgentData = useAgentStore.getState().getAgentData(nextAgentId);
                        if (nextAgentData) {
                            console.log(`[WorkflowProgress] Passing result from ${completedAgentId} to ${nextAgentId}.`);
                            useAgentStore.getState().setAgentData(nextAgentId, {
                                ...nextAgentData,
                                previousAgentOutput: completedAgentResult
                            });
                            console.log(`[Telemetry] Data passing pass_to_next from ${completedAgentId} to ${nextAgentId}: Success`);
                        } else {
                            console.warn(`[WorkflowProgress] Could not find agent data for next agent ${nextAgentId} to pass results.`);
                            console.log(`[Telemetry] Data passing pass_to_next from ${completedAgentId} to ${nextAgentId}: Fail - Next agent data not found`);
                        }
                    } else {
                        console.log(`[WorkflowProgress] No result found for completed agent ${completedAgentId} to pass.`);
                    }

                    console.log(`[WorkflowProgress] Activating next node ${nextNodeId}`);
                    transitionNode(set, get().nodes, nextNodeId, AgentState.Activating);

                    await updateWorkflowState(
                        set,
                        workflowExecution,
                        WorkflowState.Running,
                        nextNodeId
                    );
                    console.log(`[WorkflowProgress] Workflow state updated to Running, current node ${nextNodeId}.`);
                } else {
                    console.log(`[WorkflowProgress] Not all inputs for node ${nextNodeId} are completed yet. Holding state.`);
                }
            }
        } catch (error) {
            console.error('[WorkflowProgress] Error during workflow progression:', error);
            if (workflowExecution) {
                await updateWorkflowState(
                    set,
                    workflowExecution,
                    WorkflowState.Paused, // Changed from Failed to Paused
                    nodeId, // Associate failure with the node being processed
                    error instanceof Error ? error.message : String(error)
                );
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
