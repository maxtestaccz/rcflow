"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useAppStore } from '@/lib/store';
import { NodeContextMenu } from './node-context-menu';

interface CustomNodeData {
  label: string;
  nodeType: 'rectangle' | 'circle' | 'label';
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  borderStyle?: 'solid' | 'dotted';
}

export function CustomNode({ id, data, selected }: NodeProps<CustomNodeData>) {
  const { editingNodeId, setEditingNodeId, nodes, setNodes, saveToHistory } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || '');
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const isTextEditing = editingNodeId === id;

  useEffect(() => {
    if (isTextEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isTextEditing]);

  const handleDoubleClick = useCallback(() => {
    setEditingNodeId(id);
    setIsEditing(true);
  }, [id, setEditingNodeId]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLabel(e.target.value);
  }, []);

  const handleTextSubmit = useCallback(() => {
    const updatedNodes = nodes.map(node => 
      node.id === id 
        ? { ...node, data: { ...node.data, label } }
        : node
    );
    setNodes(updatedNodes);
    setEditingNodeId(null);
    setIsEditing(false);
    saveToHistory();
  }, [id, label, nodes, setNodes, setEditingNodeId, saveToHistory]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      setEditingNodeId(null);
      setIsEditing(false);
      setLabel(data.label || '');
    }
  }, [handleTextSubmit, setEditingNodeId, data.label]);

  const handleBlur = useCallback(() => {
    handleTextSubmit();
  }, [handleTextSubmit]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const updateNodeData = useCallback((updates: Partial<CustomNodeData>) => {
    const updatedNodes = nodes.map(node => 
      node.id === id 
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    );
    setNodes(updatedNodes);
    saveToHistory();
  }, [id, nodes, setNodes, saveToHistory]);

  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ 
      width: data.width || 120, 
      height: data.height || 80 
    });
  }, [data.width, data.height]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeHandle) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    let newWidth = startSize.width;
    let newHeight = startSize.height;

    if (resizeHandle.includes('right')) {
      newWidth = Math.max(50, startSize.width + deltaX);
    }
    if (resizeHandle.includes('left')) {
      newWidth = Math.max(50, startSize.width - deltaX);
    }
    if (resizeHandle.includes('bottom')) {
      newHeight = Math.max(30, startSize.height + deltaY);
    }
    if (resizeHandle.includes('top')) {
      newHeight = Math.max(30, startSize.height - deltaY);
    }

    // For circles, maintain aspect ratio
    if (data.nodeType === 'circle') {
      const size = Math.min(newWidth, newHeight);
      newWidth = size;
      newHeight = size;
    }

    updateNodeData({ width: newWidth, height: newHeight });
  }, [isResizing, resizeHandle, startPos, startSize, data.nodeType, updateNodeData]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const getNodeStyle = () => {
    const circleSize = data.nodeType === 'circle' 
      ? Math.min(data.width || 80, data.height || 80)
      : null;
    
    const baseStyle = {
      width: circleSize || data.width || 120,
      height: circleSize || data.height || 80,
      position: 'relative' as const,
      borderRadius: data.nodeType === 'circle' ? '50%' : '8px',
      background: data.backgroundColor || (data.nodeType === 'label' ? 'transparent' : 'white'),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '500',
      color: data.textColor || '#1f2937',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: selected 
        ? '2px solid #3b82f6' 
        : `1px ${data.borderStyle || 'solid'} #e5e7eb`,
    };

    return baseStyle;
  };

  const isDarkMode = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('dark');

  return (
    <>
      <div
        ref={nodeRef}
        className={`react-flow__node-custom ${selected ? 'selected' : ''}`}
        style={{
          ...getNodeStyle(),
          border: selected 
            ? '2px solid #3b82f6' 
            : isDarkMode 
              ? `1px ${data.borderStyle || 'solid'} #404040` 
              : `1px ${data.borderStyle || 'solid'} #e5e7eb`,
          background: data.backgroundColor || (data.nodeType === 'label' 
            ? 'transparent' 
            : isDarkMode 
              ? '#1a1a1a' 
              : 'white'),
          color: data.textColor || (isDarkMode ? '#ffffff' : '#1f2937'),
        }}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Resize Handles */}
        {selected && data.nodeType !== 'label' && (
          <>
            <div 
              className="resize-handle top-left" 
              onMouseDown={(e) => handleResizeStart(e, 'top-left')}
            />
            <div 
              className="resize-handle top-right" 
              onMouseDown={(e) => handleResizeStart(e, 'top-right')}
            />
            <div 
              className="resize-handle bottom-left" 
              onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
            />
            <div 
              className="resize-handle bottom-right" 
              onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            />
          </>
        )}

        {/* Text Content */}
        {isTextEditing ? (
          <textarea
            ref={textareaRef}
            value={label}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="editable-text"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              color: 'inherit',
              textAlign: 'center',
              width: '70%',
            }}
          />
        ) : (
          <div className="text-content" style={{ width: '70%', textAlign: 'center' }}>
            {label}
          </div>
        )}

        {/* Handles for connections */}
        <Handle 
          type="source" 
          position={Position.Right} 
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !opacity-0 hover:!opacity-100 !transition-opacity !duration-200" 
          style={{ right: -6 }}
        />
        <Handle 
          type="target" 
          position={Position.Left} 
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !opacity-0 hover:!opacity-100 !transition-opacity !duration-200" 
          style={{ left: -6 }}
        />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={id}
          nodeData={data}
          onClose={closeContextMenu}
          onUpdateNode={updateNodeData}
        />
      )}
    </>
  );
}