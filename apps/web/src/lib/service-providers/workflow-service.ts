/**
 * Workflow Service Provider
 *
 * This module provides real and mock implementations for workflow operations.
 */


import { createClient } from '@lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js'; // Moved Supabase types together

import { createServiceProvider } from '.';
import type { ProviderMode } from '.';
import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';
import { getEnvConfig } from '@lib/env'; // Re-added missing import
import type { QueryConfig } from '@app-types/api';
import type { WorkflowType } from '@app-types/workflow'; // Changed back to WorkflowType
import { WorkflowState } from '@app-types/workflow';

// Get service mode from environment
const getServiceMode = () => {
    const env = getEnvConfig();
    // Check for explicit service mode override
    if (env.NEXT_PUBLIC_SERVICE_MODE === 'mock' || env.NEXT_PUBLIC_SERVICE_MODE === 'real') {
        return env.NEXT_PUBLIC_SERVICE_MODE;
    }
    // Default to mock in development, real in production
    return process.env.NODE_ENV === 'development' ? 'mock' : 'real';
};

// Define the interface for our workflow service
export interface WorkflowService {
    createWorkflow(): Promise<string>;

    fetchWorkflows(config?: QueryConfig): Promise<WorkflowType[]>;

    updateWorkflow(config: QueryConfig): Promise<WorkflowType>;

    deleteWorkflow(config: QueryConfig): Promise<string>;
}

/**
 * Real workflow service implementation that connects to the database
 */
class RealWorkflowService implements WorkflowService {
    private supabase: SupabaseClient;
    private _mode: ProviderMode = 'real'; // Added mode tracking

    constructor() {
        // createClient internally handles Supabase URL and Key from env vars
        this.supabase = createClient();
    }

    async createWorkflow(): Promise<string> {
        console.log("[RealWorkflowService] createWorkflow called"); // Verify execution
        const user = await authCheck();
        console.log("[RealWorkflowService] Authenticated user ID:", user.id); // Log the user ID

        const createWorkflowMutation = `
        mutation CreateWorkflowMutation($userId: UUID!, $data: JSON!) {
            collection: insertIntoWorkflowsCollection(objects: [
                {
                    data: $data,
                    user_id: $userId
                }
            ]) {
                records {
                    id
                    user_id
                    data
                    current_step
                }
            }
        }
    `;

        const variables = {
            data: JSON.stringify({ label: 'New Workflow' }),
            userId: user.id
        } as QueryConfig;

        const [workflow] = await connectToDB(createWorkflowMutation, variables);

        if (!workflow?.id) {
            console.error('No workflow ID returned from mutation');
            throw new Error('Failed to create workflow');
        }

        return workflow.id;
    }

    async fetchWorkflows(config: QueryConfig = {}): Promise<WorkflowType[]> {
        await authCheck();

        const findWorkflowsQuery = `
        query WorkflowQuery(
            $first: Int,
            $last: Int,
            $offset: Int,
            $before: Cursor,
            $after: Cursor,
            $filter: WorkflowsFilter,
            $orderBy: [WorkflowsOrderBy!]
        ) {
            collection: workflowsCollection(
                first: $first
                last: $last
                offset: $offset
                before: $before
                after: $after
                filter: $filter
                orderBy: $orderBy
            ) {
                records: edges {
                    node {
                        id
                        state
                        current_step
                        data
                    }
                }
            }
        }
    `;

        const variables = {
            ...config,
            filter: {
                ...config.filter,
                workflow_id: { eq: config.workflowId },
                user_id: { eq: config.userId }
            }
        } as QueryConfig;

        const workflows = await connectToDB(findWorkflowsQuery, variables);
        return workflows.map((workflow: any) => ({
            id: workflow.id,
            userId: workflow.user_id, // Assuming user_id exists if needed, adjust based on schema
            data: workflow.data,
            state: workflow.state as WorkflowState,
            currentStep: workflow.current_step
        })) as WorkflowType[]; // Ensure mapping matches WorkflowType
    }

    async updateWorkflow(config: QueryConfig = {}): Promise<WorkflowType> {
        const user = await authCheck();

        // Ensure we have a workflowId
        if (!config.workflowId) {
            throw new Error('No workflow ID provided for update');
        }

        const updateWorkflowsMutation = `
        mutation UpdateWorkflowMutation(
            $workflowId: UUID!,
            $userId: UUID!,
            $set: WorkflowsUpdateInput!
        ) {
            collection: updateWorkflowsCollection(
                set: $set,
                filter: { 
                    id: { eq: $workflowId },
                    user_id: { eq: $userId }
                }
            ) {
                records {
                    id
                    state
                    current_step
                    data
                    user_id
                    updated_at
                }
            }
        }
    `;

        const variables = {
            workflowId: config.workflowId,
            userId: user.id,
            set: {
                state: config.set?.state,
                current_step: config.set?.current_step,
                data: config.set?.data,
                updated_at: config.set?.updated_at ?? new Date().toISOString()
            }
        };

        const [workflow] = await connectToDB(updateWorkflowsMutation, variables);

        if (!workflow) {
            console.error('Update workflow mutation did not return expected data');
            throw new Error('Failed to update workflow');
        }

        // Map the raw result to WorkflowType
        return {
            id: workflow.id,
            userId: workflow.user_id, // Adjust as needed
            data: workflow.data,
            state: workflow.state as WorkflowState,
            currentStep: workflow.current_step
        } as WorkflowType;

    }

