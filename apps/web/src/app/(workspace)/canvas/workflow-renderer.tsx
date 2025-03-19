import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { type NodeChange } from '@xyflow/react';
import { type Position } from '@xyflow/react';
import { EdgeTypes } from '@xyflow/react';
import { NodeTypes } from '@xyflow/react';
import { OnNodesChange } from '@xyflow/react';
import { OnEdgesChange } from '@xyflow/react';
import { OnNodesDelete } from '@xyflow/react';
import { OnBeforeDelete } from '@xyflow/react';
import { OnConnect } from '@xyflow/react';
import { NodeMouseHandler } from '@xyflow/react';
import { type ReactNode } from 'react';
import { useMemo } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useTransition } from 'react';
import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';

import { type InitialStateNodeData } from '@app-types/workflow';
import { type NodeData } from '@app-types/workflow';
import type { WorkflowStore } from '@app-types/workflow';
import { useWorkflowStore } from '@stores/workflow';
import { AgentNode } from '@components/canvas-nodes';
import { InitialStateNode } from '@components/canvas-nodes';
import { RootNode } from '@components/canvas-nodes';
import { layoutElements } from '@lib/dagre/dagre';
import { EdgeType } from '@app-types/workflow/node-types';
import { NodeType } from '@app-types/workflow/node-types';

const Modal = dynamic(() => import('@components/modals/modal'), { ssr: false });
const ApprovalNode = dynamic(() => import('@components/canvas-nodes').then(mod => mod.ApprovalNode), { ssr: false });
const DeliveryNode = dynamic(() => import('@components/canvas-nodes').then(mod => mod.DeliveryNode), { ssr: false });
const AutomationEdge = dynamic(() => import('@components/canvas-nodes').then(mod => mod.AutomationEdge), { ssr: false });

type WorkflowRendererProps = {
    children: (props: {
        nodes?: Node<NodeData | InitialStateNodeData>[];
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
    [NodeType.Initial]: InitialStateNode,
    [NodeType.Root]: RootNode,
    [NodeType.Agent]: AgentNode,
    [NodeType.Approval]: ApprovalNode,
    [NodeType.Delivery]: DeliveryNode
} as NodeTypes;

const edgeTypes = {
    [EdgeType.Automation]: AutomationEdge
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
const nodeStateSelector = (state: WorkflowStore) => ({
    nodes: state.nodes,
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
 * import { WorkflowRenderer } from '@app/(workspace)/canvas/workflow-renderer';
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
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
        console.log('WorkflowRenderer rendering');
    }

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
    } = useWorkflowStore(useShallow(nodeStateSelector));

    // Log when nodes or edges change - only in development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Nodes or edges changed:', { nodesCount: nodes.length, edgesCount: edges.length });
        }
    }, [nodes, edges]);

    // Only create a new reference if the nodes array actually changes
    const nodesWithModals = useMemo(() => nodes, [nodes]);

    const [layout, setLayout] = useState<{ nodes: Node<NodeData | InitialStateNodeData>[]; edges: Edge[] }>({
        nodes: nodesWithModals,
        edges
    });

    // Track nodes that are currently being positioned
    const positioningNodesRef = useRef(new Set<string>());

    // Batch updates using transition
    const [isPending, startTransition] = useTransition();

    // Type for position changes
    type PositionChange = NodeChange & {
        type: 'position';
        position?: Position;
        dragging?: boolean;
    };

    // Calculate layout on client-side only, but only when necessary
    useEffect(() => {
        let isSubscribed = true;

        const updateLayout = (newNodes: Node<NodeData | InitialStateNodeData>[], newEdges: Edge[]) => {
            if (!isSubscribed) return;

            // Use startTransition to batch updates and reduce render priority
            startTransition(() => {
                setLayout({ nodes: newNodes, edges: newEdges });
            });
        };

        // Only recalculate layout when necessary
        const hasNewNodes = nodesWithModals.some(node => !node.position);
        const hasInitialNodes = nodesWithModals.some(node => node.type === NodeType.Initial);

        if (hasNewNodes || hasInitialNodes) {
            const { laidOutNodes, laidOutEdges } = layoutElements(nodesWithModals, edges);
            updateLayout(laidOutNodes, laidOutEdges);
        } else {
            updateLayout(nodesWithModals, edges);
        }

        return () => {
            isSubscribed = false;
        };
    }, [nodesWithModals, edges, startTransition]);

    // Memoize the node click handler to avoid unnecessary re-renders
    const onNodeClick = useCallback<NodeMouseHandler>(
        (event, node) => {
            // Prevent default behavior
            event.preventDefault();
            // Only log in development mode
            if (process.env.NODE_ENV === 'development') {
                console.log('Node clicked:', node);
            }
        },
        []
    );

    // Memoize the props to avoid unnecessary re-renders
    const props = useMemo(
        () => ({
            nodes: layout.nodes,
            edges: layout.edges,
            edgeTypes,
            nodeTypes,
            onNodesChange,
            onEdgesChange,
            onNodesDelete,
            onBeforeDelete,
            onConnect,
            onNodeClick
        }),
        [layout.nodes, layout.edges, onNodesChange, onEdgesChange, onNodesDelete, onBeforeDelete, onConnect, onNodeClick]
    );

    // Return the children with the props and the Modal component
    return children ? (
        <>
            {children(props)}
            <Modal />
        </>
    ) : null;
};
