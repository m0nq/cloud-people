import { type Node } from '@xyflow/react';
import { Position } from '@xyflow/react';
import { Edge } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import type { AgentData } from '@app-types/agent';
import { EdgeData } from '@app-types/workflow';
import { WorkflowState } from '@app-types/workflow';
import { NodeData } from '@app-types/workflow';
import { EdgeType } from '@app-types/workflow/node-types';
import { NodeType } from '@app-types/workflow/node-types';
import { ROOT_NODE_POSITION } from '@config/layout.const';

import { fetchWorkflowNodes } from '@lib/actions/canvas-actions';
import { fetchWorkflowEdges } from '@lib/actions/canvas-actions';

import { updateState } from '@stores/workflow/utils/state-helpers';
import { findRootNode } from '@stores/workflow/utils/state-helpers';
import { findNextNode } from '@stores/workflow/utils/state-helpers';
import { getConnectedNodes } from '@stores/workflow/utils/state-helpers';

import { isInitialStateNode } from './node-validation';
import { hasWorkflowId } from './node-validation';
import { isWorkflowNode } from './node-validation';

import { useAgentStore } from '@stores/agent-store';

import { createWorkflow } from '@lib/service-providers/workflow-service';
import { createNodes, updateNodes } from '@lib/service-providers/node-service';

export function createWorkflowLifecycle(set: Function, get: Function) {
    return {
        createNewWorkflow: async () => {
            try {
                console.log('[WorkflowLifecycle] createNewWorkflow called.');
                const workflowId = await createWorkflow();
                if (!workflowId) {
                    throw new Error('Failed to create workflow');
                }
                console.log(`[WorkflowLifecycle] Workflow created with ID: ${workflowId}`);

                const dbNode = await createNodes({
                    data: {
                        workflowId,
                        nodeType: 'root'
                    }
                });
                if (!dbNode || !dbNode?.id) {
                    throw new Error('Failed to create node');
                }
                console.log(`[WorkflowLifecycle] DB Node created:`, dbNode);

                const node = {
                    id: dbNode.id,
                    type: NodeType.Root,
                    data: {
                        id: dbNode.id,
                        type: NodeType.Root,
                        workflowId
                    },
                    position: ROOT_NODE_POSITION
                } as Node<NodeData>;

                updateState(set, {
                    nodes: [node],
                    edges: []
                });

                try {
                    // Uncomment updateNodes call to set initial state
                    await updateNodes({
                        data: {
                            workflowId,
                            nodeId: node.id,
                            set: {
                                state: WorkflowState.Initial,
                                current_step: '0',
                                updated_at: new Date().toISOString() // Use ISOString consistently
                            }
                        }
                    });
                } catch (error) {
                    console.error('Failed to update node in database:', error);
                    // Decide if this error should prevent workflow creation or just be logged.
                    // Currently, it's just logged, and workflowId is still returned.
                }

                return workflowId;
            } catch (error) {
                console.error('Failed to create workflow:', error);
                throw error;
            }
        },

        createMockWorkflow: () => {
            console.log('Workflow Store: Creating MOCK workflow');
            try {
                const mockWorkflowId = `mock-wf-${uuidv4()}`;
                const mockNodeId = `mock-root-${uuidv4()}`;

                const mockNode = {
                    id: mockNodeId,
                    type: NodeType.Root,
                    data: {
                        id: mockNodeId,
                        type: NodeType.Root,
                        workflowId: mockWorkflowId,
                        label: 'Workflow Root',
                        state: undefined,
                        current_step: '0',
                        agentRef: { agentId: '' }
                    },
                    position: ROOT_NODE_POSITION
                } as Node<NodeData>;

                updateState(set, {
                    nodes: [mockNode],
                    edges: []
                });

                console.log('Mock workflow created locally with root node:', mockNode);
                return mockWorkflowId;
            } catch (error) {
                console.error('Failed to create mock workflow:', error);
            }
        },

        addAgentToWorkflow: async (agent: AgentData) => {
            const { nodes, addNode, createNewWorkflow, findRootNode } = get();
            let workflowId: string | null = null;
            let rootNodeId: string | null = null;

            try {
                if (nodes.length === 0) {
                    console.log('[WorkflowLifecycle] No existing workflow found. Creating a new one...');
                    await createNewWorkflow(); // Creates workflow and sets initial state
                    const newState = get(); // Get state *after* creation
                    const newRootNode = newState.findRootNode(newState.nodes);
                    if (newRootNode && hasWorkflowId(newRootNode)) {
                        workflowId = newRootNode.data.workflowId ?? null;
                        rootNodeId = newRootNode.id;
                        console.log(`[WorkflowLifecycle] New workflow created. ID: ${workflowId}, Root Node ID: ${rootNodeId}`);
                    } else {
                        console.error('[WorkflowLifecycle] Failed to create workflow or find root node after creation.');
                        throw new Error('Workflow creation failed.');
                    }
                } else {
                    const existingRootNode = findRootNode(nodes);
                    if (existingRootNode && hasWorkflowId(existingRootNode)) {
                        workflowId = existingRootNode.data.workflowId ?? null;
                        rootNodeId = existingRootNode.id;
                        console.log(`[WorkflowLifecycle] Existing workflow found. ID: ${workflowId}, Root Node ID: ${rootNodeId}`);
                    } else {
                        console.error('[WorkflowLifecycle] Could not find workflowId or rootNodeId in existing nodes.');
                        throw new Error('Existing workflow state is invalid.');
                    }
                }

                // Determine the parent node for the new agent node
                const finalParentNodeId = agent.parentNodeId ?? rootNodeId;
                if (!finalParentNodeId) {
                    // This should theoretically not happen if workflow creation/finding worked
                    console.error('[WorkflowLifecycle] Could not determine a parent node ID (root or specific).');
                    throw new Error('Parent node determination failed.');
                }

                console.log(`[WorkflowLifecycle] Delegating node addition to addNode. Agent: ${agent.id}, Parent Node ID: ${finalParentNodeId}`);

                // Delegate the actual node/edge creation and state update to graph-manipulation slice
                await addNode(agent, finalParentNodeId);

                console.log(`[WorkflowLifecycle] Agent ${agent.id} successfully processed by addNode.`);

            } catch (error) {
                console.error('[WorkflowLifecycle] Error during addAgentToWorkflow:', error);
                // Consider adding user-facing error notification here
            }
        },

        fetchGraph: async (workflowId: string) => {
            try {
                updateState(set, {
                    nodes: await fetchWorkflowNodes(),
                    edges: await fetchWorkflowEdges()
                });
            } catch (error) {
                console.error('Failed to fetch graph from database:', error);
            }
        },

        reset: () => {
            updateState(set, {
                nodes: [],
                edges: []
            });
        }
    };
}
