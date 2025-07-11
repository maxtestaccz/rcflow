import { create } from 'zustand';
import { Node, Edge, Connection } from 'reactflow';

export type Tool = 'select' | 'eraser' | 'rectangle' | 'circle' | 'label';

interface AppState {
  // Tool state
  currentTool: Tool;
  setCurrentTool: (tool: Tool) => void;
  
  // Canvas state
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  
  // History for undo/redo
  history: { nodes: Node[]; edges: Edge[] }[];
  historyIndex: number;
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Node editing
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;
  
  // Selected elements
  selectedNodes: Node[];
  setSelectedNodes: (nodes: Node[]) => void;
  
  // Delete node function
  deleteNode: (nodeId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Tool state
  currentTool: 'select',
  setCurrentTool: (tool) => set({ currentTool: tool }),
  
  // Canvas state
  nodes: [],
  edges: [],
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  // History
  history: [],
  historyIndex: -1,
  saveToHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    set({ 
      history: newHistory, 
      historyIndex: newHistory.length - 1 
    });
  },
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      set({ 
        nodes: prevState.nodes, 
        edges: prevState.edges, 
        historyIndex: historyIndex - 1 
      });
    }
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({ 
        nodes: nextState.nodes, 
        edges: nextState.edges, 
        historyIndex: historyIndex + 1 
      });
    }
  },
  
  // Node editing
  editingNodeId: null,
  setEditingNodeId: (id) => set({ editingNodeId: id }),
  
  // Selected elements
  selectedNodes: [],
  setSelectedNodes: (nodes) => set({ selectedNodes: nodes }),
  
  // Delete node function
  deleteNode: (nodeId) => {
    const { nodes, edges } = get();
    const updatedNodes = nodes.filter(node => node.id !== nodeId);
    const updatedEdges = edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
    set({ nodes: updatedNodes, edges: updatedEdges });
    get().saveToHistory();
  },
}));