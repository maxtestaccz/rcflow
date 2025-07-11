"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useAppStore } from '@/lib/store';

interface CustomNodeData {
  label: string;
  nodeType: 'rectangle' | 'circle' | 'label';
  width?: number;
  height?: number;
}

export function CustomNode({ id, data, selected }: NodeProps<CustomNodeData>) {
  const { editingNodeId, setEditingNodeId, nodes, setNodes } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, [id, label, nodes, setNodes, setEditingNodeId]);

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

  const getNodeStyle = () => {
    // For circles, use the smaller dimension to ensure perfect circle
    const circleSize = data.nodeType === 'circle' 
      ? Math.min(data.width || 80, data.height || 80)
      : null;
    
    const baseStyle = {
      width: circleSize || data.width || 120,
      height: circleSize || data.height || 80,
      position: 'relative' as const,
      border: selected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
      borderRadius: data.nodeType === 'circle' ? '50%' : '8px',
      background: data.nodeType === 'label' || data.nodeType === 'circle' ? 'transparent' : 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '500',
      color: '#1f2937',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    };

    return baseStyle;
  };

  const isDarkMode = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('dark');

  return (
    <div
      className={`react-flow__node-custom ${selected ? 'selected' : ''}`}
      style={{
        ...getNodeStyle(),
        border: selected 
          ? '2px solid #3b82f6' 
          : isDarkMode 
            ? '1px solid #404040' 
            : '1px solid #e5e7eb',
        background: data.nodeType === 'label' 
          ? 'transparent' 
          : isDarkMode 
            ? '#1a1a1a' 
            : 'white',
        color: isDarkMode ? '#ffffff' : '#1f2937',
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Resize Handles */}
      {selected && (
        <>
          <div className="resize-handle top-left" />
          <div className="resize-handle top-right" />
          <div className="resize-handle bottom-left" />
          <div className="resize-handle bottom-right" />
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
  );
}