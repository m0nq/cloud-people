import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { EdgeTypes } from '@xyflow/react';
import { NodeTypes } from '@xyflow/react';
import { OnNodesChange } from '@xyflow/react';
import { OnEdgesChange } from '@xyflow/react';
import { OnNodesDelete } from '@xyflow/react';
import { OnConnect } from '@xyflow/react';
import { NodeMouseHandler } from '@xyflow/react';
import { ReactNode } from 'react';
import { useMemo } from 'react';
import { useCallback } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';

import { createEdge } from '@lib/actions/edge-actions';
import { layoutElements } from '@lib/dagre/dagre';
import { AppState } from '@lib/definitions';
import { AgentData } from '@lib/definitions';
import { useGraphStore } from '@stores/workflowStore';
import { ROOT_NODE_SPACING_X } from '@config/layout.const';
import { NODE_SPACING_X } from '@config/layout.const';
import { NODE_SPACING_Y } from '@config/layout.const';

const AgentSelectionModal = dynamic(() => import('@components/modals/agent-selection-modal'), { ssr: false });
const AutomationNode = dynamic(() => import('@components/sandbox-nodes/automation-node'), { ssr: false });
const AutomationEdge = dynamic(() => import('@components/sandbox-nodes/automation-edge'), { ssr: false });
const InitialStateNode = dynamic(() => import('@components/sandbox-nodes/initial-state-node'), { ssr: false });
const RootNode = dynamic(() => import('@components/sandbox-nodes/root-node'), { ssr: false });

type WorkflowRendererProps = {
    children: (props: {
        nodes: Node[];
        edges: Edge[];
        edgeTypes: EdgeTypes;
        nodeTypes: NodeTypes;
        onNodesChange?: OnNodesChange;
        onEdgesChange?: OnEdgesChange;
        onNodesDelete?: OnNodesDelete;
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
 * - onNodesChange: A callback to call when the nodes change.
 * - onEdgesChange: A callback to call when the edges change.
 * - onConnect: A callback to call when two nodes are connected.
 */
const nodeStateSelector = (state: AppState) => ({
    nodes: state.nodes,
    edges: state.edges,
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect
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
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useGraphStore(useShallow(nodeStateSelector));

    const [modalState, setModalState] = useState<{ isOpen: boolean; parentNodeId: string | null }>({
        isOpen: false,
        parentNodeId: null
    });
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // Modify nodes to inject the modal open handler into root node data
    const nodesWithHandlers = useMemo(() => {
        return nodes.map((node: Node): Node => {
            if (node.type !== 'initialStateNode') {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        onOpenModal: () => {
                            setSelectedNode(node);
                            setModalState({ isOpen: true, parentNodeId: node.id });
                        }
                    }
                };
            }
            return node;
        });
    }, [nodes]);

    const [layout, setLayout] = useState({ nodes: nodesWithHandlers, edges });

    // Calculate layout on client-side only
    useEffect(() => {
        const { laidOutNodes, laidOutEdges } = layoutElements(nodesWithHandlers, edges);
        setLayout({ nodes: laidOutNodes, edges: laidOutEdges });
    }, [nodesWithHandlers, edges]);

    const onNodesDelete = useCallback((nodes: Node[]) => {
        const [node]: Node[] = nodes;
        // Prevent the default deletion behavior if node is an initial state node
        return node && !node.type?.includes('initialStateNode');
    }, []);

    const handleAgentSelection = async (agentData: AgentData) => {
        try {
            const parentNode = layout.nodes.find(n => n.id === modalState.parentNodeId);
            
            if (!parentNode) {
                console.error('Parent node not found. Modal state:', modalState);
                throw new Error('Parent node not found');
            }

            // Calculate the position using the same logic as layoutElements
            const isParentRoot = parentNode.type === 'rootNode';
            const siblings = edges.filter(e => e.source === parentNode.id).map(e => e.target);
            const siblingIndex = siblings.length; // New node will be the last sibling
            const totalSiblings = siblings.length + 1;
            
            const newPosition = {
                x: parentNode.position.x + (isParentRoot ? ROOT_NODE_SPACING_X : NODE_SPACING_X),
                y: parentNode.position.y + (siblingIndex - (totalSiblings - 1) / 2) * NODE_SPACING_Y
            };

            // Create new node with agent data
            const newNode = {
                type: 'automationNode',
                data: {
                    ...agentData,
                    currentStep: '0',
                    workflowId: parentNode.data?.workflowId
                },
                position: newPosition
            };


            // Update store - this will also persist to database
            const { id: nodeId } = await useGraphStore.getState().addNode?.(newNode);

            // Create edge in database first
            const edgeId = await createEdge({
                workflowId: parentNode.data?.workflowId,
                toNodeId: nodeId,
                fromNodeId: modalState.parentNodeId
            });

            // Then update the store with the edge
            const newEdge = {
                id: edgeId,
                source: modalState.parentNodeId,
                target: nodeId,
                type: 'automationEdge',
                animated: true,
                data: {
                    workflowId: parentNode.data?.workflowId
                }
            };

            const currentEdges = useGraphStore.getState().edges;
            await useGraphStore.getState().setEdges?.([...currentEdges, newEdge]);
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
