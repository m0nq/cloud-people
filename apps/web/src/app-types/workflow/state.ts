import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';

import { type NodeData } from './nodes';
import { type InitialStateNodeData } from './nodes';
import { type EdgeData } from './edges';

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
    currentNodeId?: string;
    startedAt: Date;
    completedAt?: string;
    errors?: any;
    metrics?: any;
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
