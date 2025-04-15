import { AgentConfig } from '@app-types/agent';
import { AgentState } from '@app-types/agent';
import { NodeType } from './node-types';

export interface NodeData extends Record<string, unknown> {
    workflowId?: string;
    agentRef?: {
        agentId: string;
        config?: AgentConfig;
    };
    state?: AgentState;
    onOpenModal?: (modalType: string) => void;
    label?: string;
    selectedDate?: Date;
}

export interface InitialStateNodeData extends NodeData {
    background: string;
    color: string;
    iconBackground?: string;
    iconColor?: string;
    description?: string;
}

export interface DatePickerNodeData extends NodeData {
    selectedDate?: Date;
}

export interface StickyNoteNodeData extends NodeData {
    label: string;
    content: string;
}
