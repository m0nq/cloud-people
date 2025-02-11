import { type Edge } from '@xyflow/react';
import { type EdgeChange } from '@xyflow/react';
import { type Node } from '@xyflow/react';
import { type NodeChange } from '@xyflow/react';
import { type Connection } from '@xyflow/react';
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
    capability?: AgentCapability;
    config?: AgentConfig;
    onOpenModal?: (modalType: string) => void;
};

export type EdgeData = {
    workflowId?: string;
    type: string;
};

export type WorkflowExecution = {
    workflowId: string;
    sessionId: string;
    currentNodeId: string | null;
    state: WorkflowState;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
    needsAssistance?: boolean;
} | null;

// State types
export type GraphState = {
    nodes: (Node<NodeData> | Node<InitialStateNodeData>)[];
    edges: Edge[];
    workflowExecution: WorkflowExecution | null;
};

// Action types
export interface GraphActions {
    onNodesChange: (changes: NodeChange<Node>[]) => Promise<void>;
    onEdgesChange: (changes: EdgeChange<Edge>[]) => Promise<void>;
    onBeforeDelete: OnBeforeDelete;
    onNodesDelete?: OnNodesDelete;
    onConnect?: OnConnect;
    setNodes?: (nodes: (Node<NodeData> | Node<InitialStateNodeData>)[]) => void;
    setEdges?: (edges: Edge[]) => void;
    addNode?: (node: AgentData) => Promise<void>;
    addEdge?: (edge: Edge) => void;
    fetchGraph?: (workflowId: string) => void;
    createNewWorkflow?: () => Promise<string>;
    reset?: () => void;
    startWorkflow: () => Promise<void>;
    pauseWorkflow: () => void;
    resumeWorkflow: () => Promise<void>;
    progressWorkflow: (nodeId: string, status: AgentStatus) => Promise<void>;
    isCurrentNode: (nodeId: string) => boolean;
    findRootNode: (nodes: Node<NodeData | InitialStateNodeData>[]) => Node<NodeData> | undefined;
    findNextNode: (nodes: Node[], edges: Edge[], currentNodeId: string) => Node | undefined;
    getConnectedNodes: (node: Node) => Node[];
    validateConnection: (connection: Connection) => boolean;
}

// Combined store type
export type AppState = GraphState & GraphActions;

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
    nodeType?: 'root' | 'agent';
};

export enum WorkflowState {
    Initial = 'Initial',
    Running = 'Running',
    Paused = 'Paused',
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

export type AgentAction = {
    type: 'browser';
    action: 'open' | 'navigate_to_google';
    params?: Record<string, string>;
};

export type AgentConfig = {
    actions: AgentAction[];
    aiEnabled: boolean;
    metadata?: Record<string, unknown>;
};

export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    action: string;
    parameters?: Record<string, any>;
}

export interface AgentData {
    id: string;
    name: string;
    role: string;
    image?: string;
    config: AgentConfig;
    capability: AgentCapability;
    parentNodeId?: string;
}

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
