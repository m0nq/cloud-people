import { type StoreApi } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { AgentResult } from '@app-types/agent';
import type { GraphState } from '@app-types/workflow';
import type { WorkflowContext as WorkflowContextType } from '@app-types/workflow';

/**
 * Workflow context for storing and sharing data between agents
 */
export interface WorkflowContext {
  version: string;
  data: {
    [agentId: string]: AgentResult;
  };
}

/**
 * Initial state for the workflow context
 */
export const initialWorkflowContext: WorkflowContextType = {
  version: '1.0',
  data: {}
};

/**
 * Creates the workflow context feature slice
 */
export const createWorkflowContext = (
  set: StoreApi<GraphState>['setState'],
  get: StoreApi<GraphState>['getState']
) => {
  return {
    // Add workflow context to store
    workflowContext: initialWorkflowContext,

    /**
     * Updates the workflow context with a new agent result
     * @param agentId - The ID of the agent that produced the result
     * @param result - The agent's result
     */
    updateWorkflowContext: (agentId: string, result: AgentResult) =>
      set((state) => {
        // Create a new state object to satisfy the return type requirement
        const newState = { ...state };
        // Update the workflow context data
        newState.workflowContext = {
          ...newState.workflowContext,
          data: {
            ...newState.workflowContext.data,
            [agentId]: result
          }
        };
        console.log(`[DEBUG] Updated workflow context with result from agent ${agentId}:`, result);
        return newState;
      }),

    /**
     * Gets the entire workflow context with memoization
     * @returns The workflow context
     */
    getWorkflowContext: () => {
      return useShallow((state: GraphState) => state.workflowContext);
    },

    /**
     * Gets a specific agent's data from the workflow context
     * @param agentId - The ID of the agent whose data to retrieve
     * @returns The agent's result or null if not found
     */
    getAgentContextData: (agentId: string): AgentResult | null => {
      const state = get();
      return state.workflowContext.data[agentId] || null;
    },

    /**
     * Clears the workflow context
     */
    clearWorkflowContext: () =>
      set((state) => {
        // Create a new state object to satisfy the return type requirement
        const newState = { ...state };
        // Reset the workflow context
        newState.workflowContext = {
          version: '1.0',
          data: {}
        };
        console.log('[DEBUG] Cleared workflow context');
        return newState;
      })
  };
};
