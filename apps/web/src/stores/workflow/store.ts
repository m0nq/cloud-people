import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { initialState } from './constants';
import { createGraphManipulation } from './features/graph-manipulation';
import { createWorkflowExecution } from './features/workflow-execution';
import { createWorkflowLifecycle } from './features/workflow-lifecycle';
import { createWorkflowContext } from './features/workflow-context';
import { findRootNode } from './utils/state-helpers';
import { findNextNode } from './utils/state-helpers';
import { getConnectedNodes } from './utils/state-helpers';
import { isCurrentNode } from './utils/state-helpers';
import type { WorkflowStore } from '@app-types/workflow';

export const useWorkflowStore = create<WorkflowStore>()(
    devtools((set, get) => ({
        // Initial state
        ...initialState,

        // Feature modules
        ...createGraphManipulation(set, get),
        ...createWorkflowExecution(set, get),
        ...createWorkflowLifecycle(set, get),
        ...createWorkflowContext(set, get),

        // Helper functions
        findRootNode,
        findNextNode,
        getConnectedNodes,
        isCurrentNode: (nodeId: string) => isCurrentNode(get, nodeId)
    }))
);
