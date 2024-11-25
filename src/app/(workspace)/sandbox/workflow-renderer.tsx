import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { EdgeTypes } from '@xyflow/react';
import { NodeTypes } from '@xyflow/react';
import { OnNodesChange } from '@xyflow/react';
import { OnEdgesChange } from '@xyflow/react';
import { OnNodesDelete } from '@xyflow/react';
import { OnBeforeDelete } from '@xyflow/react';
import { OnConnect } from '@xyflow/react';
import { NodeMouseHandler } from '@xyflow/react';
import { getConnectedEdges } from '@xyflow/react';
import { Position } from '@xyflow/react';
import { ReactNode } from 'react';
import { useMemo } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { v4 as uuid } from 'uuid';

import { createEdge } from '@lib/actions/edge-actions';
import { layoutElements } from '@lib/dagre/dagre';
import { AppState } from '@lib/definitions';
import { InitialStateNodeData } from '@lib/definitions';
import { AgentData } from '@lib/definitions';
import { WorkflowState } from '@lib/definitions';
import { NodeData } from '@lib/definitions';
import { useGraphStore } from '@stores/workflow-store';
import { ROOT_NODE_SPACING_X } from '@config/layout.const';
import { NODE_SPACING_X } from '@config/layout.const';
import { NODE_SPACING_Y } from '@config/layout.const';
import { Config } from '@config/constants';

const { WorkflowNode } = Config;

const AgentSelectionModal = dynamic(() => import('@components/modals/agent-selection-modal'), { ssr: false });
const AutomationNode = dynamic(() => import('@components/sandbox-nodes/automation-node'), { ssr: false });
const AutomationEdge = dynamic(() => import('@components/sandbox-nodes/automation-edge'), { ssr: false });
const InitialStateNode = dynamic(() => import('@components/sandbox-nodes/initial-state-node'), { ssr: false });
const RootNode = dynamic(() => import('@components/sandbox-nodes/root-node'), { ssr: false });

type WorkflowRendererProps = {
    children: (props: {
        nodes?: Node<NodeData>[];
        edges?: Edge[];
        edgeTypes?: EdgeTypes;
        nodeTypes?: NodeTypes;
        onNodesChange?: OnNodesChange;
        onEdgesChange?: OnEdgesChange;
        onNodesDelete?: OnNodesDelete;
        onBeforeDelete?: OnBeforeDelete;
        onConnect?: OnConnect;
        onNodeClick?: NodeMouseHandler;
    }) => ReactNode;
};

const nodeTypes = {
    initialStateNode: InitialStateNode,
    rootNode: RootNode,
    automationNode: AutomationNode
} as NodeTypes;

const edgeTypes = {
    automationEdge: AutomationEdge
} as EdgeTypes;

/**
 * Selects the parts of the graph state that we need to pass down to the workflow renderer.
 *
 * @param state - The entire graph state.
 * @returns An object with the following properties:
 * - nodes: The nodes in the graph.
 * - edges: The edges in the graph.
 * - onEdgesChange: A callback to call when the edges change.
 * - onConnect: A callback to call when two nodes are connected.
 */
const nodeStateSelector = (state: AppState) => ({
    nodes: state.nodes as (Node<NodeData> | Node<InitialStateNodeData>)[],
    edges: state.edges,
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
    onBeforeDelete: state.onBeforeDelete,
    onNodesDelete: state.onNodesDelete
});

/**
 * A component that renders a workflow graph with interactive nodes and edges.
 *
 * It uses the `useGraphStore` hook to retrieve the graph state from the store and
 * the `useShallow` hook to memoize the graph state.
 *
 * The component takes a single prop, `children`, which should be a function that
 * takes the graph state and returns a React element.
 *
 * The component also renders an `AgentSelectionModal` component that is used to
 * select agents when a node is clicked.
 *
 * The component handles the following events:
 * - Node clicks: Opens the agent selection modal if the node is not an initial
 *   state node.
 * - Edge connections: Called when two nodes are connected.
 * - Node deletions: Called when a node is deleted. Prevents the default deletion
 *   behavior if the node is an initial state node.
 *
 * @example
 * import { WorkflowRenderer } from '@app/(workspace)/sandbox/workflow-renderer';
 *
 * const MyWorkflow = () => {
 *   return (
 *     <WorkflowRenderer>
 *       {({ nodes, edges, edgeTypes, nodeTypes, onNodesChange, onEdgesChange, onNodesDelete, onConnect, onNodeClick })
 *     => (
 *         <div>
 *           <ReactFlow
 *             nodes={nodes}
 *             edges={edges}
 *             edgeTypes={edgeTypes}
 *             nodeTypes={nodeTypes}
 *             onNodesChange={onNodesChange}
 *             onEdgesChange={onEdgesChange}
 *             onNodesDelete={onNodesDelete}
 *             onBeforeDelete={onBeforeDelete}
 *             onConnect={onConnect}
 *             onNodeClick={onNodeClick}
 *           />
 *         </div>
 *       )}
 *     </WorkflowRenderer>
 *   );
 * };
 */
