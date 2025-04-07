import { Connection } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { OnBeforeDelete } from '@xyflow/react';
import type { OnConnect } from '@xyflow/react';
import type { OnEdgesChange } from '@xyflow/react';
import type { OnNodesChange } from '@xyflow/react';
import { type Edge } from '@xyflow/react';

import { type NodeData } from './nodes';
import { type InitialStateNodeData } from './nodes';
import { type EdgeData } from './edges';
import type { AgentData } from '@app-types/agent';
import type { AgentState } from '@app-types/agent';
import type { AgentResult } from '@app-types/agent';

export enum WorkflowState {
    Initial = 'INITIAL',
    Running = 'RUNNING',
    Paused = 'PAUSED',
    Completed = 'COMPLETED'
}

export type WorkflowExecution = {
    id: string;
    workflowId: string;
    state: WorkflowState;
    currentNodeId: string;
    startedAt: Date;
    completedAt?: string;
    errors?: any;
    metrics?: any;
};

// Define workflow context interface for storing agent outputs
export interface WorkflowContext {
    version: string;
    data: {
        [agentId: string]: AgentResult;
    };
}

export type GraphState = {
    nodes: (Node<NodeData> | Node<InitialStateNodeData>)[];
    edges: Edge<EdgeData>[];
    workflowExecution: WorkflowExecution | null;
    // Add workflow context to store agent outputs
    workflowContext: WorkflowContext;
};

export interface WorkflowActions {
    // Graph manipulation
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onBeforeDelete: OnBeforeDelete;
    addNode: (agent: AgentData) => Promise<void>;
    onNodesDelete: (deletedNodes: Node[]) => Promise<void>;
    validateConnection: (connection: Connection) => boolean;

    // Workflow lifecycle
    createNewWorkflow: () => Promise<void>;
    fetchGraph: (workflowId: string) => Promise<void>;
    reset: () => void;
    addAgentToWorkflow: (agent: AgentData) => Promise<void>;

    // Workflow execution
    startWorkflow: () => Promise<void>;
    pauseWorkflow: () => Promise<void>;
    resumeWorkflow: () => Promise<void>;
    progressWorkflow: (nodeId: string, status: AgentState) => Promise<void>;

    // Node helpers
    findRootNode: (nodes: Node<NodeData | InitialStateNodeData>[]) => Node<NodeData> | undefined;
    findNextNode: (nodes: Node[], edges: Edge[], currentNodeId: string) => Node | undefined;
    getConnectedNodes: (node: Node) => Node[];
    isCurrentNode: (nodeId: string) => boolean;

    // Workflow context methods
    updateWorkflowContext: (agentId: string, result: AgentResult) => void;
    getAgentContextData: (agentId: string) => AgentResult | null;
    clearWorkflowContext: () => void;
};

export type WorkflowStore = GraphState & WorkflowActions;

export type WorkflowType = {
    id: string;
    userId?: string;
    state?: WorkflowState;
    currentStep?: string;
    data?: string;
};
