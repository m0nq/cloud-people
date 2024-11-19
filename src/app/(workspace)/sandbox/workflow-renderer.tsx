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
import { useShallow } from 'zustand/react/shallow';
import { v4 as uuid } from 'uuid';

import { useGraphStore } from '@stores/workflowStore';
import { AppState } from '@lib/definitions';
import { layoutElements } from '@lib/dagre/dagre';

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

const nodeStateSelector = (state: AppState) => ({
    nodes: state.nodes,
    edges: state.edges,
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect
});

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
        return nodes.map((node: { type: string; data: any; }) => {
            if (node.type === 'rootNode') {
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
        // Don't open modal for initial state nodes
        if (node.type?.includes('initialStateNode')) {
            return;
        }
        setSelectedNode(node);
        setIsModalOpen(true);
    };

    const handleAgentSelect = (agentData: any) => {
        if (selectedNode) {
            // Create new node with agent data
            const newNode = {
                id: `node-${uuid()}`,
                type: 'automationNode',
                data: agentData,
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

            // Update store
            useGraphStore.getState().addNode?.(newNode);
            useGraphStore.getState().setEdges?.([...edges, newEdge]);
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
