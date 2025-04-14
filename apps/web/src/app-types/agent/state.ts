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
    metadata?: Record<string, any>; // Store pause-related info here
    result?: AgentResult | null;
    activeTaskId?: string | null; // Add field to store task ID during pause/resume
    isResuming?: boolean; // Add field to indicate if the agent is resuming from pause
};
