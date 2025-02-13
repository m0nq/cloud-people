import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { getConnectedEdges } from '@xyflow/react';

import type { GraphState } from '@app-types/workflow';
import type { NodeData } from '@app-types/workflow';
import type { InitialStateNodeData } from '@app-types/workflow';
import type { EdgeData } from '@app-types/workflow';
import { isInitialStateNode } from '@stores/workflow';
import { Config } from '@config/constants';

const { WorkflowNode } = Config;

export const updateState = (set: Function, newState: Partial<GraphState>) => {
    set((currentState: any) => ({
        ...currentState,
        ...newState
    }));
};

export const findRootNode = (nodes: Node<NodeData | InitialStateNodeData>[]): Node<NodeData> | undefined => {
    return nodes.find((node): node is Node<NodeData> => !isInitialStateNode(node) && node.type === WorkflowNode.RootNode);
};

export const findNextNode = (nodes: Node<NodeData>[], edges: Edge<EdgeData>[], currentNodeId: string): Node<NodeData> | undefined => {
    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
    if (outgoingEdges.length === 0) return undefined;

    const nextNodeId = outgoingEdges[0].target;
    return nodes.find(node => node.id === nextNodeId);
};

export const getConnectedNodes = (get: Function, node: Node): Node[] => {
    const { nodes, edges } = get();
    const nodeMap = new Map(nodes.map((n: Node<NodeData>) => [n.id, n]));
    const connectedEdges = getConnectedEdges([node], edges);
    return connectedEdges.map(e => nodeMap.get(e.source) || nodeMap.get(e.target)).filter((n): n is Node => !!n);
};

export const isCurrentNode = (get: Function, nodeId: string): boolean => {
    const { workflowExecution } = get();
    return workflowExecution?.currentNodeId === nodeId;
};
