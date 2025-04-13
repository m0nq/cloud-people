/**
 * Node Service Provider
 *
 * This module provides real and mock implementations for node operations.
 */

import { createServiceProvider } from '.';
import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';
import type { QueryConfig } from '@app-types/api';
import { createClient } from '@lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

// Define the interface for our node service
export interface NodeService {
  createNodes(config: QueryConfig, supabaseClient?: SupabaseClient): Promise<CreatedNodeInfo>;

  updateNodes(config: QueryConfig): Promise<UpdatedNodeInfo>;

  deleteNodes(config: QueryConfig): Promise<any>;
}

// Interface specifically for the data returned by the createNodeMutation
export interface CreatedNodeInfo {
  id: string;
  workflow_id: string;
  node_type: string;
  created_at: string;
  updated_at: string;
}

// Interface for the data returned by the updateNode mutation
export interface UpdatedNodeInfo {
  id: string;
  workflow_id: string;
  node_type: string;
  state?: string | null;
  current_step?: string | null;
  updated_at?: string | null;
}

/**
 * Real node service implementation that connects to the database
 */
class RealNodeService implements NodeService {
  private supabase: SupabaseClient;
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor() {
    console.log('[RealNodeService] Initialized');
    this.supabase = createClient(); // Uses client-side client by default
    // Ensure environment variables are available
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    this.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error('Supabase URL or Anon Key is missing in environment variables.');
    }
  }

  async createNodes(config: QueryConfig = {}, supabaseClient?: SupabaseClient): Promise<CreatedNodeInfo> {
    const user = await authCheck();

    const workflowId = config.data?.workflowId;
    const nodeType = config.data?.nodeType || 'agent';

    if (!workflowId) {
      throw new Error('Workflow ID is required to create a node.');
    }

    const variables = {
      workflowId: workflowId,
      nodeType: nodeType
    };

    const createNodeMutation = `
      mutation CreateNodeMutation($workflowId: UUID!, $nodeType: String!) {
        collection: insertIntoNodesCollection(objects: [{
          workflow_id: $workflowId,
          node_type: $nodeType
        }]) {
          records {
            id
            workflow_id
            node_type
            created_at
            updated_at
          }
        }
      }
    `;

    try {
      // Get the current user session for the access token
      const clientToUse = supabaseClient || this.supabase;
      const { data: { session }, error: sessionError } = await clientToUse.auth.getSession();

      if (sessionError || !session) {
        console.error('Error getting session or session not found:', sessionError);
        throw new Error('User session not found. Cannot authenticate GraphQL request.');
      }

      const accessToken = session.access_token;
      const graphqlUrl = `${this.supabaseUrl}/graphql/v1`;

      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ query: createNodeMutation, variables })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`GraphQL request failed with status ${response.status}: ${errorBody}`);
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Check for GraphQL errors within the response body
      if (result.errors) {
        console.error('GraphQL mutation errors:', JSON.stringify(result.errors, null, 2));
        throw new Error(`GraphQL mutation failed: ${result.errors[0]?.message || 'Unknown GraphQL error'}`);
      }

      // Access the data correctly from the GraphQL response structure
      const createdNodeData = result?.data?.collection?.records?.[0];
      console.log('Raw GraphQL fetch result:', JSON.stringify(result, null, 2));

      // Check if the expected structure exists
      if (!createdNodeData?.id) {
        console.error('Node creation did not return expected data structure in GraphQL response:', result);
        throw new Error('Node creation did not return expected data');
      }

      console.log('Successfully created node:', createdNodeData);
      return createdNodeData; // Return the first created node data

    } catch (e) {
      console.error('Exception during node creation:', e);
      console.error('Failed to create node with variables:', {
        workflowId: config.data?.workflowId,
        nodeType: config.data?.nodeType
      });
      console.error('Underlying error:', e);
      throw e;
    }
  }

  async updateNodes(config: QueryConfig = {}): Promise<UpdatedNodeInfo> {
    const user = await authCheck();

    const updateNodeMutation = `
      mutation UpdateNodeMutation($nodeId: UUID!, $workflowId: UUID!, $set: NodesUpdateInput!) {
        collection: updateNodesCollection(
          set: $set,
          filter: { id: { eq: $nodeId }, workflow_id: { eq: $workflowId } }
        ) {
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
      const variables = {
        nodeId: config.data?.nodeId,
        workflowId: config.data?.workflowId,
        set: { ...config.data?.set } // Clone the set object
      };

      if (!variables.nodeId || !variables.workflowId) {
        throw new Error('nodeId and workflowId are required for updating nodes.');
      }

      // Convert Date object to ISO string if present
      if (variables.set.updated_at instanceof Date) {
        variables.set.updated_at = variables.set.updated_at.toISOString();
      }

      // Get session token for auth
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Error getting session or session not found:', sessionError);
        throw new Error('User session not found. Cannot authenticate GraphQL request.');
      }

      const accessToken = session.access_token;
      const graphqlUrl = `${this.supabaseUrl}/graphql/v1`;

      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ query: updateNodeMutation, variables })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`GraphQL update request failed with status ${response.status}: ${errorBody}`);
        throw new Error(`GraphQL update request failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        console.error('GraphQL update mutation errors:', JSON.stringify(result.errors, null, 2));
        // Log variables that caused the error
        console.error('Variables causing GraphQL error:', JSON.stringify(variables, null, 2));
        throw new Error(`GraphQL update mutation failed: ${result.errors[0]?.message || 'Unknown GraphQL error'}`);
      }

      const updatedNodeData = result?.data?.collection?.records?.[0];

      if (!updatedNodeData?.id) {
        console.error('Node update did not return expected data structure:', result);
        throw new Error('Node update did not return expected data');
      }

      console.log('Successfully updated node:', updatedNodeData);
      return updatedNodeData;

    } catch (error) {
      console.error('Failed to update node:', error);
      // Log the variables that might have caused the failure if not GraphQL error
      if (!(error instanceof Error && error.message.startsWith('GraphQL'))) {
        console.error('Variables potentially causing update failure:', JSON.stringify(config.data, null, 2));
      }
      throw error;
    }
  }

  async deleteNodes(config: QueryConfig = {}): Promise<any> {
    const user = await authCheck();

    const deleteNodeMutation = `
      mutation DeleteNodeMutation($nodeId: UUID!) {
        collection: deleteFromNodesCollection(filter: { id: { eq: $nodeId } }) {
          records {
            id
          }
        }
      }
    `;

    try {
      const variables = {
        nodeId: config.nodeId
      };

      const [node] = await connectToDB(deleteNodeMutation, variables);

      if (!node) {
        throw new Error('Failed to delete node');
      }

      return node;
    } catch (error) {
      console.error('Failed to delete node:', error);
      throw error;
    }
  }
}

