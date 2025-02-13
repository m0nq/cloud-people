export enum AgentStatus {
    Initial = 'initial',
    Idle = 'idle',
    Activating = 'activating',
    Working = 'working',
    Complete = 'complete',
    Error = 'error',
    Assistance = 'assistance'
}

export type AgentState = {
    status: AgentStatus;
    isEditable: boolean;
    isLoading?: boolean;
    completedAt?: string;
    progress?: number;
    error?: string;
    assistanceMessage?: string;
};
