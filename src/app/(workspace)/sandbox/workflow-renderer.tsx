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
import { MouseEvent } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { v4 as uuid } from 'uuid';
import { useShallow } from 'zustand/react/shallow';

import { layoutElements } from '@lib/dagre/dagre';
import { AppState } from '@lib/definitions';
import { useGraphStore } from '@stores/workflowStore';

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
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect
    } = useGraphStore(useShallow(nodeStateSelector));

    const [isModalOpen, setIsModalOpen] = useState(false);
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
                            setIsModalOpen(true);
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

    const onNodeClick = (event: MouseEvent, node: Node) => {
        // Don't handle node clicks directly - modal will be opened by handle click
        return;
    };

    const handleAgentSelect = async (agentData: any) => {
        if (selectedNode) {
            try {
                // Create new node with agent data
                const newNode = {
                    id: `node-${uuid()}`, // This ID will be replaced by the database-generated ID
                    type: 'automationNode',
                    data: {
                        ...agentData,
                        currentStep: 0 // Initialize at step 0
                    },
                    position: { x: 0, y: 0 } // Position will be handled by dagre layout
                };

                // Create edge connecting selected node to new node
                const newEdge = {
                    id: `edge-${selectedNode.id}-${newNode.id}`,
                    source: selectedNode.id,
                    target: newNode.id,
                    type: 'automationEdge',
                    animated: true
                };

                // Update store - this will also persist to database
                await useGraphStore.getState().addNode?.(newNode);
                await useGraphStore.getState().setEdges?.([...edges, newEdge]);
            } catch (error) {
                console.error('Failed to add node or edge:', error);
                // TODO: Show error toast to user
            }
        }
        setIsModalOpen(false);
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
                onConnect,
                onNodeClick
            })}
            <AgentSelectionModal isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleAgentSelect} />
        </>
    );
};
