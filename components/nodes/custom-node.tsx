"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useAppStore } from '@/lib/store';
import { Palette, Type, Square, Trash2, Minus } from 'lucide-react';

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
  const [showPopup, setShowPopup] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<'background' | 'text' | null>(null);
  const [showBorderPicker, setShowBorderPicker] = useState(false);
  
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nodeRef.current && !nodeRef.current.contains(event.target as Node)) {
        setShowPopup(false);
        setShowColorPicker(null);
        setShowBorderPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNodeId(id);
    setIsEditing(true);
    setShowPopup(false);
  }, [id, setEditingNodeId]);

  const handleSingleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isTextEditing) {
      setShowPopup(!showPopup);
    }
  }, [isTextEditing, showPopup]);

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
    setShowPopup(false);
  }, [id, nodes, setNodes, saveToHistory]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = data.width || 120;
    const startHeight = data.height || 80;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;

      switch (direction) {
        case 'bottom-right':
          newWidth = Math.max(60, startWidth + deltaX);
          newHeight = Math.max(40, startHeight + deltaY);
          break;
        case 'bottom-left':
          newWidth = Math.max(60, startWidth - deltaX);
          newHeight = Math.max(40, startHeight + deltaY);
          break;
        case 'top-right':
          newWidth = Math.max(60, startWidth + deltaX);
          newHeight = Math.max(40, startHeight - deltaY);
          break;
        case 'top-left':
          newWidth = Math.max(60, startWidth - deltaX);
          newHeight = Math.max(40, startHeight - deltaY);
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
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [data.width, data.height, data.nodeType, updateNodeData]);

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
      onClick={handleSingleClick}
    >
      {/* Resize Handles */}
      {selected && (
        <>
          <div 
            className="resize-handle top-left" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')}
          />
          <div 
            className="resize-handle top-right" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')}
          />
          <div 
            className="resize-handle bottom-left" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')}
          />
          <div 
            className="resize-handle bottom-right" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}
          />
        </>
      )}

      {/* Options Popup */}
      {showPopup && !isTextEditing && (
        <div
          className="absolute top-0 left-full ml-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 z-50 flex flex-col gap-1"
          style={{ minWidth: '120px' }}
        >
          {/* Background Color */}
          <div className="relative">
            <button
              className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(showColorPicker === 'background' ? null : 'background');
                setShowBorderPicker(false);
              }}
            >
              <Palette className="w-4 h-4" />
              Background
            </button>
            {showColorPicker === 'background' && (
              <div className="absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 flex gap-1">
                {backgroundColors.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorChange(color, 'background');
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Text Color */}
          <div className="relative">
            <button
              className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(showColorPicker === 'text' ? null : 'text');
                setShowBorderPicker(false);
              }}
            >
              <Type className="w-4 h-4" />
              Text Color
            </button>
            {showColorPicker === 'text' && (
              <div className="absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 flex gap-1">
                {textColors.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorChange(color, 'text');
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Border Style */}
          <div className="relative">
            <button
              className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setShowBorderPicker(!showBorderPicker);
                setShowColorPicker(null);
              }}
            >
              <Minus className="w-4 h-4" />
              Border
            </button>
            {showBorderPicker && (
              <div className="absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 flex flex-col gap-1">
                <button
                  className="px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded border-b border-solid border-gray-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBorderChange('solid');
                  }}
                >
                  Solid
                </button>
                <button
                  className="px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded border-b border-dotted border-gray-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBorderChange('dotted');
                  }}
                >
                  Dotted
                </button>
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 rounded"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
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