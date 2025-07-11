"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useAppStore } from '@/lib/store';
import { Palette, Type, Square, Trash2 } from 'lucide-react';

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
  const [isHovered, setIsHovered] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<'background' | 'text' | null>(null);
  const [showBorderPicker, setShowBorderPicker] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const isTextEditing = editingNodeId === id;

  const backgroundColors = ['#ffffff', '#f3f4f6', '#dbeafe', '#fef3c7'];
  const textColors = ['#000000', '#374151', '#1f2937', '#991b1b'];

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

  const updateNodeData = useCallback((updates: Partial<CustomNodeData>) => {
    const updatedNodes = nodes.map(node => 
      node.id === id 
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    );
    setNodes(updatedNodes);
    saveToHistory();
  }, [id, nodes, setNodes, saveToHistory]);

  const handleColorChange = useCallback((color: string, type: 'background' | 'text') => {
    if (type === 'background') {
      updateNodeData({ backgroundColor: color });
    } else {
      updateNodeData({ textColor: color });
    }
    setShowColorPicker(null);
  }, [updateNodeData]);

  const handleBorderChange = useCallback((borderStyle: 'solid' | 'dotted') => {
    updateNodeData({ borderStyle });
    setShowBorderPicker(false);
  }, [updateNodeData]);

  const handleDelete = useCallback(() => {
    const updatedNodes = nodes.filter(node => node.id !== id);
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

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;
      
      let newWidth = startSize.width;
      let newHeight = startSize.height;

      switch (handle) {
        case 'bottom-right':
          newWidth = Math.max(60, startSize.width + deltaX);
          newHeight = Math.max(40, startSize.height + deltaY);
          break;
        case 'bottom-left':
          newWidth = Math.max(60, startSize.width - deltaX);
          newHeight = Math.max(40, startSize.height + deltaY);
          break;
        case 'top-right':
          newWidth = Math.max(60, startSize.width + deltaX);
          newHeight = Math.max(40, startSize.height - deltaY);
          break;
        case 'top-left':
          newWidth = Math.max(60, startSize.width - deltaX);
          newHeight = Math.max(40, startSize.height - deltaY);
          break;
      }

      // For circles, maintain aspect ratio
      if (data.nodeType === 'circle') {
        const size = Math.min(newWidth, newHeight);
        newWidth = size;
        newHeight = size;
      }

      updateNodeData({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isResizing, startPos, startSize, data.nodeType, data.width, data.height, updateNodeData]);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowColorPicker(null);
        setShowBorderPicker(false);
      }}
    >
      {/* Resize Handles */}
      {selected && (
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

     