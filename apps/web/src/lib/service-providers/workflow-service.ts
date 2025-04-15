'use server';

import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';
import type { QueryConfig } from '@app-types/api';
import type { WorkflowType } from '@app-types/workflow';
// Removed unused client imports: createClient, SupabaseClient
// Removed unused service provider import: createServiceProvider

// --- Standalone createWorkflow Function ---
export const createWorkflow = async (): Promise<string> => {
    console.log("[Server Action] createWorkflow called"); // Verify execution
    const user = await authCheck();
    console.log("[Server Action] Authenticated user ID:", user.id); // Log the user ID

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
        data: JSON.stringify({ label: 'New Workflow' }), // Default label
        userId: user.id
    };

    try {
      const result = await connectToDB(createWorkflowMutation, variables);

      // Adjust parsing based on observed log output (result seems to be the records array directly)
      const workflow = Array.isArray(result) ? result[0] : undefined;
      // Check if workflow exists and has an id
      if (!workflow?.id) {
          console.error('No workflow ID returned from mutation or result structure unexpected. Result:', JSON.stringify(result));
          throw new Error('Failed to create workflow or retrieve ID.');
      }

      console.log('Successfully created workflow:', workflow.id);
      return workflow.id;

    } catch (error) {
        console.error('Failed to create workflow:', error);
        console.error('Variables causing create failure:', JSON.stringify(variables, null, 2));
        throw error; // Re-throw
    }
};

// --- Standalone fetchWorkflows Function ---
export const fetchWorkflows = async (config: QueryConfig = {}): Promise<WorkflowType[]> => {
    await authCheck();

    const fetchWorkflowsQuery = `
      query FetchWorkflowsQuery($userId: UUID!) {
          workflowsCollection(filter: { user_id: { eq: $userId } }) {
              edges {
                  node {
                      id
                      user_id
                      data
                      current_step
                      created_at
                      updated_at
                  }
              }
          }
      }
    `;
    // Note: Assuming authCheck provides user context for connectToDB
    // If not, you might need to pass user.id explicitly if connectToDB requires it
    const variables = { userId: config.userId }; // Ensure userId is passed in config if needed

    try {
        const result = await connectToDB(fetchWorkflowsQuery, variables);
        const workflows = result?.workflowsCollection?.edges.map((edge: any) => edge.node) || [];
        console.log(`Fetched ${workflows.length} workflows.`);
        return workflows as WorkflowType[];
    } catch (error) {
        console.error('Failed to fetch workflows:', error);
        throw error;
    }
};

// --- Standalone fetchWorkflowById Function ---
export const fetchWorkflowById = async (workflowId: string): Promise<WorkflowType | null> => {
    await authCheck();

    const fetchWorkflowByIdQuery = `
      query FetchWorkflowByIdQuery($workflowId: UUID!) {
          workflowsCollection(filter: { id: { eq: $workflowId } }, first: 1) {
              edges {
                  node {
                      id
                      user_id
                      data
                      current_step
                      created_at
                      updated_at
                  }
              }
          }
      }
    `;
    const variables = { workflowId };

    try {
        const result = await connectToDB(fetchWorkflowByIdQuery, variables);
        const workflow = result?.workflowsCollection?.edges?.[0]?.node;
        if (workflow) {
            console.log('Fetched workflow by ID:', workflow.id);
            return workflow as WorkflowType;
        } else {
            console.log('Workflow not found for ID:', workflowId);
            return null;
        }
    } catch (error) {
        console.error(`Failed to fetch workflow by ID ${workflowId}:`, error);
        throw error;
    }
};

// --- Standalone updateWorkflow Function ---
export const updateWorkflow = async (workflowId: string, updates: Partial<WorkflowType>): Promise<WorkflowType> => {
    await authCheck();

    const updateWorkflowMutation = `
      mutation UpdateWorkflowMutation($workflowId: UUID!, $set: WorkflowsUpdateInput!) {
          updateWorkflowsCollection(filter: { id: { eq: $workflowId } }, set: $set) {
              records {
                  id
                  user_id
                  data
                  current_step
                  created_at
                  updated_at
              }
          }
      }
    `;
    // Prepare the 'set' object, ensuring data is stringified if updated
    const setPayload = { ...updates };
    if (setPayload.data && typeof setPayload.data !== 'string') {
        setPayload.data = JSON.stringify(setPayload.data);
    }
    // Remove fields that shouldn't be directly set (like id, user_id, created_at)
    delete setPayload.id;
    delete setPayload.userId;
    // Ensure updated_at is handled correctly if needed (DB might handle it automatically)
    // delete setPayload.updatedAt; 

    const variables = { workflowId, set: setPayload };

    try {
        const result = await connectToDB(updateWorkflowMutation, variables);
        const updatedWorkflow = result?.updateWorkflowsCollection?.records?.[0];
        if (!updatedWorkflow?.id) {
            console.error('Update did not return expected data structure:', result);
            throw new Error('Failed to update workflow or retrieve updated data.');
        }
        console.log('Successfully updated workflow:', updatedWorkflow.id);
        return updatedWorkflow as WorkflowType;
    } catch (error) {
        console.error(`Failed to update workflow ${workflowId}:`, error);
        console.error('Variables causing update failure:', JSON.stringify(variables, null, 2));
        throw error;
    }
};

// --- Standalone deleteWorkflow Function ---
export const deleteWorkflow = async (workflowId: string): Promise<{ id: string }> => {
    await authCheck();

    const deleteWorkflowMutation = `
      mutation DeleteWorkflowMutation($workflowId: UUID!) {
          deleteFromWorkflowsCollection(filter: { id: { eq: $workflowId } }) {
              records {
                  id
              }
          }
      }
    `;
    const variables = { workflowId };

    try {
        const result = await connectToDB(deleteWorkflowMutation, variables);
        const deletedRecord = result?.deleteFromWorkflowsCollection?.records?.[0];
        if (!deletedRecord?.id) {
            console.error('Delete did not return expected data structure:', result);
            throw new Error('Failed to delete workflow or confirm deletion.');
        }
        console.log('Successfully deleted workflow:', deletedRecord.id);
        return deletedRecord as { id: string };
    } catch (error) {
        console.error(`Failed to delete workflow ${workflowId}:`, error);
        throw error;
    }
};