    async deleteWorkflow(config: QueryConfig): Promise<string> {
        const user = await authCheck();

        const deleteWorkflowMutation = `
        mutation DeleteWorkflowMutation(
            $filter: WorkflowsFilter,
            $atMost: Int!
         ) {
            collection: deleteFromWorkflowsCollection(filter: $filter, atMost: $atMost) {
                records {
                    id
                }
            }
        }
    `;

        const variables = {
            ...config,
            filter: {
                ...config.filter,
                workflow_id: { eq: config.workflowId },
                user_id: { eq: user.id }
            }
        } as QueryConfig;

        const [workflow] = await connectToDB(deleteWorkflowMutation, variables);

        return workflow.id as string;
    }
}

/**
 * Mock workflow service implementation that simulates database operations
 */
class MockWorkflowService implements WorkflowService {
    // Mock workflows data
    private mockWorkflows: WorkflowType[] = [];
    private nextId = 1;
    private _mode: ProviderMode = 'mock'; // Added mode tracking

    constructor() {
        console.log('[MockWorkflowService] Initialized');
    }

    async createWorkflow(): Promise<string> {
        // Simulate API delay
        await this.delay(300);

        const workflowId = `mock-workflow-${this.nextId++}`;

        this.mockWorkflows.push({
            id: workflowId,
            userId: '00000000-0000-0000-0000-000000000000',
            data: JSON.stringify({ label: 'New Workflow' }),
            state: WorkflowState.Initial,
            currentStep: '0'
        });

        console.log(`[MockWorkflowService] Created workflow with ID: ${workflowId}`);
        return workflowId;
    }

    async fetchWorkflows(config: QueryConfig = {}): Promise<WorkflowType[]> {
        // Simulate API delay
        await this.delay(200);

        let filteredWorkflows = [...this.mockWorkflows];

        // Apply filters if provided
        if (config.workflowId) {
            filteredWorkflows = filteredWorkflows.filter(w => w.id === config.workflowId);
        }

        if (config.userId) {
            filteredWorkflows = filteredWorkflows.filter(w => w.userId === config.userId);
        }

        console.log(`[MockWorkflowService] Fetched ${filteredWorkflows.length} workflows`);
        return filteredWorkflows;
    }

    async updateWorkflow(config: QueryConfig = {}): Promise<WorkflowType> {
        // Simulate API delay
        await this.delay(200);

        if (!config.workflowId) {
            throw new Error('No workflow ID provided for update');
        }

        const workflowIndex = this.mockWorkflows.findIndex(w => w.id === config.workflowId);

        if (workflowIndex === -1) {
            throw new Error('No workflow found with the provided ID');
        }

        // Update the workflow
        const updatedWorkflow = {
            ...this.mockWorkflows[workflowIndex],
            state: config.set?.state as WorkflowState || this.mockWorkflows[workflowIndex].state,
            currentStep: config.set?.current_step || this.mockWorkflows[workflowIndex].currentStep,
            data: config.set?.data as string || this.mockWorkflows[workflowIndex].data
        };

        this.mockWorkflows[workflowIndex] = updatedWorkflow;

        console.log(`[MockWorkflowService] Updated workflow: ${config.workflowId}`);
        return updatedWorkflow;
    }

    async deleteWorkflow(config: QueryConfig): Promise<string> {
        // Simulate API delay
        await this.delay(200);

        if (!config.workflowId) {
            throw new Error('No workflow ID provided for deletion');
        }

        const workflowIndex = this.mockWorkflows.findIndex(w => w.id === config.workflowId);

        if (workflowIndex === -1) {
            throw new Error('No workflow found with the provided ID');
        }

        const workflowId = this.mockWorkflows[workflowIndex].id;
        this.mockWorkflows.splice(workflowIndex, 1);

        console.log(`[MockWorkflowService] Deleted workflow: ${workflowId}`);
        return workflowId;
    }

    // Helper to simulate API delays
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create and export the workflow service with automatic mode switching
export const workflowService = createServiceProvider<WorkflowService>(
    new RealWorkflowService(),
    new MockWorkflowService(),
    {
        // Default to real in production, mock in development
        defaultMode: process.env.NODE_ENV === 'production' ? 'real' : 'mock'
    }
);

// Export a hook for accessing the workflow service
export function useWorkflowService() {
    return workflowService;
}
