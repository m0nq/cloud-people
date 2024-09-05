import { ReactNode } from 'react';
import { Node } from '@xyflow/react';
import { Edge } from '@xyflow/react';
import { OnNodesChange } from '@xyflow/react';
import { OnEdgesChange } from '@xyflow/react';

export type LayoutProps = {
    params?: any;
    children?: ReactNode;
}

export type RFState = {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
}

export type EdgeConnections = {
    id?: string,
    source?: string,
    target?: string,
    type?: string,
    animated?: boolean
}
