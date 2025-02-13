import { type Connection } from '@xyflow/react';
import { OnBeforeDelete } from '@xyflow/react';
import { OnConnect } from '@xyflow/react';
import { OnEdgesChange } from '@xyflow/react';
import { OnNodesChange } from '@xyflow/react';
import { type Edge } from '@xyflow/react';
import { type Node } from '@xyflow/react';

import { type AgentData } from '@app-types/agent';
import { type AgentStatus } from '@app-types/agent';
import { type EdgeData } from '@app-types/workflow';
import { type InitialStateNodeData } from '@app-types/workflow';
import { type NodeData } from '@app-types/workflow';
import { type WorkflowExecution } from '@app-types/workflow';

export interface GraphState {
    nodes: Node<NodeData | InitialStateNodeData>[];
    edges: Edge<EdgeData>[];
    workflowId?: string;
    workflowExecution: WorkflowExecution | null;
}

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

    // Workflow execution
    startWorkflow: () => Promise<void>;
    pauseWorkflow: () => Promise<void>;
    resumeWorkflow: () => Promise<void>;
    progressWorkflow: (nodeId: string, status: AgentStatus) => Promise<void>;

    // Node helpers
    findRootNode: (nodes: Node<NodeData | InitialStateNodeData>[]) => Node<NodeData> | undefined;
    findNextNode: (nodes: Node[], edges: Edge[], currentNodeId: string) => Node | undefined;
    getConnectedNodes: (node: Node) => Node[];
    isCurrentNode: (nodeId: string) => boolean;
}

export type WorkflowStore = GraphState & WorkflowActions;
