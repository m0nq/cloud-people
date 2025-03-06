import { useState, useCallback } from 'react';
import { Edge, Connection, Node } from 'reactflow';
import { nanoid } from 'nanoid';

interface ConnectionSystemState {
  isConnectionMode: boolean;
  selectedEdge: Edge | null;
  areConnectionsHidden: boolean;
  connectionHistory: {
    past: Edge[][],
    present: Edge[],
    future: Edge[][],
  };
}

export const useConnectionSystem = (initialEdges: Edge[] = []) => {
  const [state, setState] = useState<ConnectionSystemState>({
    isConnectionMode: false,
    selectedEdge: null,
    areConnectionsHidden: false,
    connectionHistory: {
      past: [],
      present: initialEdges,
      future: [],
    },
  });

  const toggleConnectionMode = useCallback(() => {
    setState(prev => ({ ...prev, isConnectionMode: !prev.isConnectionMode }));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setState(prev => {
      const newEdge: Edge = {
        id: `e${nanoid()}`,
        source: connection.source!,
        target: connection.target!,
        type: 'custom',
        data: { label: 'New Connection' },
        style: {
          stroke: '#6b7280',
          strokeWidth: 2,
          strokeDasharray: 'none',
        },
      };

      return {
        ...prev,
        connectionHistory: {
          past: [...prev.connectionHistory.past, prev.connectionHistory.present],
          present: [...prev.connectionHistory.present, newEdge],
          future: [],
        },
      };
    });
  }, []);

  const onEdgeSelect = useCallback((edge: Edge | null) => {
    setState(prev => ({ ...prev, selectedEdge: edge }));
  }, []);

  const updateEdgeStyle = useCallback((edge: Edge, style: any) => {
    setState(prev => ({
      ...prev,
      connectionHistory: {
        past: [...prev.connectionHistory.past, prev.connectionHistory.present],
        present: prev.connectionHistory.present.map(e => 
          e.id === edge.id ? { ...e, style: { ...e.style, ...style } } : e
        ),
        future: [],
      },
    }));
  }, []);

  const updateEdgeLabel = useCallback((edge: Edge, label: string) => {
    setState(prev => ({
      ...prev,
      connectionHistory: {
        past: [...prev.connectionHistory.past, prev.connectionHistory.present],
        present: prev.connectionHistory.present.map(e => 
          e.id === edge.id ? { ...e, data: { ...e.data, label } } : e
        ),
        future: [],
      },
    }));
  }, []);

  const deleteEdge = useCallback((edge: Edge) => {
    setState(prev => ({
      ...prev,
      selectedEdge: null,
      connectionHistory: {
        past: [...prev.connectionHistory.past, prev.connectionHistory.present],
        present: prev.connectionHistory.present.filter(e => e.id !== edge.id),
        future: [],
      },
    }));
  }, []);

  const toggleConnectionsVisibility = useCallback(() => {
    setState(prev => ({ ...prev, areConnectionsHidden: !prev.areConnectionsHidden }));
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.connectionHistory.past.length === 0) return prev;

      const newPast = prev.connectionHistory.past.slice(0, -1);
      const newPresent = prev.connectionHistory.past[prev.connectionHistory.past.length - 1];

      return {
        ...prev,
        connectionHistory: {
          past: newPast,
          present: newPresent,
          future: [prev.connectionHistory.present, ...prev.connectionHistory.future],
        },
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.connectionHistory.future.length === 0) return prev;

      const [newPresent, ...newFuture] = prev.connectionHistory.future;

      return {
        ...prev,
        connectionHistory: {
          past: [...prev.connectionHistory.past, prev.connectionHistory.present],
          present: newPresent,
          future: newFuture,
        },
      };
    });
  }, []);

  const onNodesDelete = useCallback((nodes: Node[]) => {
    const nodeIds = new Set(nodes.map(n => n.id));
    
    setState(prev => ({
      ...prev,
      connectionHistory: {
        past: [...prev.connectionHistory.past, prev.connectionHistory.present],
        present: prev.connectionHistory.present.filter(
          edge => !nodeIds.has(edge.source) && !nodeIds.has(edge.target)
        ),
        future: [],
      },
    }));
  }, []);

  return {
    edges: state.connectionHistory.present,
    isConnectionMode: state.isConnectionMode,
    selectedEdge: state.selectedEdge,
    areConnectionsHidden: state.areConnectionsHidden,
    canUndo: state.connectionHistory.past.length > 0,
    canRedo: state.connectionHistory.future.length > 0,
    toggleConnectionMode,
    onConnect,
    onEdgeSelect,
    updateEdgeStyle,
    updateEdgeLabel,
    deleteEdge,
    toggleConnectionsVisibility,
    undo,
    redo,
    onNodesDelete,
  };
};