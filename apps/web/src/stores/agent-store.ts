import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { AgentRuntimeState } from '@app-types/agent';
import { AgentState } from '@app-types/agent';
import type { AgentData } from '@app-types/agent';
import { AgentResult } from '@app-types/agent';
import { AgentResultSchema } from '@app-types/agent';

type StateTransitionError = {
    message: string;
    currentState: AgentState;
    attemptedState: AgentState;
};

type AgentStoreState = {
    agentState: Record<string, AgentRuntimeState>;
    agentData: Record<string, AgentData>;
    errors: Record<string, StateTransitionError | null>;
    agentResults: Record<string, AgentResult | null>;
};

type AgentStoreActions = {
    removeAgent: (agentId: string) => void;
    transition: (agentId: string, newState: AgentState, updates?: Partial<Omit<AgentRuntimeState, 'state'>>) => void;
    updateAgentState: (agentId: string, updates: Partial<AgentRuntimeState>) => void;
    setAgentData: (agentId: string, data: AgentData) => void;
    resetAgent: (agentId: string) => void;
    resetErroredAgents: () => void;
    setAgentResult: (agentId: string, data: unknown) => void;
};

type AgentStoreSelectors = {
    getAgentState: (agentId: string | undefined) => AgentRuntimeState;
    getAgentData: (agentId: string | undefined) => AgentData | undefined;
    getAgentError: (agentId: string) => StateTransitionError | null;
    isTransitionAllowed: (agentId: string, newStatus: AgentState) => boolean;
    getAgentResult: (agentId: string) => AgentResult | null;
};

type AgentStore = AgentStoreState & AgentStoreActions & AgentStoreSelectors;

export const DEFAULT_AGENT_STATE: AgentRuntimeState = {
    state: AgentState.Initial,
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

export const useAgentStore = create<AgentStore>()(
    devtools((set, get) => ({
        // Initial state
        agentState: {},
        agentData: {},
        errors: {},
        agentResults: {},
        // Actions
        removeAgent: agentId => {
            set(state => {
                const { [agentId]: removedState, ...remainingAgentState } = state.agentState;
                const { [agentId]: removedData, ...remainingAgentData } = state.agentData;
                const { [agentId]: removedError, ...remainingErrors } = state.errors;
                const { [agentId]: removedResult, ...remainingResults } = state.agentResults;

                return {
                    ...state,
                    agentState: remainingAgentState,
                    agentData: remainingAgentData,
                    errors: remainingErrors,
                    agentResults: remainingResults
                };
            });
        },
        transition: (agentId, newState, updates = {}) => {
            const agentRuntime = get().getAgentState(agentId);

            if (!agentRuntime) {
                console.error(`Agent ${agentId} not found`);
                return;
            }

            const currentState = agentRuntime.state;

            // Check if transition is valid
            if (!isValidTransition(currentState, newState)) {
                console.error(`Invalid transition from ${currentState} to ${newState}`);
                set(state => ({
                    ...state,
                    errors: {
                        ...state.errors,
                        [agentId]: {
                            message: `Invalid transition from ${currentState} to ${newState}`,
                            currentState,
                            attemptedState: newState
                        }
                    }
                }));
                return;
            }

            // Clear any previous errors
            set(state => ({
                ...state,
                errors: {
                    ...state.errors,
                    [agentId]: null
                }
            }));

            // Apply state change
            set(state => {
                const currentAgentState = state.agentState[agentId] || { ...DEFAULT_AGENT_STATE };

                return {
                    ...state,
                    agentState: {
                        ...state.agentState,
                        [agentId]: {
                            ...currentAgentState,
                            ...updates,
                            state: newState,
                            isEditable: [AgentState.Initial, AgentState.Error, AgentState.Assistance].includes(newState),
                            ...(newState !== AgentState.Error && { error: undefined }),
                            ...(newState !== AgentState.Assistance && {
                                assistanceMessage: undefined
                            })
                        }
                    }
                };
            });
        },
        updateAgentState: (agentId, updates) => {
            set(state => {
                const currentAgentState = state.agentState[agentId] || { ...DEFAULT_AGENT_STATE };

                return {
                    ...state,
                    agentState: {
                        ...state.agentState,
                        [agentId]: {
                            ...currentAgentState,
                            ...updates
                        }
                    }
                };
            });
        },
        setAgentData: (agentId, data) => {
            set(state => ({
                ...state,
                agentData: {
                    ...state.agentData,
                    [agentId]: data
                }
            }));
        },
        resetAgent: agentId => {
            set(state => {
                const currentAgent = state.agentState[agentId];
                if (!currentAgent) return state;

                // First set to Initial state
                const initialState = {
                    ...state,
                    agentState: {
                        ...state.agentState,
                        [agentId]: {
                            ...currentAgent,
                            state: AgentState.Initial
                        }
                    }
                };

                // Then set to Idle state
                return {
                    ...initialState,
                    agentState: {
                        ...initialState.agentState,
                        [agentId]: {
                            ...initialState.agentState[agentId],
                            state: AgentState.Idle
                        }
                    }
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
        // Add method to set agent result with validation
        setAgentResult: (agentId, data) => {
            try {
                // Create a properly structured result
                const result: AgentResult = {
                    version: '1.0',
                    timestamp: new Date().toISOString(),
                    data
                };

                // Validate result
                const validationResult = AgentResultSchema.safeParse(result);
                if (!validationResult.success) {
                    console.error('Invalid agent result format:', validationResult.error);
                    return;
                }

                // Update state immutably
                set(state => {
                    const currentAgentState = state.agentState[agentId] || { ...DEFAULT_AGENT_STATE };

                    return {
                        ...state,
                        agentState: {
                            ...state.agentState,
                            [agentId]: {
                                ...currentAgentState,
                                result: validationResult.data
                            }
                        },
                        agentResults: {
                            ...state.agentResults,
                            [agentId]: validationResult.data
                        }
                    };
                });

                console.log(`[DEBUG] Stored result for agent ${agentId}:`, result);
            } catch (error) {
                console.error(`[ERROR] Failed to set agent result for ${agentId}:`, error);
            }
        },
        // Selectors
        getAgentState: agentId => {
            return (agentId && get().agentState[agentId]) || { ...DEFAULT_AGENT_STATE };
        },
        getAgentData: agentId => {
            return agentId ? get().agentData[agentId] : undefined;
        },
        getAgentError: agentId => get().errors[agentId] || null,
        isTransitionAllowed: (agentId, newState) => {
            const currentState = get().agentState[agentId];
            return currentState ? isValidTransition(currentState.state, newState) : false;
        },
        // Add method to get agent result
        getAgentResult: (agentId) => {
            // First try to get from the dedicated results store
            const result = get().agentResults?.[agentId];
            if (result) return result;

            // Fall back to the result in agent state for backward compatibility
            const agentState = get().agentState[agentId];
            return agentState?.result || null;
        }
    }),
        {
            name: 'Agent Store',
            enabled: process.env.NODE_ENV === 'development',
            maxAge: process.env.NODE_ENV === 'development' ? 50 : 0
        })
);
