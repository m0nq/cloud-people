import { type Edge } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import { type OnConnect } from '@xyflow/react';
import { type OnEdgesChange } from '@xyflow/react';
import { type OnNodesChange } from '@xyflow/react';
import { type OnBeforeDelete } from '@xyflow/react';
import { type OnNodesDelete } from '@xyflow/react';
import { type ReactNode } from 'react';

export type LayoutProps = {
    params?: any;
    children?: ReactNode;
};

export type EdgeConnections = {
    id?: string;
    source?: string;
    target?: string;
    type?: string;
    animated?: boolean;
};

export type InitialStateNodeData = {
    id: string;
    label: string;
    background: string;
    color: string;
    workflowId?: string;
};

export type NodeData = {
    workflowId?: string;
    label?: string;
    currentStep?: string;
    state?: WorkflowState;
    status?: AgentStatus;
    onOpenModal?: (modalType: string) => void;
};

export type EdgeData = {
    workflowId?: string;
    type: string;
};

export type AppState = {
    nodes: (Node<NodeData> | Node<InitialStateNodeData>)[];
    edges: Edge[];
    onNodesChange?: OnNodesChange;
    onEdgesChange?: OnEdgesChange;
    onBeforeDelete?: OnBeforeDelete;
    onNodesDelete?: OnNodesDelete;
    onConnect?: OnConnect;
    setNodes?: (nodes: (Node<NodeData> | Node<InitialStateNodeData>)[]) => void;
    setEdges?: (edges: Edge[]) => void;
    addNode?: (node: AgentData) => Promise<void>;
    // should take a tuple of nodes?
    addEdge?: (edge: Edge) => void;
    fetchGraph?: (workflowId: string) => void;
    createNewWorkflow?: () => Promise<string>;
    reset?: () => void;
};

export type QueryUpdateConfig = {
    state?: WorkflowState;
    current_step?: string;
    data?: string;
    updated_at?: Date;
};

export type QueryFilterConfig = {
    [prop: string]: {
        eq: string;
    };
};

export type QueryConfig = {
    nodeId?: string;
    edgeId?: string;
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
    toNodeId?: string;
    fromNodeId?: string;
};

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
};

export type NodeType = {
    id: string;
    workflowId?: string;
    state?: WorkflowState;
    currentStep?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type EdgeType = {
    id: string;
    workflowId?: string;
    toNodeId?: string;
    fromNodeId?: string;
};

export type QueryResults = {
    data: {
        collection: {
            records: any[];
        };
    };
};

export type AgentData = {
    id?: string;
    name: string;
    role: string;
    parentNodeId?: string;
    status?: 'active' | 'inactive';
    skills?: string[];
    performance?: {
        calls?: number;
        satisfaction?: number;
    };
};

export enum AgentStatus {
    Initial = 'initial',
    Idle = 'idle',
    Activating = 'activating',
    Working = 'working',
    Error = 'error',
    Assistance = 'assistance',
    Complete = 'complete'
}

export type AgentState = {
    status: AgentStatus;
    isEditable: boolean;
    completedAt?: string;
    progress?: number;
    error?: string;
    assistanceMessage?: string;
};
