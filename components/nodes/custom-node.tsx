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
  const [showPopup, setShowPopup] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<'background' | 'text' | null>(null);
  const [showBorderPicker, setShowBorderPicker] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
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

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isTextEditing) {
      setShowPopup(!showPopup);
    }
  }, [isTextEditing, showPopup]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNodeId(id);
    setIsEditing(true);
    setShowPopup(false);
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
    setShowPopup(false);
  }, [id, nodes, setNodes, saveToHistory]);

  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = data.width || 120;
    const startHeight = data.height || 80;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;

      switch (handle) {
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
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [data.nodeType, data.width, data.height, updateNodeData]);

  const getNodeStyle = () => {
    const circleSize = data.nodeType === 'circle' 
      ? Math.min(data.width || 80, data.height || 80)
      : null;
    
    const isDarkMode = typeof window !== 'undefined' && 
      document.documentElement.classList.contains('dark');
    
    return {
      width: circleSize || data.width || 120,
      height: circleSize || data.height || 80,
      position: 'relative' as const,
      borderRadius: data.nodeType === 'circle' ? '50%' : '8px',
      background: data.backgroundColor || (data.nodeType === 'label' 
        ? 'transparent' 
        : isDarkMode 
          ? '#1a1a1a' 
          : 'white'),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '500',
      color: data.textColor || (isDarkMode ? '#ffffff' : '#1f2937'),
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: selected 
        ? '2px solid #3b82f6' 
        : `1px ${data.borderStyle || 'solid'} ${isDarkMode ? '#404040' : '#e5e7eb'}`,
    };
  };

  return (
    <div
      ref={nodeRef}
      className={`react-flow__node-custom ${selected ? 'selected' : ''}`}
      style={getNodeStyle()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Resize Handles */}
      {selected && !isTextEditing && (
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

      {/* Options Popup */}
      {showPopup && !isTextEditing && (
        <div className="node-popup">
          {/* Background Color */}
          <div className="popup-option">
            <button
              className="option-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(showColorPicker === 'background' ? null : 'background');
                setShowBorderPicker(false);
              }}
            >
              <Palette size={16} />
            </button>
            {showColorPicker === 'background' && (
              <div className="color-picker">
                {backgroundColors.map((color) => (
                  <button
                    key={color}
                    className="color-option"
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
          <div className="popup-option">
            <button
              className="option-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(showColorPicker === 'text' ? null : 'text');
                setShowBorderPicker(false);
              }}
            >
              <Type size={16} />
            </button>
            {showColorPicker === 'text' && (
              <div className="color-picker">
                {textColors.map((color) => (
                  <button
                    key={color}
                    className="color-option"
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
          <div className="popup-option">
            <button
              className="option-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowBorderPicker(!showBorderPicker);
                setShowColorPicker(null);
              }}
            >
              <Square size={16} />
            </button>
            {showBorderPicker && (
              <div className="border-picker">
                <button
                  className="border-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBorderChange('solid');
                  }}
                >
                  Solid
                </button>
                <button
                  className="border-option"
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
          <div className="popup-option">
            <button
              className="option-button delete-button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
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
          className="node-textarea"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            width: '100%',
            height: '100%',
            textAlign: 'center',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            color: 'inherit',
            fontFamily: 'inherit',
          }}
        />
      ) : (
        <span className="node-label">{data.label}</span>
      )}

      {/* Connection Handles */}
      {data.nodeType !== 'label' && (
        <>
          <Handle type="target" position={Position.Top} />
          <Handle type="source" position={Position.Bottom} />
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
        </>
      )}
    </div>
  );
}