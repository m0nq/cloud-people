import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { AgentRuntimeState } from '@app-types/agent';
import { AgentState } from '@app-types/agent';
import type { AgentData } from '@app-types/agent';
import type { AgentConfig } from '@app-types/agent';
import type { AgentResult } from '@app-types/agent';

type StateTransitionError = {
    message: string;
    currentState: AgentState;
    attemptedState: AgentState;
};

type AgentStoreState = {
    agentState: Record<string, AgentRuntimeState>;
    agentData: Record<string, AgentData>;
    agentResult: Record<string, AgentResult | null>;
    errors: Record<string, StateTransitionError | null>;
};

type AgentStoreActions = {
    initializeAgent: (agentId: string) => void;
    removeAgent: (agentId: string) => void;
    transition: (agentId: string, newState: AgentState, updates?: Partial<Omit<AgentRuntimeState, 'state'>>) => void;
    updateAgentState: (agentId: string, updates: Partial<AgentRuntimeState>) => void;
    setAgentData: (agentId: string, data: AgentData) => void;
    setAgentResult: (agentId: string, result: AgentResult | null) => void;
    resetAgent: (agentId: string) => void;
    resetErroredAgents: () => void;
};

type AgentStoreSelectors = {
    getAgentState: (agentId: string | undefined) => AgentRuntimeState;
    getAgentData: (agentId: string | undefined) => AgentData;
    getAgentResult: (agentId: string) => AgentResult | null | undefined;
    getAgentError: (agentId: string) => StateTransitionError | null;
    isTransitionAllowed: (agentId: string, newStatus: AgentState) => boolean;
};

type AgentStore = AgentStoreState & AgentStoreActions & AgentStoreSelectors;

export const DEFAULT_AGENT_STATE: AgentRuntimeState = {
    state: AgentState.Initial,
    isEditable: true,
    isLoading: true,
    progress: 0
};

const defaultAgentRuntimeState: AgentRuntimeState = {
    state: AgentState.Idle,
    isEditable: true,
    isLoading: true,
    progress: 0
};

const isValidTransition = (currentStatus: AgentState, newStatus: AgentState): boolean => {
    const transitions: Record<AgentState, AgentState[]> = {
        [AgentState.Initial]: [AgentState.Idle, AgentState.Activating],
        [AgentState.Idle]: [AgentState.Activating, AgentState.Initial, AgentState.Paused],
        [AgentState.Activating]: [AgentState.Working, AgentState.Initial, AgentState.Paused],
        [AgentState.Working]: [AgentState.Complete, AgentState.Error, AgentState.Assistance, AgentState.Initial, AgentState.Paused],
        [AgentState.Error]: [AgentState.Activating, AgentState.Initial, AgentState.Paused],
        [AgentState.Assistance]: [AgentState.Activating, AgentState.Initial, AgentState.Paused],
        [AgentState.Complete]: [AgentState.Initial, AgentState.Paused],
        [AgentState.Paused]: [AgentState.Activating, AgentState.Working, AgentState.Initial]
    };

    return transitions[currentStatus]?.includes(newStatus) ?? false;
};

const stateTransitionMap: Record<AgentState, AgentState[]> = {
    [AgentState.Initial]: [AgentState.Idle, AgentState.Activating],
    [AgentState.Idle]: [AgentState.Activating, AgentState.Initial, AgentState.Paused],
    [AgentState.Activating]: [AgentState.Working, AgentState.Initial, AgentState.Paused],
    [AgentState.Working]: [AgentState.Complete, AgentState.Error, AgentState.Assistance, AgentState.Initial, AgentState.Paused],
    [AgentState.Error]: [AgentState.Activating, AgentState.Initial, AgentState.Paused],
    [AgentState.Assistance]: [AgentState.Activating, AgentState.Initial, AgentState.Paused],
    [AgentState.Complete]: [AgentState.Initial, AgentState.Paused],
    [AgentState.Paused]: [AgentState.Activating, AgentState.Working, AgentState.Initial]
};

