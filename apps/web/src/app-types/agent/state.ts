export enum AgentState {
    Initial = 'INITIAL',
    Idle = 'IDLE',
    Activating = 'ACTIVATING',
    Working = 'WORKING',
    Complete = 'COMPLETE',
    Error = 'ERROR',
    Assistance = 'ASSISTANCE',
    Paused = 'PAUSED'
}

import { AgentResult } from './result';

export type AgentRuntimeState = {
    state: AgentState;
    isEditable: boolean;
    isLoading?: boolean;
    completedAt?: string;
    progress?: number;
    error?: string;
    assistanceMessage?: string;
    metadata?: Record<string, any>; // Store pause-related info here
    result?: AgentResult | null;
};
