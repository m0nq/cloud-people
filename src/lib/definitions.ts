import { ReactNode } from 'react';
import { Node } from '@xyflow/react';
import { Edge } from '@xyflow/react';
import { OnNodesChange } from '@xyflow/react';
import { OnEdgesChange } from '@xyflow/react';
import { OnConnect } from '@xyflow/react';

export type LayoutProps = {
    params?: any;
    children?: ReactNode;
}

export type EdgeConnections = {
    id?: string,
    source?: string,
    target?: string,
    type?: string,
    animated?: boolean
}

export type AppState = {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange<Node>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
};
