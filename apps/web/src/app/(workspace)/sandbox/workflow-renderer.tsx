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
import { type ReactNode } from 'react';
import { useMemo } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';

import { type InitialStateNodeData } from '@app-types/workflow';
import { type NodeData } from '@app-types/workflow';
import { WorkflowState } from '@app-types/workflow';
import { type WorkflowStore } from '@stores/workflow/types';
import { Config } from '@config/constants';
import { useWorkflowStore } from '@stores/workflow';
import { useModalStore } from '@stores/modal-store';
import { useShallow } from 'zustand/react/shallow';

import dynamic from 'next/dynamic';

import InitialStateNode from '@components/sandbox-nodes/initial-state-node';
import RootNode from '@components/sandbox-nodes/root-node';
import AgentNode from '@components/sandbox-nodes/agent-node';
import { layoutElements } from '@lib/dagre/dagre';

const { WorkflowNode } = Config;

const Modal = dynamic(() => import('@components/modals/modal'), { ssr: false });
const ApprovalNode = dynamic(() => import('@components/sandbox-nodes/approval-node'), { ssr: false });
const DeliveryNode = dynamic(() => import('@components/sandbox-nodes/delivery-node'), { ssr: false });
const AutomationEdge = dynamic(() => import('@components/sandbox-nodes/automation-edge'), { ssr: false });

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
    [WorkflowNode.InitialStateNode]: InitialStateNode,
    [WorkflowNode.RootNode]: RootNode,
    [WorkflowNode.AgentNode]: AgentNode,
    [WorkflowNode.ApprovalNode]: ApprovalNode,
    [WorkflowNode.DeliveryNode]: DeliveryNode
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
    } = useWorkflowStore(useShallow(nodeStateSelector));

    const { openModal } = useModalStore();

    // Modify nodes to inject the modal open handler into root node data
    const nodesWithModals = useMemo(() => {
        return nodes?.map((node) => {
            if (node.data.type !== WorkflowNode.InitialStateNode) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        onOpenModal: (modalType: string) => {
                            openModal({ parentNodeId: node.id, type: modalType });
                        }
                    }
                } as Node<NodeData>;
            }
            return node;
        });
    }, [nodes, openModal]);

    const [layout, setLayout] = useState<{ nodes: Node<NodeData | InitialStateNodeData>[]; edges: Edge[] }>({
        nodes: nodesWithModals,
        edges
    });

    // Calculate layout on client-side only
    useEffect(() => {
        let isSubscribed = true;

        const calculateLayout = () => {
            const { laidOutNodes, laidOutEdges } = layoutElements(nodesWithModals, edges);
            if (isSubscribed) {
                setLayout({ nodes: laidOutNodes, edges: laidOutEdges });
            }
        };

        calculateLayout();

        // Cleanup function
        return () => {
            isSubscribed = false;
        };
    }, [nodesWithModals, edges]);

    // Cleanup memoized handlers when component unmounts
    useEffect(() => {
        return () => {
            // Clean up any stored node handlers
            nodesWithModals?.forEach((node: Node<NodeData>) => {
                if (node.data?.onOpenModal) {
                    node.data.onOpenModal = undefined;
                }
            });
        };
    }, [nodesWithModals]);

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
            <Modal />
        </>
    );
};
