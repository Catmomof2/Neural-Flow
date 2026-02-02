
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FlowData, Node, Edge, Group } from '../types';
import NodeComponent from './NodeComponent';

interface CanvasProps {
  data: FlowData | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedGroupIds: string[];
  multiSelectNodeIds: string[];
  onNodeSelect: (id: string | null, isMulti: boolean) => void;
  onEdgeSelect: (id: string | null) => void;
  onGroupSelect: (id: string) => void;
  onNodeMove: (id: string, x: number, y: number) => void;
  onNodeMoveStart?: () => void;
  onAddEdge: (fromId: string, toId: string) => void;
  onUpdateGroup: (group: Group) => void;
}

const GRID_SIZE = 20;

const Canvas: React.FC<CanvasProps> = ({ 
  data, 
  selectedNodeId, 
  selectedEdgeId,
  selectedGroupIds,
  multiSelectNodeIds,
  onNodeSelect, 
  onEdgeSelect,
  onGroupSelect,
  onNodeMove,
  onNodeMoveStart,
  onAddEdge,
  onUpdateGroup
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [dragState, setDragState] = useState<{
    nodeId: string;
    startX: number;
    startY: number;
    initialNodeX: number;
    initialNodeY: number;
  } | null>(null);

  const [connectState, setConnectState] = useState<{
    fromNodeId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Group boundary calculations
  const groupBounds = useMemo(() => {
    if (!data) return {};
    const bounds: Record<string, { minX: number; minY: number; maxX: number; maxY: number }> = {};
    
    data.groups.forEach(group => {
      const nodes = data.nodes.filter(n => group.nodeIds.includes(n.id));
      if (nodes.length === 0) return;
      
      bounds[group.id] = nodes.reduce((acc, node) => ({
        minX: Math.min(acc.minX, node.x - 110),
        minY: Math.min(acc.minY, node.y - 80),
        maxX: Math.max(acc.maxX, node.x + 110),
        maxY: Math.max(acc.maxY, node.y + 80),
      }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    });
    
    return bounds;
  }, [data]);

  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    const node = data?.nodes.find(n => n.id === nodeId);
    if (!node) return;

    e.stopPropagation();
    onNodeSelect(nodeId, e.shiftKey);

    if (!e.shiftKey && onNodeMoveStart) onNodeMoveStart();

    setDragState({
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      initialNodeX: node.x,
      initialNodeY: node.y
    });
  };

  const handleStartConnect = (nodeId: string, e: React.MouseEvent) => {
    const node = data?.nodes.find(n => n.id === nodeId);
    if (!node) return;
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setConnectState({ fromNodeId: nodeId, startX: node.x, startY: node.y, currentX: node.x, currentY: node.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (dragState) {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      let newX = Math.round((dragState.initialNodeX + dx) / GRID_SIZE) * GRID_SIZE;
      let newY = Math.round((dragState.initialNodeY + dy) / GRID_SIZE) * GRID_SIZE;
      onNodeMove(dragState.nodeId, newX, newY);
    }

    if (connectState) {
      setConnectState({ ...connectState, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (connectState) {
      const target = (e.target as HTMLElement).closest('.node-container');
      if (target) {
        const toNodeId = target.getAttribute('data-node-id');
        if (toNodeId && toNodeId !== connectState.fromNodeId) onAddEdge(connectState.fromNodeId, toNodeId);
      }
    }
    setDragState(null);
    setConnectState(null);
  };

  if (!data) return (
    <div className="flex-1 flex items-center justify-center text-slate-500 font-light italic">
      Start your neural journey by describing a system...
    </div>
  );

  const getEdgePoints = (edge: Edge) => {
    const fromNode = data.nodes.find(n => n.id === edge.from);
    const toNode = data.nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return null;

    // Check if either node is in a collapsed group
    const fromGroup = data.groups.find(g => g.nodeIds.includes(fromNode.id) && g.isCollapsed);
    const toGroup = data.groups.find(g => g.nodeIds.includes(toNode.id) && g.isCollapsed);

    // If both nodes are in the same collapsed group, don't render the edge
    if (fromGroup && toGroup && fromGroup.id === toGroup.id) return null;

    // Adjust points to group center if collapsed
    const getPos = (node: Node, group?: Group) => {
      if (group && groupBounds[group.id]) {
        const b = groupBounds[group.id];
        return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
      }
      return { x: node.x, y: node.y };
    };

    const p1 = getPos(fromNode, fromGroup);
    const p2 = getPos(toNode, toGroup);

    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  };

  return (
    <div 
      ref={canvasRef}
      className="relative flex-1 overflow-hidden neural-grid"
      onClick={() => onNodeSelect(null, false)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
          </marker>
          <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
          </marker>
        </defs>

        {/* Groups */}
        {data.groups.map(group => {
          const b = groupBounds[group.id];
          if (!b) return null;
          const isSelected = selectedGroupIds.includes(group.id);
          return (
            <g key={group.id} onClick={(e) => { e.stopPropagation(); onGroupSelect(group.id); }} className="cursor-pointer pointer-events-auto">
              <rect 
                x={b.minX} y={b.minY} width={b.maxX - b.minX} height={b.maxY - b.minY}
                rx="24" fill={group.color} fillOpacity={isSelected ? 0.08 : 0.04}
                stroke={group.color} strokeWidth={isSelected ? 2 : 1} strokeDasharray={group.isCollapsed ? "5,5" : "0"}
                className="transition-all duration-300"
              />
              <text x={b.minX + 20} y={b.minY + 30} fill={group.color} className="text-[10px] font-black uppercase tracking-widest pointer-events-none">
                {group.label} {group.isCollapsed && `(${group.nodeIds.length} Nodes)`}
              </text>
            </g>
          );
        })}

        {/* Preview Edge */}
        {connectState && (
          <line x1={connectState.startX} y1={connectState.startY} x2={connectState.currentX} y2={connectState.currentY} stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5" />
        )}

        {/* Connections */}
        {data.edges.map(edge => {
          const points = getEdgePoints(edge);
          if (!points) return null;
          const isSelected = selectedEdgeId === edge.id;
          const isHighlighted = isSelected || edge.from === selectedNodeId || edge.to === selectedNodeId;
          
          return (
            <g key={edge.id} className="cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); onEdgeSelect(edge.id); }}>
              <path d={`M ${points.x1} ${points.y1} L ${points.x2} ${points.y2}`} stroke={isHighlighted ? "#6366f1" : "#334155"} strokeWidth={isHighlighted ? "3" : "1.5"} fill="none" markerEnd={isHighlighted ? "url(#arrowhead-active)" : "url(#arrowhead)"} className={isHighlighted ? "path-animated" : ""} />
              <path d={`M ${points.x1} ${points.y1} L ${points.x2} ${points.y2}`} stroke="transparent" strokeWidth="20" fill="none" />
              {edge.label && (
                <g>
                  <rect x={(points.x1 + points.x2) / 2 - 40} y={(points.y1 + points.y2) / 2 - 15} width="80" height="20" rx="4" fill="#0f172a" className="opacity-80" />
                  <text x={(points.x1 + points.x2) / 2} y={(points.y1 + points.y2) / 2} fill={isHighlighted ? "#a5b4fc" : "#94a3b8"} fontSize="9" textAnchor="middle" alignmentBaseline="middle" className="select-none font-bold">
                    {edge.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {data.nodes.map(node => {
        const group = data.groups.find(g => g.nodeIds.includes(node.id));
        if (group?.isCollapsed) return null; // Hide nodes in collapsed groups

        return (
          <NodeComponent 
            key={node.id} node={node} 
            isSelected={selectedNodeId === node.id || multiSelectNodeIds.includes(node.id)}
            onClick={(id) => onNodeSelect(id, false)}
            onMouseDown={(e) => handleMouseDown(node.id, e)}
            onStartConnect={(e) => handleStartConnect(node.id, e)}
          />
        );
      })}

      <div className="absolute top-8 left-8 pointer-events-none">
        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 uppercase tracking-tighter italic">
          {data.title}
        </h1>
        <p className="text-sm text-slate-500 max-w-sm mt-1">{data.summary}</p>
      </div>
    </div>
  );
};

export default Canvas;