export const WorkflowRenderer = ({ children }: WorkflowRendererProps) => {
    // Load with initial state nodes
    // when a node is clicked, corresponding nodes will be updated by our graph store
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onBeforeDelete,
        onNodesDelete
    } = useGraphStore(useShallow(nodeStateSelector));

    const [modalState, setModalState] = useState<{ isOpen: boolean; parentNodeId: string | null }>({
        isOpen: false,
        parentNodeId: null
    });

    // Modify nodes to inject the modal open handler into root node data
    const nodesWithHandlers = useMemo(() => {
        return nodes.map((node: Node<NodeData>): Node<NodeData> => {
            if (node.type !== WorkflowNode.InitialStateNode) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        onOpenModal: () => {
                            setModalState({ isOpen: true, parentNodeId: node.id });
                        }
                    }
                };
            }
            return node;
        });
    }, [nodes]);

    const [layout, setLayout] = useState<{ nodes: Node<NodeData>[]; edges: Edge[] }>({
        nodes: nodesWithHandlers,
        edges
    });

    // Calculate layout on client-side only
    useEffect(() => {
        const { laidOutNodes, laidOutEdges } = layoutElements(nodesWithHandlers, edges);
        setLayout({ nodes: laidOutNodes, edges: laidOutEdges });
    }, [nodesWithHandlers, edges]);

    const handleAgentSelection = async (agentData: AgentData): Promise<void> => {
        try {
            const parentNode = layout.nodes.find((n: Node<NodeData>) => n.id === modalState.parentNodeId);

            if (!parentNode || !parentNode.data?.workflowId) {
                console.error('Parent node not found or missing workflowId. Modal state:', modalState);
                throw new Error('Parent node not found or missing workflowId');
            }

            const workflowId = (parentNode.data as NodeData).workflowId ?? '';

            // Get all existing siblings and their positions
            const siblings: string[] = getConnectedEdges([parentNode], edges)
                .map((e: Edge) => e.target);

            // Include the new node in sibling calculations
            const totalSiblings = siblings.length + 1;
            const isParentRootNode = parentNode.type === WorkflowNode.RootNode;

            // Create position changes for existing siblings
            const nodeChanges = siblings.map((siblingId: string, index: number) => ({
                type: 'position' as const,
                id: siblingId,
                position: {
                    x: parentNode.position.x + (isParentRootNode ? ROOT_NODE_SPACING_X : NODE_SPACING_X),
                    y: parentNode.position.y + (index - (totalSiblings - 1) / 2) * NODE_SPACING_Y
                }
            }));

            // Apply position changes to existing nodes
            onNodesChange?.(nodeChanges);

            // Position for the new node
            const newPosition = {
                x: parentNode.position.x + (isParentRootNode ? ROOT_NODE_SPACING_X : NODE_SPACING_X),
                y: parentNode.position.y + (siblings.length - (totalSiblings - 1) / 2) * NODE_SPACING_Y
            };

            // Create new node with agent data
            const newNode = {
                id: uuid(),
                type: WorkflowNode.AutomationNode,
                data: {
                    ...agentData,
                    currentStep: '0',
                    state: WorkflowState.Initial,
                    workflowId
                },
                position: newPosition,
                dragHandle: '.nodrag',
                sourcePosition: Position.Right,
                targetPosition: Position.Left
            } as Node<NodeData>;

            // Add the new node
            const store = useGraphStore.getState();
            if (!store.addNode) {
                throw new Error('addNode function is not available');
            }
            const { id: nodeId } = await store.addNode(newNode);

            // Create edge in database only if we have a valid parent node
            if (modalState.parentNodeId) {
                const edgeId = await createEdge({
                    workflowId,
                    toNodeId: nodeId,
                    fromNodeId: modalState.parentNodeId
                });

                // Update the store with the edge
                const newEdge = {
                    id: edgeId,
                    source: modalState.parentNodeId,
                    target: nodeId,
                    type: WorkflowNode.AutomationEdge,
                    animated: true,
                    data: {
                        workflowId
                    }
                };

                const currentEdges = useGraphStore.getState().edges;
                await useGraphStore.getState().setEdges?.([...currentEdges, newEdge]);
            }
        } catch (error) {
            console.error('Failed to add node or edge:', error);
            // TODO: Show error toast to user
        }

        // Reset modal state
        setModalState({ isOpen: false, parentNodeId: null });
    };

    return (
        <>
            {children({
                nodes: layout.nodes,
                edges: layout.edges,
                edgeTypes,
                nodeTypes,
                onNodesChange,
                onEdgesChange,
                onBeforeDelete,
                onNodesDelete,
                onConnect
            })}
            <AgentSelectionModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, parentNodeId: null })}
                onSelect={handleAgentSelection}
            />
        </>
    );
};
