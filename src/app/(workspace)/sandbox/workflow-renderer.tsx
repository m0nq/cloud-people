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

import dynamic from 'next/dynamic';

import { useGraphStore } from '@stores/workflowStore';
import { useShallow } from 'zustand/react/shallow';
import { AppState } from '@lib/definitions';
import { layoutElements } from '@lib/dagre/dagre';

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

    const { laidOutNodes, laidOutEdges } = useMemo(() => {
        return layoutElements(nodes, edges);
    }, [nodes, edges]);

    const onNodesDelete = useCallback((nodes: Node[]) => {
        const [node]: Node[] = nodes;
        // Prevent the default deletion behavior if node is an initial state node
        return node && !node.type?.includes('initialStateNode');
    }, [nodes]);

    const onNodeClick = (event: MouseEvent, node: Node) => {
        // Node click logic
    };

    return children({
        nodes: laidOutNodes,
        edges: laidOutEdges,
        edgeTypes,
        nodeTypes,
        onNodesChange,
        onEdgesChange,
        onNodesDelete,
        onConnect,
        onNodeClick
    });
};
