import { create } from 'zustand';
import { Node, Edge } from '../types';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Partial<Node>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (id: string) => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [
    {
      id: '1',
      type: 'input',
      position: { x: 250, y: 25 },
      data: { label: 'Input Node' },
    },
    {
      id: '2',
      type: 'default',
      position: { x: 100, y: 125 },
      data: { label: 'Process Node' },
    },
    {
      id: '3',
      type: 'output',
      position: { x: 250, y: 250 },
      data: { label: 'Output Node' },
    },
  ],
  edges: [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
  ],
  setNodes: (nodes) => set((state) => ({ 
    nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes 
  })),
  setEdges: (edges) => set((state) => ({ 
    edges: typeof edges === 'function' ? edges(state.edges) : edges 
  })),
  addNode: (node) => set((state) => ({ 
    nodes: [...state.nodes, node] 
  })),
  updateNode: (id, data) => set((state) => ({
    nodes: state.nodes.map(node => 
      node.id === id ? { ...node, ...data } : node
    ),
  })),
  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== id),
    edges: state.edges.filter(edge => edge.source !== id && edge.target !== id),
  })),
  addEdge: (edge) => set((state) => ({ 
    edges: [...state.edges, edge] 
  })),
  removeEdge: (id) => set((state) => ({
    edges: state.edges.filter(edge => edge.id !== id),
  })),
}));