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
    onNodesChange?: OnNodesChange<Node>;
    onEdgesChange?: OnEdgesChange;
    onConnect?: OnConnect;
    setNodes?: (nodes: Node[]) => void;
    setEdges?: (edges: Edge[]) => void;
    addNode?: (node: Node) => void;
    fetchGraph?: (workflowId: string) => void;
    createNewWorkflow?: () => void;
    reset?: () => void;
};

export type QueryUpdateConfig = {
    state?: WorkflowState;
    currentStep?: string;
    data?: string;
    updatedAt?: Date;
}

export type QueryFilterConfig = {
    [prop: string]: {
        eq: string;
    };
}

export type QueryConfig = {
    filter?: QueryFilterConfig;
    workflowId?: string;
    first?: number;
    last?: number;
    offset?: number;
    data?: string;
    userId?: string;
    set?: QueryUpdateConfig;
    atMost?: number;
    currentStep?: string;
}

export enum WorkflowState {
    Initial = 'Initial',
    Build = 'Build',
    Running = 'Running',
    Error = 'Error',
    Complete = 'Complete'
}

export type WorkflowType = {
    id: string;
    userId?: string;
    state?: WorkflowState;
    currentStep?: string;
    data?: string;
}

export type NodeType = {
    id: string;
    workflowId?: string;
    state?: string;
    currentStep?: string;
}

export type QueryResults = {
    data: {
        collection: {
            records: any[]
        }
    }
}
