import { useCallback } from 'react';

import { useModalStore } from '@stores/modal-store';
import { useWorkflowStore } from '@stores/workflow';
import { useShallow } from 'zustand/react/shallow';

/**
 * Custom hook that provides actions for node components.
 * Centralizes common node interaction logic to reduce code duplication
 * and improve performance by memoizing callback functions.
 * 
 * @param nodeId - The ID of the node
 * @returns Object containing memoized node action functions
 */
export function useNodeActions(nodeId: string) {
  const { openModal } = useModalStore();
  
  // Only select the edges from the workflow store to minimize re-renders
  const edges = useWorkflowStore(
    useShallow(state => state.edges)
  );
  
  /**
   * Opens the agent selection modal for adding a new node.
   * Checks if the node already has a child and prevents adding
   * more than one child (until parallel execution is supported).
   */
  const openAgentSelectionModal = useCallback(() => {
    // Check if this node already has a child
    const existingChildren = edges.filter(edge => edge.source === nodeId);

    // TODO: Parallel node execution will be implemented in a future update.
    // For now, we restrict each node to having at most one child to maintain
    // a simple linear workflow structure.
    if (existingChildren.length >= 1) {
      alert('Node already has a child. Parallel execution is not yet supported.');
      return;
    }

    openModal({ type: 'agent-selection', parentNodeId: nodeId });
  }, [nodeId, openModal, edges]);
  
  /**
   * Opens the agent details modal for viewing or editing agent configuration.
   */
  const openAgentDetailsModal = useCallback(() => {
    openModal({ type: 'agent-details', parentNodeId: nodeId });
  }, [nodeId, openModal]);
  
  return {
    openAgentSelectionModal,
    openAgentDetailsModal
  };
}
