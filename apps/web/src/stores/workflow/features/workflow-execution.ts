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
    return nodes.filter(node =>
        node.data.type === NodeType.Agent &&
        isWorkflowNode(node) &&
        ![AgentState.Complete, AgentState.Error, AgentState.Assistance, AgentState.Initial].includes(
            agentStore.getAgentState(node.data.agentRef.agentId)?.state || AgentState.Initial
        )
    );
};

const resetNodesToInitial = (set: Function, nodes: Node<NodeData>[], targetNodes: Node<NodeData>[]) => {
    targetNodes.forEach(node => {
        try {
            transitionNode(set, nodes, node.id, AgentState.Initial);
        } catch (error) {
            console.error(`Failed to transition node ${node.id} to AgentState.Initial:`, error);
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
    if (!workflowExecution) return;

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

            // Update only the specific node that's being transitioned
            const updatedNodes = nodes.map(n => {
                if (n.id === nodeId) {
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
        if (!workflowExecution) return;

        try {
            // Debug logging to help identify workflow state
            console.log('Pausing workflow with state:', {
                workflowId: workflowExecution?.id,
                workflowState: workflowExecution?.state,
                nodeCount: nodes.length
            });

            // Get the current node ID from workflow execution
            const currentNodeId = workflowExecution.currentNodeId;
            console.log(`Current node ID: ${currentNodeId}`);

            // Find agent nodes that need to be paused
            const agentStore = useAgentStore.getState();
            const nodesToPause: Node<NodeData>[] = [];

            // Primary approach: Find the current active node
            if (currentNodeId) {
                const currentNode = nodes.find(node => 
                    node.id === currentNodeId && 
                    isValidWorkflowNode(node) && 
                    node.data.type === NodeType.Agent
                );
                
                if (currentNode && isValidWorkflowNode(currentNode)) {
                    nodesToPause.push(currentNode);
                    console.log(`Found current node to pause: ${currentNode.id}`);
                }
            }

            // Fallback approach: Find any nodes in Working state
            // Only use this if we didn't find a node using the primary approach
            if (!nodesToPause.length) {
                const workingNodes = nodes.filter(node => 
                    isValidWorkflowNode(node) && 
                    node.data.type === NodeType.Agent &&
                    agentStore.getAgentState(node.data.agentRef.agentId)?.state === AgentState.Working
                );
                
                if (workingNodes.length > 0) {
                    nodesToPause.push(...workingNodes);
                    console.log(`Found ${workingNodes.length} working nodes to pause as fallback`);
                }
            }

            // If we still didn't find any nodes to pause, log a warning
            if (!nodesToPause.length) {
                console.warn('No active agent nodes found to pause');
            }

            // Pause each identified agent node
            const pauseResults: PauseResult[] = await Promise.all(
                nodesToPause
                    .filter(isValidWorkflowNode)
                    .map(async (node) => {
                        // Create a status change handler
                        const onStatusChange = (status: AgentState) => {
                            // Update the node state in the workflow
                            transitionNode(set, nodes, node.id, status);
                        };

                        // Pause the agent node and return the result
                        return pauseAgentNode(node.id, node.data.agentRef.agentId, onStatusChange);
                    })
            );

            // Log the pause results
            console.log('Pause results:', pauseResults);

            // Find and reset non-terminal nodes (this still happens for all nodes)
            const nonTerminalNodes = findNonTerminalNodes(nodes);
            resetNodesToInitial(set, nodes, nonTerminalNodes);

            // Update workflow state
            await updateWorkflowState(set, workflowExecution, WorkflowState.Paused);
        } catch (error) {
            console.error('Failed to pause workflow:', error);
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

            if (status === AgentState.Complete) {
                const nextNode = findNextNode(nodes, edges, nodeId);
                if (nextNode && isWorkflowNode(nextNode)) {
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
                    // No next node, workflow is complete
                    await updateWorkflowState(
                        set,
                        workflowExecution,
                        WorkflowState.Completed,
                        nodeId
                    );
                }
            } else if (status === AgentState.Error || status === AgentState.Assistance) {
                // Reset all non-terminal nodes
                const nonTerminalNodes = findNonTerminalNodes(nodes);
                resetNodesToInitial(set, nodes, nonTerminalNodes);

                // Update workflow state
                const errorMessage = status === AgentState.Error ? 'Agent encountered an error' : undefined;
                await updateWorkflowState(set, workflowExecution, WorkflowState.Paused, nodeId, errorMessage);
            }
        } catch (error) {
            console.error('Error in progressWorkflow:', error);

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
