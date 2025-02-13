import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';

import { type NodeData } from './nodes';
import { type InitialStateNodeData } from './nodes';
import { type EdgeData } from './edges';

export enum WorkflowState {
    Initial = 'initial',
    Running = 'running',
    Paused = 'paused',
    Completed = 'completed',
    Failed = 'failed'
}

export type WorkflowExecution = {
    workflowId?: string;
    sessionId?: string;
    state: WorkflowState;
    currentNodeId?: string;
    // agentStates: Record<string, AgentState>;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    needsAssistance?: boolean;
};

export type GraphState = {
    nodes: (Node<NodeData> | Node<InitialStateNodeData>)[];
    edges: Edge<EdgeData>[];
    workflowExecution: WorkflowExecution | null;
};

export type WorkflowType = {
    id: string;
    userId?: string;
    state?: WorkflowState;
    currentStep?: string;
    data?: string;
};
