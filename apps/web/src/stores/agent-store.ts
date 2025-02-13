import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { AgentState } from '@app-types/agent';
import { AgentStatus } from '@app-types/agent';

type StateTransitionError = {
    message: string;
    currentState: AgentStatus;
    attemptedState: AgentStatus;
};

type AgentStoreState = {
    agentState: Record<string, AgentState>;
    errors: Record<string, StateTransitionError | null>;
};

type AgentStoreActions = {
    removeAgent: (agentId: string) => void;
    transition: (agentId: string, newStatus: AgentStatus, updates?: Partial<Omit<AgentState, 'status'>>) => void;
    updateAgent: (agentId: string, updates: Partial<AgentState>) => void;
    resetAgent: (agentId: string) => void;
    resetErroredAgents: () => void;
};

type AgentStoreSelectors = {
    getAgentState: (agentId: string) => AgentState | undefined;
    getAgentError: (agentId: string) => StateTransitionError | null;
    isTransitionAllowed: (agentId: string, newStatus: AgentStatus) => boolean;
};

type AgentStore = AgentStoreState & AgentStoreActions & AgentStoreSelectors;

const DEFAULT_AGENT_STATE: AgentState = {
    status: AgentStatus.Initial,
    isEditable: true,
    progress: 0
};

const isValidTransition = (currentStatus: AgentStatus, newStatus: AgentStatus): boolean => {
    const transitions: Record<AgentStatus, AgentStatus[]> = {
        [AgentStatus.Initial]: [AgentStatus.Idle],
        [AgentStatus.Idle]: [AgentStatus.Activating, AgentStatus.Initial],
        [AgentStatus.Activating]: [AgentStatus.Working],
        [AgentStatus.Working]: [AgentStatus.Complete, AgentStatus.Error, AgentStatus.Assistance, AgentStatus.Initial],
        [AgentStatus.Error]: [AgentStatus.Working, AgentStatus.Initial],
        [AgentStatus.Assistance]: [AgentStatus.Working, AgentStatus.Initial],
        [AgentStatus.Complete]: [AgentStatus.Initial]
    };

    return transitions[currentStatus]?.includes(newStatus) ?? false;
};

export const useAgentStore = create<AgentStore>()(
    devtools((set, get) => ({
            // Initial state
            agentState: { ...DEFAULT_AGENT_STATE },
            errors: {},
            // Actions
            removeAgent: agentId => {
                set(({ agentState, errors }) => {
                    const { [agentId]: removed, ...remainingAgentState } = agentState;
                    const { [agentId]: removedError, ...remainingErrors } = errors;
                    return {
                        agentState: remainingAgentState,
                        errors: remainingErrors
                    };
                });
            },
            transition: (agentId, newStatus, updates = {}) => {
                const currentState = get().agentState[agentId];

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
                    agentState: {
                        ...state.agentState,
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
                set(store => ({
                    agentState: {
                        ...store.agentState,
                        [agentId]: {
                            ...store.agentState[agentId],
                            ...updates
                        }
                    }
                }));
            },
            resetAgent: (agentId) => {
                const currentState = get().agentState[agentId];
                if (!currentState) return;

                // Reset to Initial, then to Idle
                get().transition(agentId, AgentStatus.Initial);
                get().transition(agentId, AgentStatus.Idle);
            },
            resetErroredAgents: () => {
                const { agentState } = get();
                Object.entries(agentState).forEach(([agentId, agent]) => {
                    if ([AgentStatus.Error, AgentStatus.Assistance].includes(agent.status)) {
                        get().resetAgent(agentId);
                    }
                });
            },
            // Selectors
            getAgentState: agentId => get().agentState[agentId],
            getAgentError: agentId => get().errors[agentId] || null,
            isTransitionAllowed: (agentId, newStatus) => {
                const currentState = get().agentState[agentId];
                return currentState ? isValidTransition(currentState.status, newStatus) : false;
            }
        }),
        {
            name: 'Agent Store',
            enabled: process.env.NODE_ENV === 'development',
            maxAge: process.env.NODE_ENV === 'development' ? 50 : 0
        }
    )
);
