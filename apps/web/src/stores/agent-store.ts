import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Agent } from '@app-types/agent';
import { AgentState } from '@app-types/agent';

type StateTransitionError = {
    message: string;
    currentState: AgentState;
    attemptedState: AgentState;
};

type AgentStoreState = {
    agentState: Record<string, Agent>;
    errors: Record<string, StateTransitionError | null>;
};

type AgentStoreActions = {
    removeAgent: (agentId: string) => void;
    transition: (agentId: string, newState: AgentState, updates?: Partial<Omit<Agent, 'state'>>) => void;
    updateAgent: (agentId: string, updates: Partial<Agent>) => void;
    resetAgent: (agentId: string) => void;
    resetErroredAgents: () => void;
};

type AgentStoreSelectors = {
    getAgent: (agentId: string) => Agent | undefined;
    getAgentError: (agentId: string) => StateTransitionError | null;
    isTransitionAllowed: (agentId: string, newStatus: AgentState) => boolean;
};

type AgentStore = AgentStoreState & AgentStoreActions & AgentStoreSelectors;

export const DEFAULT_AGENT_STATE: Agent = {
    state: AgentState.Initial,
    isEditable: true,
    progress: 0
};

const isValidTransition = (currentStatus: AgentState, newStatus: AgentState): boolean => {
    const transitions: Record<AgentState, AgentState[]> = {
        [AgentState.Initial]: [AgentState.Idle, AgentState.Activating],
        [AgentState.Idle]: [AgentState.Activating, AgentState.Initial],
        [AgentState.Activating]: [AgentState.Working, AgentState.Initial],
        [AgentState.Working]: [AgentState.Complete, AgentState.Error, AgentState.Assistance, AgentState.Initial],
        [AgentState.Error]: [AgentState.Activating, AgentState.Initial],
        [AgentState.Assistance]: [AgentState.Activating, AgentState.Initial],
        [AgentState.Complete]: [AgentState.Initial]
    };

    return transitions[currentStatus]?.includes(newStatus) ?? false;
};

export const useAgentStore = create<AgentStore>()(
    devtools(
        (set, get) => ({
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
            transition: (agentId, newState, updates = {}) => {
                const currentAgent = get().getAgent(agentId);

                if (!currentAgent) {
                    console.error(`Agent ${agentId} not found`);
                    return;
                }

                if (!isValidTransition(currentAgent.state, newState)) {
                    set(state => ({
                        errors: {
                            ...state.errors,
                            [agentId]: {
                                message: `Invalid transition from ${currentAgent.state} to ${newState}`,
                                currentState: currentAgent.state,
                                attemptedState: newState
                            }
                        }
                    }));
                    return;
                }

                set(state => ({
                    agentState: {
                        ...state.agentState,
                        [agentId]: {
                            ...currentAgent,
                            state: newState,
                            isEditable: [AgentState.Initial, AgentState.Error, AgentState.Assistance].includes(newState),
                            ...(newState !== AgentState.Error && { error: undefined }),
                            ...(newState !== AgentState.Assistance && {
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
            resetAgent: agentId => {
                set(state => {
                    const currentAgent = state.agentState[agentId];
                    if (!currentAgent) return state;

                    // Reset to Initial, then to Idle
                    const newState = {
                        ...state.agentState,
                        [agentId]: {
                            ...currentAgent,
                            state: AgentState.Initial
                        }
                    };

                    const newState2 = {
                        ...newState,
                        [agentId]: {
                            ...newState[agentId],
                            state: AgentState.Idle
                        }
                    };

                    return {
                        ...state,
                        agentState: newState2
                    };
                });
            },
            resetErroredAgents: () => {
                const { agentState } = get();
                Object.entries(agentState).forEach(([agentId, agent]) => {
                    if ([AgentState.Error, AgentState.Assistance].includes(agent.state)) {
                        get().resetAgent(agentId);
                    }
                });
            },
            // Selectors
            getAgent: agentId => get().agentState[agentId],
            getAgentError: agentId => get().errors[agentId] || null,
            isTransitionAllowed: (agentId, newState) => {
                const currentState = get().agentState[agentId];
                return currentState ? isValidTransition(currentState.state, newState) : false;
            }
        }),
        {
            name: 'Agent Store',
            enabled: process.env.NODE_ENV === 'development',
            maxAge: process.env.NODE_ENV === 'development' ? 50 : 0
        }
    )
);
