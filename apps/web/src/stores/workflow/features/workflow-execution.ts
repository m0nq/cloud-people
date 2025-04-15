import { type Edge } from '@xyflow/react';
import { type Node } from '@xyflow/react';

import { type NodeData } from '@app-types/workflow/nodes';
import { type EdgeData } from '@app-types/workflow/edges';
import { AgentState } from '@app-types/agent';
import { AgentResult } from '@app-types/agent';
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

const resetNodesToInitial = (set, get, nodes: Node<NodeData>[], targetNodes: Node<NodeData>[]) => {
    console.log(`[DEBUG] Resetting ${targetNodes.length} nodes to initial state`);

    targetNodes.forEach(node => {
        try {
            console.log(`[DEBUG] Resetting node ${node.id} to AgentState.Initial`);
            transitionNode(set, get, nodes, node.id, AgentState.Initial);
        } catch (error) {
            console.error(`[DEBUG] Failed to transition node ${node.id} to AgentState.Initial:`, error);
        }
    });
};

const updateWorkflowState = async (
    set,
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
        executionId: workflowExecution.id,
        currentNodeId: nodeId || workflowExecution.currentNodeId,
        previousState: workflowExecution.state
    });

    try {
        // --- ADD DEBUG LOG --- 
        console.log('[DEBUG] Object being sent to updateExecution action:', {
            id: workflowExecution.id,
            nodeId: nodeId || workflowExecution.currentNodeId,
            workflowId: workflowExecution.workflowId, // Check this value!
            currentStatus: status,
            metrics: {},
            errors: errorMessage ? {
                message: errorMessage,
                timestamp: new Date().toISOString()
            } : undefined
        });
        // --- END DEBUG LOG ---

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

export const createWorkflowExecutionSlice = <T extends { workflowExecution: GraphState['workflowExecution'] }>(set, get) => {
    /**
     * Activates a specific node in the workflow.
     * Handles finding the associated agent, passing aggregated results from preceding completed nodes,
     * transitioning the node state to Activating, and updating the overall workflow state.
     *
     * @param nodeId The ID of the node to activate.
     * @param aggregatedPredecessorResults Optional dictionary mapping predecessor node IDs to their AgentResult.
     */
    const activateNode = async (nodeId: string, aggregatedPredecessorResults?: { [key: string]: AgentResult | null }) => {
        console.log(`[ActivateNode] Attempting to activate node ${nodeId}`);
        const { workflowExecution } = get();
        if (!workflowExecution) {
            console.error("[ActivateNode] Cannot activate node, workflow execution not found.");
            return;
        }

        const nodeToActivate = get().nodes.find(n => n.id === nodeId);
        if (!nodeToActivate) {
            console.error(`[ActivateNode] Node ${nodeId} not found.`);
            return;
        }

        const agentId = nodeToActivate.data.agentRef.agentId;
        if (!agentId) {
            console.error(`[ActivateNode] Agent ID not found for node ${nodeId}.`);
            // Consider transitioning node to an error state here
            return;
        }

        // Pass aggregated results if they exist
        if (aggregatedPredecessorResults && Object.keys(aggregatedPredecessorResults).length > 0) {
            const agentData = useAgentStore.getState().getAgentData(agentId);
            if (agentData) {
                console.log(`[ActivateNode] Passing aggregated results from predecessors to agent ${agentId}. Results:`, aggregatedPredecessorResults);
                useAgentStore.getState().setAgentData(agentId, {
                    ...agentData,
                    // Store the aggregated results directly
                    previousAgentOutput: aggregatedPredecessorResults
                });
                // TODO: Add telemetry for data passing success
                console.log(`[Telemetry] Data passing pass_to_next to ${agentId}: Success (Placeholder)`);
            } else {
                console.warn(`[ActivateNode] Could not find agent data for agent ${agentId} to pass results.`);
                // TODO: Add telemetry for data passing failure
                console.log(`[Telemetry] Data passing pass_to_next to ${agentId}: Fail - Agent data not found (Placeholder)`);
            }
        } else {
            console.log(`[ActivateNode] No predecessor results to pass to agent ${agentId}.`);
        }

        // Transition the node to Activating
        console.log(`[ActivateNode] Transitioning node ${nodeId} to Activating.`);
        transitionNode(set, get, get().nodes, nodeId, AgentState.Activating);

        // Update overall workflow state
        await updateWorkflowState(
            set,
            workflowExecution,
            WorkflowState.Running,
            nodeId
        );
        console.log(`[ActivateNode] Workflow state updated to Running, current node ${nodeId}.`);
    };

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
        transitionNode(set, get, get().nodes, firstNode.id, AgentState.Activating);

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
                            transitionNode(set, get, nodes, node.id, status);
                        }),

                        // A timeout promise that will resolve after 5 seconds
                        new Promise<PauseResult>((resolve) => {
                            setTimeout(() => {
                                console.warn(`[DEBUG] Pause operation timed out for node ${node.id}`);
                                // Force transition to paused state
                                transitionNode(set, get, nodes, node.id, AgentState.Paused);
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
                        transitionNode(set, get, nodes, node.id, AgentState.Paused);
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
                        transitionNode(set, get, nodes, node.id, AgentState.Paused);
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
                    transitionNode(set, get, nodes, firstAgentNode.id, AgentState.Activating);
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
                    transitionNode(set, get, nodes, firstAgentNode.id, AgentState.Activating);
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
                    transitionNode(set, get, nodes, node.id, AgentState.Idle);
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

                transitionNode(set, get, nodes, nodeId, AgentState.Activating);
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
                        WorkflowState.Paused, // Changed from Failed to Paused
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
        const { nodes, edges, workflowExecution, updateWorkflowContext, activateNode } = get();
        const { getAgentResult } = useAgentStore.getState();
        const node = nodes.find(n => n.id === nodeId);
        if (!node || !isWorkflowNode(node)) return;

        try {
            if (!workflowExecution) return;

            console.log(`[WorkflowProgress] Node ${nodeId} reported status ${status}. Starting progression logic.`);

            // --- Ensure completed node state is updated in the store ---
            // Refresh nodes to get the latest state before checking/transitioning
            let allNodes = get().nodes;
            const storedNode = allNodes.find(n => n.id === nodeId);
            const storedNodeState = storedNode?.data.state;

            // If the agent just completed, ensure the workflow node state reflects this.
            // transitionNode handles cases where the state is already correct.
            if (status === AgentState.Complete) {
                console.log(
                    `[WorkflowProgress] Received COMPLETE status for node ${nodeId}. Ensuring workflow node state is synced. Current stored state: ${storedNodeState}`
                );
                transitionNode(set, get, allNodes, nodeId, AgentState.Complete); // Pass get

                // Refresh nodes again after potential transition before proceeding
                allNodes = get().nodes;
            }

            // Only proceed if the node actually completed successfully
            if (status !== AgentState.Complete) {
                console.log(`[WorkflowProgress] Node ${nodeId} did not complete successfully (status: ${status}). Stopping progression for this path.`);
                // Workflow state (Error/Assistance/Paused) should be handled elsewhere or by the agent completion trigger.
                return;
            }

            // Find outgoing edges from the completed node
            const outgoingEdges = get().edges.filter(edge => edge.source === nodeId);
            console.log(`[WorkflowProgress] Found ${outgoingEdges.length} outgoing edges from completed node ${nodeId}`);

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

            // --- Get the result of the completed agent ---
            console.log(`[WorkflowProgress] Fetching result for completed agent node ${nodeId}`);
            const completedAgentResult: AgentResult | null = getAgentResult(nodeId) ?? null;
            if (!completedAgentResult) {
                console.warn(`[WorkflowProgress] No result found in AgentStore for completed node ${nodeId}. Proceeding without passing result.`);
            } else {
                console.log(`[WorkflowProgress] Found result for ${nodeId}:`, completedAgentResult);
            }
            // -----------------------------------------

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
                let allInputsCompleted = true;

                console.log(`[WorkflowProgress] Checking ${incomingEdges.length} inputs for node ${nextNode.id}`);

                for (const incomingEdge of incomingEdges) {
                    const inputNodeId = incomingEdge.source;

                    // --- Re-fetch the LATEST state of the input node ---
                    const currentInputNode = get().nodes.find(n => n.id === inputNodeId); // Re-fetch from store
                    const currentInputNodeState = currentInputNode?.data.state;
                    // -------------------------------------------------

                    console.log(
                        `[WorkflowProgress] Checking input ${inputNodeId} for node ${nextNode.id}: ` +
                        `Latest State = ${currentInputNodeState}, IsCompleted = ${currentInputNodeState === AgentState.Complete}`
                    );

                    if (currentInputNodeState !== AgentState.Complete) {
                        allInputsCompleted = false;
                        console.log(`[WorkflowProgress] Input ${inputNodeId} for ${nextNode.id} is NOT complete. Node ${nextNode.id} cannot be activated yet.`);
                        break; // No need to check further inputs for this potential next node
                    }
                }

                if (allInputsCompleted) {
                    console.log(`[WorkflowProgress] All inputs for ${nextNode.id} are complete. Preparing to activate.`);

                    // --- Aggregate results from ALL predecessors --- START
                    const predecessorIds = incomingEdges.map(e => e.source);
                    const predecessorResults: { [key: string]: AgentResult | null } = {};
                    console.log(`[WorkflowProgress] Fetching results for predecessors of ${nextNode.id}:`, predecessorIds);

                    for (const predId of predecessorIds) {
                        // Fetch result from the central context cache
                        const result = get().getAgentContextData(predId);
                        predecessorResults[predId] = result; // Store null if result not found
                        if (!result) {
                            console.warn(`[WorkflowProgress] Failed to find result in context for completed predecessor ${predId} when activating ${nextNode.id}`);
                        }
                    }
                    console.log(`[WorkflowProgress] Aggregated predecessor results for ${nextNode.id}:`, predecessorResults);
                    // --- Aggregate results from ALL predecessors --- END

                    // Activate the next node, passing the AGGREGATED results
                    activateNode(nextNode.id, predecessorResults);
                } else {
                    console.log(`[WorkflowProgress] Node ${nextNode.id} is not ready to activate yet (waiting for other inputs).`);
                }
            }
        } catch (error) {
            console.error('[WorkflowProgress] An error occurred during workflow progression:', error);
            // Consider updating workflow state to Error here if appropriate
            if (workflowExecution) {
                await updateWorkflowState(
                    set,
                    workflowExecution,
                    WorkflowState.Paused, // Fix: Use Paused state for errors
                    nodeId, // Associate error with the node that triggered progression
                    error instanceof Error ? error.message : 'Unknown error'
                );
            }
        }
    };

    return {
        startWorkflow,
        pauseWorkflow,
        resumeWorkflow,
        progressWorkflow,
        activateNode
    };
};

export const transitionNode = (
    set,
    get,
    nodes: Node<NodeData>[],
    nodeId: string,
    newState: AgentState
) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !isWorkflowNode(node)) {
        console.error(`[transitionNode] Failed to find workflow node with ID: ${nodeId} or it's not a workflow node`);
        return;
    }

    // If this is an agent node, update agent state
    if (node.data.type === NodeType.Agent) {
        const { agentId } = node.data.agentRef;
        const agentStore = useAgentStore.getState();
        const currentAgent = agentStore.getAgentState(agentId);

        if (!currentAgent) {
            console.error(`[transitionNode] Agent ${agentId} not found for node ${nodeId}`);
            return;
        }

        const currentState = currentAgent.state;
        console.log(`[transitionNode] Transitioning node ${nodeId} (Agent ${agentId}) from ${currentState} to ${newState}`);

        // Store result in context if completing
        if (newState === AgentState.Complete) {
            const agentResult = currentAgent.result; // Get result directly from agentStore state
            if (agentResult) {
                console.log(`[transitionNode] Storing result for completed agent ${agentId} in workflow context.`);
                // Directly call the update function from the store's 'get' accessor
                get().updateWorkflowContext(agentId, agentResult);
            } else {
                // This might happen if the agent completed but somehow the result wasn't set in agentStore.
                // Should ideally not happen, but good to log.
                console.warn(`[transitionNode] Agent ${agentId} is COMPLETE, but no result found in agentStore to store in context.`);
            }
        }

        if (agentStore.isTransitionAllowed(agentId, newState)) {
            // Update the agent state in the agent store
            agentStore.transition(agentId, newState);
            console.log(`[transitionNode] Successfully updated agent ${agentId} state to ${newState}`);

            // Update only the specific node that's being transitioned
            const updatedNodes = nodes.map(n => {
                if (n.id === nodeId) {
                    console.log(`[transitionNode] Updating node ${n.id} data state to ${newState}`);
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
            console.log(`[transitionNode] Updated workflow store with new node state for ${nodeId}`);
        } else {
            // Transition is disallowed by agentStore
            if (currentState === newState) {
                // Reason: Agent is already in the target state.
                // This is okay, likely a race condition. Just ensure workflow store node state is updated.
                console.log(`[transitionNode] Agent ${agentId} is already in state ${newState}. Ensuring workflow node state reflects this.`);

                // Also store result here for race condition
                // Even if already complete, ensure result is in context
                if (newState === AgentState.Complete) {
                    const agentResult = currentAgent.result;
                    if (agentResult) {
                        console.log(`[transitionNode] Storing result for already completed agent ${agentId} in workflow context (syncing).`);
                        get().updateWorkflowContext(agentId, agentResult);
                    } else {
                        console.warn(`[transitionNode] Agent ${agentId} is already COMPLETE, but no result found in agentStore to store in context (syncing).`);
                    }
                }

                // Check if workflow store node state *needs* updating
                // It might already be correct if another process updated it.
                if (node.data.state !== newState) {
                    const updatedNodes = nodes.map(n => {
                        if (n.id === nodeId) {
                            console.log(`[transitionNode] Updating node ${n.id} data state to ${newState} (syncing state)`);
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
                    updateState(set, { nodes: updatedNodes });
                    console.log(`[transitionNode] Updated workflow store with new node state for ${nodeId} (syncing)`);
                } else {
                    console.log(`[transitionNode] Workflow node ${nodeId} state already matches agent state ${newState}. No update needed.`);
                }

            } else {
                // Reason: Truly invalid transition (e.g., trying to go from FAILED to RUNNING)
                console.error(`[transitionNode] Invalid transition for node ${nodeId} (Agent ${agentId}) from ${currentState} to ${newState}`);
                // Optionally, consider if we should still update the node state here in some cases?
                // For now, maintaining the original behavior of erroring out for truly invalid transitions.
            }
        }
    } else {
        // Only update node data state for non-agent nodes if needed (e.g., ROOT nodes)
        // For now, assuming only agent nodes have meaningful state transitions managed here.
        console.warn(`[transitionNode] Node ${nodeId} is not an agent node, state transition ignored in this function.`);
    }
};
