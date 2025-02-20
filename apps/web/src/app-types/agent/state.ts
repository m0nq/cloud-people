export enum AgentState {
    Initial = 'INITIAL',
    Idle = 'IDLE',
    Activating = 'ACTIVATING',
    Working = 'WORKING',
    Complete = 'COMPLETE',
    Error = 'ERROR',
    Assistance = 'ASSISTANCE'
}

export type AgentRuntimeState = {
    state: AgentState;
    isEditable: boolean;
    isLoading?: boolean;
    completedAt?: string;
    progress?: number;
    error?: string;
    assistanceMessage?: string;
};
