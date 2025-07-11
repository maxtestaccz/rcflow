"use client";

import { useCallback, useEffect, useRef } from 'react';
import { Palette, Type, Square, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodeData: any;
  onClose: () => void;
  onUpdateNode: (updates: any) => void;
}

const gradientColors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
];

const textColors = [
  '#000000',
  '#ffffff',
  '#3b82f6',
  '#ef4444',
];

export function NodeContextMenu({ x, y, nodeId, nodeData, onClose, onUpdateNode }: NodeContextMenuProps) {
  const { nodes, setNodes, saveToHistory } = useAppStore();
  const menuRef = useRef<HTMLDivElement>(null);

  const deleteNode = useCallback(() => {
    const updatedNodes = nodes.filter(node => node.id !== nodeId);
    setNodes(updatedNodes);
    saveToHistory();
    onClose();
  }, [nodeId, nodes, setNodes, saveToHistory, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-48"
      style={{ left: x, top: y }}
    >
      {/* Background Color Section */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2 px-2 py-1">
          <Palette className="w-4 h-4" />
          <span className="text-sm font-medium">Background</span>
        </div>
        <div className="grid grid-cols-4 gap-2 px-2">
          {gradientColors.map((gradient, index) => (
            <button
              key={index}
              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
              style={{ background: gradient }}
              onClick={() => onUpdateNode({ backgroundColor: gradient })}
            />
          ))}
        </div>
      </div>

      {/* Text Color Section */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2 px-2 py-1">
          <Type className="w-4 h-4" />
          <span className="text-sm font-medium">Text Color</span>
        </div>
        <div className="grid grid-cols-4 gap-2 px-2">
          {textColors.map((color, index) => (
            <button
              key={index}
              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => onUpdateNode({ textColor: color })}
            />
          ))}
        </div>
      </div>

      {/* Border Style Section */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2 px-2 py-1">
          <Square className="w-4 h-4" />
          <span className="text-sm font-medium">Border</span>
        </div>
        <div className="flex gap-2 px-2">
          <button
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => onUpdateNode({ borderStyle: 'solid' })}
          >
            Solid
          </button>
          <button
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            style={{ borderStyle: 'dotted' }}
            onClick={() => onUpdateNode({ borderStyle: 'dotted' })}
          >
            Dotted
          </button>
        </div>
      </div>

      {/* Delete Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
        <button
          className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          onClick={deleteNode}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}