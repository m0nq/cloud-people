import { AgentConfig } from '@app-types/agent';
import { AgentState } from '@app-types/agent';
import { NodeType } from './node-types';

export interface NodeData extends Record<string, unknown> {
    id: string;
    type: NodeType;
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
    type: NodeType.Initial;
    background: string;
    color: string;
    iconBackground?: string;
    iconColor?: string;
    description?: string;
}

export interface DatePickerNodeData extends NodeData {
    type: NodeType.DatePicker;
    selectedDate?: Date;
}

export interface StickyNoteNodeData extends NodeData {
    type: NodeType.StickyNote;
    label: string;
    content: string;
}
