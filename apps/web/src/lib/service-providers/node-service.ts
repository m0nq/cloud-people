'use server';

import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';
import type { QueryConfig } from '@app-types/api';

// Interface specifically for the data returned by the createNodeMutation (KEEP)
export interface CreatedNodeInfo {
  id: string;
  workflow_id: string;
  node_type: string;
  created_at: string;
  updated_at: string;
  agent_id?: string; // Optionally include agent_id
}

// Interface for the data returned by the updateNode mutation (KEEP)
export interface UpdatedNodeInfo {
  id: string;
  workflow_id: string;
  node_type: string;
  state?: string | null;
  current_step?: string | null;
  updated_at?: string | null;
}

// --- ADD REFACTORED createNodes ---
export const createNodes = async (config: QueryConfig = {}): Promise<CreatedNodeInfo> => {
  await authCheck(); // Ensures authentication

  const workflowId = config.data?.workflowId;
  const nodeType = config.data?.nodeType || 'default'; // Provide default if necessary
  const agentId = config.data?.agentId;

  if (!workflowId) {
    throw new Error('Workflow ID is required to create a node.');
  }

  const variables: { workflowId: string; nodeType: string; agentId?: string } = {
    workflowId: workflowId,
    nodeType: nodeType
  };

  if (nodeType === 'agent') {
    if (!agentId) {
      throw new Error('Agent ID is required for nodes of type "agent".');
    }
    variables.agentId = agentId;
  }

  const createNodeMutation = `
    mutation CreateNodeMutation($workflowId: UUID!, $nodeType: String!, $agentId: UUID) { 
      collection: insertIntoNodesCollection(objects: [{
        workflow_id: $workflowId,
        node_type: $nodeType,
        agent_id: $agentId  
      }]) {
        records {
          id
          workflow_id
          node_type
          created_at
          updated_at
          agent_id 
        }
      }
    }
  `;

  try {
    const result = await connectToDB(createNodeMutation, variables);

    const records = result;

    if (!Array.isArray(records) || records.length === 0 || !records[0]) {
      console.error('[createNodes] Failed structure check. Result object:', result);
      throw new Error('Failed to create node or retrieve valid creation info.');
    }

    console.log('[createNodes] Node created successfully:', records[0]);
    return records[0] as CreatedNodeInfo;

  } catch (error: any) {
    console.error('[createNodes] Error caught:', error);
    console.error('[createNodes] Variables causing failure:', JSON.stringify(variables, null, 2));
    throw new Error(`Failed to create node: ${error.message || error}`);
  }
};

// --- Placeholder for updateNodes ---
export const updateNodes = async (config: QueryConfig = {}): Promise<UpdatedNodeInfo> => {
  await authCheck(); // Ensure authentication

  const workflowId = config.data?.workflowId;
  const nodeId = config.data?.nodeId;
  const updates = config.data?.set; // Object containing fields to update

  if (!workflowId || !nodeId) {
    throw new Error('Workflow ID and Node ID are required to update a node.');
  }

  if (!updates || Object.keys(updates).length === 0) {
    console.warn('updateNodes called without any fields to update for node:', nodeId);
    throw new Error('No update data provided for updateNodes.');
  }

  const variables = {
    filter: {
      workflow_id: { eq: workflowId },
      id: { eq: nodeId }
    },
    set: {
      ...updates,
      updated_at: new Date().toISOString() 
    }
  };

  const updateNodeMutation = `
    mutation UpdateNodeMutation($filter: NodesFilter!, $set: NodesUpdateInput!) {
      updateNodesCollection(filter: $filter, set: $set) {
        affectedCount
        records {
          id
          workflow_id
          node_type
          state
          current_step
          updated_at
        }
      }
    }
  `;

  try {
    console.log('Attempting to update node:', nodeId, 'with data:', variables.set);
    const result = await connectToDB(updateNodeMutation, variables);

    const collection = result?.updateNodesCollection;
    const records = collection?.records;

    if (collection?.affectedCount === 0) {
      console.warn('Node update mutation affected 0 rows. Node ID:', nodeId, 'Workflow ID:', workflowId);
      throw new Error(`Node with ID ${nodeId} not found or not updated.`);
    }

    if (!records || !Array.isArray(records) || records.length === 0 || !records[0]) {
      console.error('No records returned or unexpected structure from updateNode mutation. NodeID:', nodeId, 'Result:', JSON.stringify(result));
      throw new Error('Failed to update node or retrieve update info.');
    }

    console.log('Successfully updated node:', records[0]);
    return records[0] as UpdatedNodeInfo;

  } catch (error) {
    console.error('Failed to update node:', nodeId, 'Error:', error);
    console.error('Variables potentially causing update failure:', JSON.stringify(variables, null, 2));
    throw error; 
  }
};

// --- Placeholder for deleteNodes ---
export const deleteNodes = async (config: QueryConfig = {}): Promise<{ affectedCount: number }> => {
    await authCheck(); // Ensure authentication

    const workflowId = config.data?.workflowId;
    const nodeId = config.data?.nodeId;

    if (!workflowId || !nodeId) {
        throw new Error('Workflow ID and Node ID are required to delete a node.');
    }

    const variables = {
        filter: {
            workflow_id: { eq: workflowId },
            id: { eq: nodeId }
        }
    };

    const deleteNodeMutation = `
      mutation DeleteNodeMutation($filter: NodesFilter!) {
        deleteFromNodesCollection(filter: $filter) {
          affectedCount
        }
      }
    `;

    try {
        console.log('Attempting to delete node:', nodeId, 'from workflow:', workflowId);
        const result = await connectToDB(deleteNodeMutation, variables);

        const collection = result?.deleteFromNodesCollection;
        const affectedCount = collection?.affectedCount;

        if (typeof affectedCount !== 'number') {
            console.error('Unexpected response structure from deleteNode mutation. NodeID:', nodeId, 'Result:', JSON.stringify(result));
            throw new Error('Failed to delete node or retrieve deletion info.');
        }

        if (affectedCount === 0) {
            console.warn('Node delete mutation affected 0 rows. Node ID:', nodeId, 'Workflow ID:', workflowId);
        }

        console.log(`Successfully processed delete request for node: ${nodeId}. Affected count: ${affectedCount}`);
        return { affectedCount };

    } catch (error) {
        console.error('Failed to delete node:', nodeId, 'Error:', error);
        console.error('Variables potentially causing delete failure:', JSON.stringify(variables, null, 2));
        throw error; 
    }
};