export const useAgentStore = create<AgentStore>()(
    devtools((set, get) => ({
            // Initial state
            agentState: {},
            agentData: {},
            agentResult: {},
            errors: {},
            // Actions
            initializeAgent: agentId => {
                set(state => {
                    // Avoid overwriting if already initialized (defensive check)
                    if (state.agentState[agentId]) {
                        console.warn(`Agent ${agentId} already initialized. Skipping.`);
                        return {}; // No change
                    }
                    console.log(`[AgentStore] Initializing agent ${agentId} state to IDLE.`);
                    return {
                        agentState: {
                            ...state.agentState,
                            // Use the complete default state object
                            [agentId]: { ...defaultAgentRuntimeState }
                        }
                    };
                }, false, 'initializeAgent'); // Action name for devtools
            },
            removeAgent: agentId => {
                set(({ agentState, agentData, agentResult, errors }) => {
                    const { [agentId]: removedState, ...remainingAgentState } = agentState;
                    const { [agentId]: removedData, ...remainingAgentData } = agentData;
                    const { [agentId]: removedResult, ...remainingAgentResult } = agentResult;
                    const { [agentId]: removedError, ...remainingErrors } = errors;
                    return {
                        agentState: remainingAgentState,
                        agentData: remainingAgentData,
                        agentResult: remainingAgentResult,
                        errors: remainingErrors
                    };
                });
            },
            transition: (agentId, newState, updates = {}) => {
                const agentRuntime = get().getAgentState(agentId);

                if (!agentRuntime) {
                    console.error(`Agent ${agentId} not found`);
                    return;
                }

                // Skip transition if states are the same
                if (agentRuntime.state === newState) {
                    return;
                }

                if (!isValidTransition(agentRuntime.state, newState)) {
                    set(state => ({
                        errors: {
                            ...state.errors,
                            [agentId]: {
                                message: `Invalid transition from ${agentRuntime.state} to ${newState}`,
                                currentState: agentRuntime.state,
                                attemptedState: newState
                            }
                        }
                    }));
                    return;
                }

                set(store => ({
                    agentState: {
                        ...store.agentState,
                        [agentId]: {
                            ...agentRuntime,
                            state: newState,
                            isEditable: [AgentState.Initial, AgentState.Error, AgentState.Assistance].includes(newState),
                            ...updates
                        }
                    },
                    errors: {
                        ...store.errors,
                        [agentId]: null
                    }
                }));
            },
            updateAgentState: (agentId, updates) => {
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
            setAgentData: (agentId, data) => {
                set(store => ({
                    agentData: {
                        ...store.agentData,
                        [agentId]: data
                    }
                }));
            },
            setAgentResult: (agentId, result) => {
                set(store => ({
                    agentResult: {
                        ...store.agentResult,
                        [agentId]: result
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
            getAgentState: agentId => {
                return (agentId && get().agentState[agentId]) || { ...DEFAULT_AGENT_STATE };
            },
            getAgentData: agentId => {
                return agentId ? get().agentData[agentId] : undefined;
            },
            getAgentResult: agentId => {
                return agentId ? get().agentResult[agentId] : undefined;
            },
            getAgentError: agentId => get().errors[agentId] || null,
            isTransitionAllowed: (agentId, newState) => {
                const currentState = get().agentState[agentId]?.state;

                // Explicitly handle undefined current state
                if (currentState === undefined) {
                    // Allow initialization to IDLE or potentially ACTIVATING if needed
                    return newState === AgentState.Idle || newState === AgentState.Activating;
                }

                // Original logic for defined states
                const allowedTransitions = stateTransitionMap[currentState];
                return allowedTransitions?.includes(newState) ?? false;
            },
            getAllAgentStates: () => get().agentState,
            getAllAgentData: () => get().agentData,
        }),
        {
            name: 'Agent Store',
            enabled: process.env.NODE_ENV === 'development',
            maxAge: process.env.NODE_ENV === 'development' ? 50 : 0
        }
    )
);