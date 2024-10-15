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

export type NodeQueryConfig = {
    filter?: {
        id?: {
            eq: string;
        };
    };
    workflowId?: string;
    first?: number;
    last?: number;
    offset?: number;
    data?: string;
    userId?: string;
    set?: {
        state?: WorkflowState;
        currentStep?: string;
        data?: string;
    };
    atMost?: number;
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
    user_id: string;
    state: WorkflowState;
    current_step?: string;
    data?: string;
}
