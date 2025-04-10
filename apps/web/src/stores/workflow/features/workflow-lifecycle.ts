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

import { workflowService } from '@lib/service-providers/workflow-service';
import { nodeService } from '@lib/service-providers/node-service';

import { fetchWorkflowNodes } from '@lib/actions/canvas-actions';
import { fetchWorkflowEdges } from '@lib/actions/canvas-actions';

import { updateState } from '../utils/state-helpers';
import { findRootNode } from '../utils/state-helpers';
import { findNextNode } from '../utils/state-helpers';
import { getConnectedNodes } from '../utils/state-helpers';

import { isInitialStateNode } from './node-validation';
import { hasWorkflowId } from './node-validation';
import { isWorkflowNode } from './node-validation';

export function createWorkflowLifecycle(set: Function, get: Function) {
    return {
        createNewWorkflow: async () => {
            try {
                console.log(`[WorkflowLifecycle] createNewWorkflow called. Using mode: ${workflowService._mode}`);

                const workflowId = await workflowService.createWorkflow();
                if (!workflowId) {
                    throw new Error('Failed to create workflow');
                }
                console.log(`[WorkflowLifecycle] Workflow created with ID: ${workflowId}`);

                const dbNode = await nodeService.createNodes({
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
                    await nodeService.updateNodes({
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
            const { nodes, edges } = get();
            let parentNodeId = agent.parentNodeId;
            let workflowId: string | null = null;

            if (nodes.length > 0) {
                const rootNode = findRootNode(nodes);
                if (rootNode && rootNode.data && hasWorkflowId(rootNode)) {
                    workflowId = rootNode.data.workflowId;
                }
            }

            if (!workflowId) {
                console.error('Workflow ID is missing and could not be derived from root node.');
                throw new Error('Workflow ID is required to add an agent.');
            }

            if (!parentNodeId && nodes.length > 0) {
                const nodesWithOutgoingEdges = new Set(edges.map(edge => edge.source));

                const leafNodes = nodes.filter(node =>
                    !isInitialStateNode(node) &&
                    node.type !== NodeType.Root &&
                    !nodesWithOutgoingEdges.has(node.id) &&
                    hasWorkflowId(node)
                );

                if (leafNodes.length > 0) {
                    parentNodeId = leafNodes[0].id;
                    console.log(`No parentNodeId provided, using leaf node: ${parentNodeId}`);
                }
            }

            if (!parentNodeId) {
                const rootNode = findRootNode(nodes);
                if (rootNode) {
                    parentNodeId = rootNode.id;
                    console.log(`Falling back to root node as parent: ${parentNodeId}`);
                }
            }

            if (!parentNodeId) {
                console.error('Could not determine a parent node for the new agent.');
                throw new Error('Failed to determine parent node.');
            }

            const newNodeData = {
                workflowId,
                parentId: parentNodeId,
                nodeType: NodeType.Agent,
                data: { agentId: agent.id }
            };

            const dbNode = await nodeService.createNodes({ data: newNodeData });

            if (!dbNode || !dbNode?.id) {
                throw new Error('Failed to create agent node in database');
            }

            const newNode = {
                id: dbNode.id,
                type: NodeType.Agent,
                data: {
                    id: dbNode.id,
                    type: NodeType.Agent,
                    label: agent.name,
                    workflowId: workflowId,
                    agentRef: { agentId: agent.id }
                },
                position: { x: 0, y: 0 },
                sourcePosition: Position.Right,
                targetPosition: Position.Left
            } as Node<NodeData>;

            const newEdge: Edge<EdgeData> = {
                id: `e-${parentNodeId}-${newNode.id}`,
                source: parentNodeId,
                target: newNode.id,
                type: EdgeType.Automation,
                animated: true,
                data: {
                    id: `e-${parentNodeId}-${newNode.id}`,
                    workflowId: workflowId,
                    toNodeId: newNode.id,
                    fromNodeId: parentNodeId
                }
            };

            const parentNode = nodes.find(n => n.id === parentNodeId);
            if (parentNode) {
                newNode.position = {
                    x: parentNode.position.x + 400,
                    y: parentNode.position.y
                };
            }

            updateState(set, {
                nodes: [...nodes, newNode],
                edges: [...edges, newEdge]
            });

            console.log('Agent node added to workflow:', newNode);
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
