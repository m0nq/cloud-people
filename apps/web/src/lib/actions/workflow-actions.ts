'use server';
import { type QueryConfig } from '@app-types/api';
import { type WorkflowType } from '@app-types/workflow';
import { authCheck } from './authentication-actions';
import { connectToDB } from '@lib/utils';
import { workflowService } from '@lib/service-providers/workflow-service';

export const createWorkflow = async (): Promise<string> => {
    return workflowService.createWorkflow();
};

export const fetchWorkflows = async (config: QueryConfig = {}): Promise<WorkflowType[]> => {
    return workflowService.fetchWorkflows(config);
};

export const updateWorkflow = async (config: QueryConfig = {}): Promise<WorkflowType> => {
    return workflowService.updateWorkflow(config);
};

export const deleteWorkflow = async (config: QueryConfig) => {
    return workflowService.deleteWorkflow(config);
};