/**
 * Mock node service implementation that simulates database operations
 */
class MockNodeService implements NodeService {
  // Mock nodes data
  private mockNodes: any[] = [];
  private nextId = 1;

  constructor() {
    console.log('[MockNodeService] Initialized');
  }

  async createNodes(config: QueryConfig = {}, supabaseClient?: SupabaseClient): Promise<CreatedNodeInfo> {
    // Simulate API delay
    await this.delay(200);

    const nodeId = `mock-node-${this.nextId++}`;

    const newNode = {
      id: nodeId,
      workflow_id: config.data?.workflowId || 'mock-workflow-1',
      node_type: config.data?.nodeType || 'agent',
      parent_id: config.data?.parentId || null,
      state: 'initial',
      current_step: '0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockNodes.push(newNode);

    console.log(`[MockNodeService] Created node: ${nodeId} of type ${newNode.node_type}`);
    return newNode;
  }

  async updateNodes(config: QueryConfig = {}): Promise<UpdatedNodeInfo> {
    // Simulate API delay
    await this.delay(200);

    const nodeId = config.data?.nodeId;
    if (!nodeId) {
      throw new Error('No node ID provided for update');
    }

    const nodeIndex = this.mockNodes.findIndex(n => n.id === nodeId);

    if (nodeIndex === -1) {
      throw new Error('No node found with the provided ID');
    }

    // Update the node
    const updatedNode = {
      ...this.mockNodes[nodeIndex],
      ...config.data?.set,
      updated_at: new Date().toISOString()
    };

    this.mockNodes[nodeIndex] = updatedNode;

    console.log(`[MockNodeService] Updated node: ${nodeId}`);
    return updatedNode;
  }

  async deleteNodes(config: QueryConfig = {}): Promise<any> {
    // Simulate API delay
    await this.delay(200);

    const nodeId = config.nodeId;
    if (!nodeId) {
      throw new Error('No node ID provided for deletion');
    }

    const nodeIndex = this.mockNodes.findIndex(n => n.id === nodeId);

    if (nodeIndex === -1) {
      throw new Error('No node found with the provided ID');
    }

    const deletedNode = this.mockNodes[nodeIndex];
    this.mockNodes.splice(nodeIndex, 1);

    console.log(`[MockNodeService] Deleted node: ${nodeId}`);
    return deletedNode;
  }

  // Helper to simulate API delays
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create and export the node service with automatic mode switching
export const nodeService = createServiceProvider<NodeService>(
  new RealNodeService(),
  new MockNodeService(),
  {
    // Default to real in production, mock in development
    defaultMode: process.env.NODE_ENV === 'production' ? 'real' : 'mock'
  }
);

// Export a hook for accessing the node service
export function useNodeService() {
  return nodeService;
}
