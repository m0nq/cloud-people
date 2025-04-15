'use server';
import { type QueryConfig } from '@app-types/api';
import { type WorkflowType } from '@app-types/workflow';
import { authCheck } from './authentication-actions';
import { createWorkflow as createWorkflowService } from '@lib/service-providers/workflow-service';
import { fetchWorkflows as fetchWorkflowsService } from '@lib/service-providers/workflow-service';
import { updateWorkflow as updateWorkflowService } from '@lib/service-providers/workflow-service';
import { deleteWorkflow as deleteWorkflowService } from '@lib/service-providers/workflow-service';

export const createWorkflow = async (): Promise<string> => {
    return createWorkflowService();
};

export const fetchWorkflows = async (config: QueryConfig = {}): Promise<WorkflowType[]> => {
    // Call the renamed service function
    return fetchWorkflowsService(config);
};

export const updateWorkflow = async (config: QueryConfig = {}): Promise<WorkflowType | null> => {
    // Extract id and data from config and pass to the service function
    // Assuming config.id and config.data exist and have the correct types
    // Add error handling/validation if necessary
    const workflowId = config.id;
    const updates = config.data as Partial<WorkflowType> || {}; // Assuming data is present or default to {}
    if (!workflowId) {
        throw new Error('Workflow ID is required for updateWorkflow action.');
    }
    return updateWorkflowService(workflowId, updates);
};

// Update return type to match the service function
export const deleteWorkflow = async (config: QueryConfig): Promise<{ id: string }> => {
    // Extract id from config and pass to the service function
    // Assuming config.id exists and is a string
    const workflowId = config.id as string;
    if (!workflowId) {
        throw new Error('Workflow ID is required for deleteWorkflow action.');
    }
    return deleteWorkflowService(workflowId);
};
