import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { AgentState } from '@lib/definitions';
import { AgentStatus } from '@lib/definitions';

type StateTransitionError = {
    message: string;
    currentState: AgentStatus;
    attemptedState: AgentStatus;
};

type AgentStoreState = {
    agents: Record<string, AgentState>;
    errors: Record<string, StateTransitionError | null>;
};

type AgentStoreActions = {
    initializeAgent: (agentId: string, initialState?: Partial<AgentState>) => void;
    removeAgent: (agentId: string) => void;
    transition: (agentId: string, newStatus: AgentStatus, updates?: Partial<Omit<AgentState, 'status'>>) => void;
    updateAgent: (agentId: string, updates: Partial<AgentState>) => void;
};

type AgentStoreSelectors = {
    getAgentState: (agentId: string) => AgentState | undefined;
    getAgentError: (agentId: string) => StateTransitionError | null;
    isTransitionAllowed: (agentId: string, newStatus: AgentStatus) => boolean;
};

type AgentStore = AgentState & AgentStoreState & AgentStoreActions & AgentStoreSelectors;

const DEFAULT_AGENT_STATE: AgentState = {
    status: AgentStatus.Initial,
    isEditable: true,
    progress: 0
};

const isValidTransition = (currentStatus: AgentStatus, newStatus: AgentStatus): boolean => {
    const transitions: Record<AgentStatus, AgentStatus[]> = {
        [AgentStatus.Initial]: [AgentStatus.Idle],
        [AgentStatus.Idle]: [AgentStatus.Activating],
        [AgentStatus.Activating]: [AgentStatus.Working],
        [AgentStatus.Working]: [AgentStatus.Complete, AgentStatus.Error, AgentStatus.Assistance],
        [AgentStatus.Error]: [AgentStatus.Working],
        [AgentStatus.Assistance]: [AgentStatus.Working],
        [AgentStatus.Complete]: []
    };

    return transitions[currentStatus]?.includes(newStatus) ?? false;
};

export const useAgentStore = create<AgentStore>()(
    devtools((set, get) => ({
            // Initial state
            agents: {},
            errors: {},
            status: AgentStatus.Initial,
            isEditable: true,

            // Actions
            initializeAgent: (agentId, initialState = {}) => {
                set(state => ({
                    agents: {
                        ...state.agents,
                        [agentId]: {
                            ...DEFAULT_AGENT_STATE,
                            ...initialState
                        }
                    }
                }));
            },

            removeAgent: agentId => {
                set(state => {
                    const { [agentId]: removed, ...remainingAgents } = state.agents;
                    const { [agentId]: removedError, ...remainingErrors } = state.errors;
                    return {
                        agents: remainingAgents,
                        errors: remainingErrors
                    };
                });
            },

            transition: (agentId, newStatus, updates = {}) => {
                const currentState = get().agents[agentId];

                if (!currentState) {
                    console.error(`Agent ${agentId} not found`);
                    return;
                }

                if (!isValidTransition(currentState.status, newStatus)) {
                    set(state => ({
                        errors: {
                            ...state.errors,
                            [agentId]: {
                                message: `Invalid transition from ${currentState.status} to ${newStatus}`,
                                currentState: currentState.status,
                                attemptedState: newStatus
                            }
                        }
                    }));
                    return;
                }

                set(state => ({
                    agents: {
                        ...state.agents,
                        [agentId]: {
                            ...currentState,
                            status: newStatus,
                            isEditable: [AgentStatus.Initial, AgentStatus.Error, AgentStatus.Assistance].includes(newStatus),
                            ...(newStatus !== AgentStatus.Error && { error: undefined }),
                            ...(newStatus !== AgentStatus.Assistance && {
                                assistanceMessage: undefined
                            }),
                            ...updates
                        }
                    },
                    errors: {
                        ...state.errors,
                        [agentId]: null
                    }
                }));
            },

            updateAgent: (agentId, updates) => {
                set(state => ({
                    agents: {
                        ...state.agents,
                        [agentId]: {
                            ...state.agents[agentId],
                            ...updates
                        }
                    }
                }));
            },

            // Selectors
            getAgentState: agentId => get().agents[agentId],

            getAgentError: agentId => get().errors[agentId] || null,

            isTransitionAllowed: (agentId, newStatus) => {
                const currentState = get().agents[agentId];
                if (!currentState) return false;
                return isValidTransition(currentState.status, newStatus);
            }
        }),
        {
            name: 'Agent Store',
            enabled: process.env.NODE_ENV === 'development',
            maxAge: process.env.NODE_ENV === 'development' ? 50 : 0
        }
    )
);
