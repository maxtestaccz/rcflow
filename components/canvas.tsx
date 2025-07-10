"use client";

import { useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Connection,
  Edge,
  Node,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Controls,
  Background,
  useReactFlow,
  OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAppStore } from '@/lib/store';
import { CustomNode } from './nodes/custom-node';
import { Toolbar } from './toolbar';

const nodeTypes = {
  custom: CustomNode,
};

function FlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    currentTool,
    setCurrentTool,
    nodes,
    edges,
    setNodes,
    setEdges,
    saveToHistory,
    selectedNodes,
    setSelectedNodes,
  } = useAppStore();

  const { project } = useReactFlow();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        id: `edge-${Date.now()}`,
        ...params,
        type: 'straight',
        style: { stroke: '#70f', strokeWidth: 2 },
      };
      setEdges(addEdge(newEdge, edges));
      saveToHistory();
    },
    [edges, setEdges, saveToHistory]
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (currentTool === 'select') return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: '',
          nodeType: currentTool === 'label' ? 'label' : currentTool,
          width: currentTool === 'label' ? 100 : 120,
          height: currentTool === 'label' ? 40 : 80,
        },
      };

      setNodes([...nodes, newNode]);
      saveToHistory();
      
      // Auto-switch back to select mode after creating a shape
      setCurrentTool('select');
    },
    [currentTool, project, nodes, setNodes, saveToHistory, setCurrentTool]
  );

  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      setSelectedNodes(params.nodes);
    },
    [setSelectedNodes]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (currentTool === 'eraser') {
        setNodes(nodes.filter((n) => n.id !== node.id));
        setEdges(edges.filter((e) => e.source !== node.id && e.target !== node.id));
        saveToHistory();
      }
    },
    [currentTool, nodes, edges, setNodes, setEdges, saveToHistory]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (currentTool === 'eraser') {
        setEdges(edges.filter((e) => e.id !== edge.id));
        saveToHistory();
      }
    },
    [currentTool, edges, setEdges, saveToHistory]
  );

  const onNodeDragStop = useCallback(() => {
    saveToHistory();
  }, [saveToHistory]);
  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50 dark:bg-[#0a0a0a]"
        nodesDraggable={currentTool === 'select'}
        nodesConnectable={currentTool === 'select'}
        elementsSelectable={currentTool === 'select'}
        panOnDrag={currentTool === 'select'}
        zoomOnScroll={currentTool === 'select'}
        connectionMode="loose"
      >
        <Background color="#aaa" gap={16} />
        <Controls 
          position="bottom-right" 
          className="bg-white dark:bg-[#101010] border border-gray-200 dark:border-gray-700"
        />
      </ReactFlow>
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <Toolbar />
      <FlowCanvas />
    </ReactFlowProvider>
  );
}