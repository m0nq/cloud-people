import { WorkflowState } from '@app-types/workflow/state';
import { AgentCapability } from '@app-types/agent';
import { AgentConfig } from '@app-types/agent';
import { AgentState } from '@app-types/agent';
import { NodeType } from './node-types';

export type NodeData = {
    id: string;
    type: NodeType;
    workflowId?: string;
    agentRef?: {
        agentId: string;
        config?: AgentConfig;
    };
    capabilities?: AgentCapability[];
    config?: AgentConfig;
    state?: AgentState;
    onOpenModal?: (modalType: string) => void;
};

export type InitialStateNodeData = NodeData & {
    id: string;
    label: string;
    type: NodeType.Initial;
    background: string;
    color: string;
};
