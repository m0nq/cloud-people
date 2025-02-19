import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { type WorkflowStore } from './types';
import { initialState } from './constants';
import { createGraphManipulation } from './features/graph-manipulation';
import { createWorkflowExecution } from './features/workflow-execution';
import { createWorkflowLifecycle } from './features/workflow-lifecycle';
import { findRootNode } from './utils/state-helpers';
import { findNextNode } from './utils/state-helpers';
import { getConnectedNodes } from './utils/state-helpers';
import { isCurrentNode } from './utils/state-helpers';

export const useWorkflowStore = create<WorkflowStore>()(
    devtools((set, get) => ({
        // Initial state
        ...initialState,

        // Feature modules
        ...createGraphManipulation(set, get),
        ...createWorkflowExecution(set, get),
        ...createWorkflowLifecycle(set, get),

        // Helper functions
        findRootNode,
        findNextNode,
        getConnectedNodes,
        isCurrentNode: (nodeId: string) => isCurrentNode(get, nodeId)
    }))
);
