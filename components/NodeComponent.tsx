
import React, { useMemo } from 'react';
import { Node, NodeType } from '../types';

interface NodeComponentProps {
  node: Node;
  isSelected: boolean;
  onClick: (id: string) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onStartConnect?: (e: React.MouseEvent) => void;
}

const NodeComponent: React.FC<NodeComponentProps> = ({ 
  node, 
  isSelected, 
  onClick, 
  onMouseDown,
  onStartConnect
}) => {
  const styles = useMemo(() => {
    switch (node.type) {
      case NodeType.CONCEPT: 
        return { 
          gradient: 'from-indigo-500 to-blue-600', 
          border: '#6366f1', 
          glow: 'rgba(99, 102, 241, 0.4)' 
        };
      case NodeType.ACTION: 
        return { 
          gradient: 'from-emerald-500 to-teal-600', 
          border: '#10b981', 
          glow: 'rgba(16, 185, 129, 0.4)' 
        };
      case NodeType.OUTCOME: 
        return { 
          gradient: 'from-amber-500 to-orange-600', 
          border: '#f59e0b', 
          glow: 'rgba(245, 158, 11, 0.4)' 
        };
      case NodeType.PROBLEM: 
        return { 
          gradient: 'from-rose-500 to-pink-600', 
          border: '#f43f5e', 
          glow: 'rgba(244, 63, 94, 0.4)' 
        };
      case NodeType.SOLUTION: 
        return { 
          gradient: 'from-violet-500 to-purple-600', 
          border: '#8b5cf6', 
          glow: 'rgba(139, 92, 246, 0.4)' 
        };
      default: 
        return { 
          gradient: 'from-slate-500 to-slate-600', 
          border: '#64748b', 
          glow: 'rgba(100, 116, 139, 0.4)' 
        };
    }
  }, [node.type]);

  const dynamicVars = {
    '--node-border-color': styles.border,
    '--node-glow-color': styles.glow,
  } as React.CSSProperties;

  return (
    <div
      data-node-id={node.id}
      onClick={(e) => {
        e.stopPropagation();
        onClick(node.id);
      }}
      onMouseDown={onMouseDown}
      className={`absolute cursor-grab select-none transform -translate-x-1/2 -translate-y-1/2
        w-44 h-28 rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-4 flex flex-col items-center justify-center text-center
        node-container group active:cursor-grabbing
        ${isSelected ? 'node-active scale-110 z-30 selected-pulse' : 'node-glow hover:border-slate-500 hover:scale-105 z-10'}
      `}
      style={{ 
        left: node.x, 
        top: node.y,
        ...dynamicVars
      }}
    >
      {/* Connection Handle (Right Side) */}
      <div 
        onMouseDown={onStartConnect}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-600 hover:border-indigo-500 hover:bg-indigo-600/20 cursor-crosshair flex items-center justify-center group/handle transition-all z-40"
        title="Drag to connect"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover/handle:bg-indigo-400" />
      </div>

      <div 
        className={`absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-gradient-to-r ${styles.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} 
      />
      
      <div className="relative mb-3">
        <div className={`w-10 h-1.5 rounded-full bg-gradient-to-r ${styles.gradient} shadow-sm z-10 relative`} />
        {isSelected && (
          <div className={`absolute inset-0 w-10 h-1.5 rounded-full bg-gradient-to-r ${styles.gradient} type-bloom animate-pulse`} />
        )}
      </div>

      <h3 className={`text-xs font-bold uppercase tracking-wider line-clamp-2 leading-tight transition-colors duration-300 ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
        {node.label}
      </h3>
      
      <div className="flex items-center gap-1.5 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] text-slate-400 font-mono tracking-tighter uppercase">
          {node.type}
        </span>
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
        </div>
      )}
    </div>
  );
};

export default NodeComponent;
