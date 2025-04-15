import { type Connection } from '@xyflow/react';
import { Edge } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import type { NodeData } from '@app-types/workflow';
import type { InitialStateNodeData } from '@app-types/workflow';
import type { EdgeData } from '@app-types/workflow';
import { findRootNode } from '@stores/workflow';
import { NodeType } from '@app-types/workflow/node-types';

export const isInitialStateNode = (node: Node<NodeData | InitialStateNodeData>): node is Node<InitialStateNodeData> => {
    // Safely check for type property and compare value
    return !!(node.data && 'type' in node.data && node.data.type === NodeType.Initial);
};

export const isRootNode = (node: Node<NodeData | InitialStateNodeData>): node is Node<InitialStateNodeData> => {
    // Assumes root node is the same as initial state node for now - Apply same safe check
    return !!(node.data && 'type' in node.data && node.data.type === NodeType.Initial);
};

export const isWorkflowNode = (node: Node<NodeData | InitialStateNodeData>): node is Node<NodeData> => {
    return !isInitialStateNode(node) && !isRootNode(node);
};

export const isValidWorkflowNode = (node: Node<NodeData | InitialStateNodeData>): node is Node<NodeData> => {
    return isWorkflowNode(node) && !!node.data?.workflowId;
};

export const hasWorkflowId = (node: Node<NodeData | InitialStateNodeData>): node is Node<NodeData> => {
    return !!node.data?.workflowId;
};

export const validateConnection = (get: Function, connection: Connection): boolean => {
    const { nodes, edges } = get();

    // Basic field validation
    if (!(connection.source && connection.target && connection.sourceHandle && connection.targetHandle)) {
        return false;
    }

    // Prevent connecting to root node as target
    const targetNode = nodes.find((n: Node<NodeData>) => n.id === connection.target);
    const rootNode = findRootNode(nodes);
    if (targetNode && rootNode?.id === targetNode.id) {
        return false;
    }

    // Prevent multiple outgoing edges
    const sourceHasOutgoing = edges.some((e: Edge<EdgeData>) => e.source === connection.source);
    if (sourceHasOutgoing) {
        return false;
    }

    // Prevent cycles by checking if target node leads back to source
    const wouldCreateCycle = (source: string, target: string, visited = new Set<string>()): boolean => {
        if (source === target) return true;
        if (visited.has(target)) return false;

        visited.add(target);
        const outgoingEdges = edges.filter((e: Edge<EdgeData>) => e.source === target);
        return outgoingEdges.some((e: Edge<EdgeData>) => wouldCreateCycle(source, e.target, visited));
    };

    return !wouldCreateCycle(connection.source, connection.target);
};
