import React, { useState, useEffect, useRef } from "react";
import { apiUrl } from "../../lib/api";
import { useStoryRoom } from "../StoryRoom/StoryRoomContext";
import { useGraphSimulation } from "./useGraphSimulation";
import type { GraphNode, GraphEdge } from "./types";

interface StoryGraphProps {
  projectId: string;
}

export default function StoryGraph({ projectId }: StoryGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Shared Story Room states
  const {
    focusStack,
    pushFocus,
    clearFocus,
    setGraphZoom,
    graphDepth,
    setGraphDepth
  } = useStoryRoom();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rawNodes, setRawNodes] = useState<any[]>([]);
  const [rawEdges, setRawEdges] = useState<any[]>([]);
  
  // Size tracking
  const [dims, setDims] = useState({ width: 600, height: 400 });

  // Update container dimensions
  useEffect(() => {
    if (containerRef.current) {
      setDims({
        width: containerRef.current.clientWidth || 600,
        height: containerRef.current.clientHeight || 450
      });
    }
  }, [loading]);

  // Fetch node and edge datasets on mount
  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch(apiUrl(`/api/projects/${projectId}/canon/graph/data`))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load graph data");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setRawNodes(Array.isArray(data?.nodes) ? data.nodes : []);
        setRawEdges(Array.isArray(data?.edges) ? data.edges : []);
        setLoading(false);
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  const safeNodes = Array.isArray(rawNodes) ? rawNodes : [];
  const safeEdges = Array.isArray(rawEdges) ? rawEdges : [];

  // Resolve active entity focus from the top of the stack
  const activeFocus = focusStack.length > 0 ? focusStack[focusStack.length - 1] : null;

  // Filter graph to only show nodes within degrees of separation (radial depth) from activeFocus
  const filteredData = React.useMemo(() => {
    if (safeNodes.length === 0) return { nodes: [], edges: [] };

    // Find starting core node (focus node or fallback to highest importance character)
    let startNodeId = activeFocus?.id;
    if (!startNodeId) {
      const topChar = safeNodes
        .filter(n => n && n.entity_type === "character")
        .sort((a, b) => (b.importance || 0) - (a.importance || 0))[0];
      if (topChar) startNodeId = topChar.id;
    }

    if (!startNodeId) {
      // Return top 15 most important nodes if no core starting node is resolved
      const slicedNodes = rawNodes
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 15)
        .map(n => ({
          id: n.id,
          label: n.name,
          type: n.entity_type as any,
          importance: n.importance,
          x: dims.width / 2 + (Math.random() - 0.5) * 150,
          y: dims.height / 2 + (Math.random() - 0.5) * 150,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null
        }));
      
      const nodeIds = slicedNodes.map(n => n.id);
      const slicedEdges = rawEdges
        .filter(e => nodeIds.includes(e.source_id) && nodeIds.includes(e.target_id))
        .map(e => ({
          id: e.id,
          source: e.source_id,
          target: e.target_id,
          type: e.edge_type as any,
          importance: e.importance
        }));
        
      return { nodes: slicedNodes, edges: slicedEdges };
    }

    // BFS solver to find all nodes matching degrees of separation (depth)
    const visited = new Set<string>([startNodeId]);
    let currentFrontier = [startNodeId];

    for (let d = 0; d < graphDepth; d++) {
      const nextFrontier: string[] = [];
      for (const nodeId of currentFrontier) {
        // Collect matching connected node IDs
        rawEdges.forEach(edge => {
          if (edge.source_id === nodeId && !visited.has(edge.target_id)) {
            visited.add(edge.target_id);
            nextFrontier.push(edge.target_id);
          } else if (edge.target_id === nodeId && !visited.has(edge.source_id)) {
            visited.add(edge.source_id);
            nextFrontier.push(edge.source_id);
          }
        });
      }
      currentFrontier = nextFrontier;
    }

    // Keep only visited nodes
    const finalNodes: GraphNode[] = rawNodes
      .filter(n => visited.has(n.id))
      .map(n => ({
        id: n.id,
        label: n.name,
        type: n.entity_type as any,
        importance: n.importance,
        x: dims.width / 2 + (Math.random() - 0.5) * 100,
        y: dims.height / 2 + (Math.random() - 0.5) * 100,
        vx: 0,
        vy: 0,
        fx: n.id === startNodeId ? dims.width / 2 : null, // Pin the core node at center
        fy: n.id === startNodeId ? dims.height / 2 : null
      }));

    const finalNodeIds = finalNodes.map(n => n.id);
    const finalEdges: GraphEdge[] = rawEdges
      .filter(e => finalNodeIds.includes(e.source_id) && finalNodeIds.includes(e.target_id))
      .map(e => ({
        id: e.id,
        source: e.source_id,
        target: e.target_id,
        type: e.edge_type as any,
        importance: e.importance
      }));

    return { nodes: finalNodes, edges: finalEdges };
  }, [rawNodes, rawEdges, activeFocus, graphDepth, dims.width, dims.height]);

  // Feed nodes/edges into simulation hook
  const {
    nodes,
    edges,
    zoom,
    pan,
    selectedNodeId,
    setSelectedNodeId,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetCamera
  } = useGraphSimulation(filteredData.nodes, filteredData.edges, dims.width, dims.height);

  // Synchronize zoom state to context
  useEffect(() => {
    setGraphZoom(zoom);
  }, [zoom]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "350px", color: "var(--text-secondary)" }}>
        <div className="spinner" style={{ width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#e08e6d", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p style={{ marginTop: "1rem", fontSize: "0.85rem" }}>Loading connections map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#f87171" }}>
        <p>⚠️ Error: {error}</p>
      </div>
    );
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Dynamic colors for node types
  const getNodeColor = (type: string) => {
    switch (type) {
      case "character": return "#e08e6d"; // Warm coral
      case "chapter": return "#9f8ad0"; // Indigo purple
      case "thread": return "#06b6d4"; // Cyber cyan
      case "location": return "#10b981"; // Emerald green
      default: return "#94a3b8";
    }
  };

  const getNodeEmoji = (type: string) => {
    switch (type) {
      case "character": return "👤";
      case "chapter": return "📖";
      case "thread": return "🕸️";
      case "location": return "📍";
      default: return "⚫";
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        height: "100%", 
        width: "100%", 
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0d0f17"
      }}
    >
      {/* Floating Toolbar Header */}
      <div 
        style={{ 
          position: "absolute", 
          top: "0.75rem", 
          left: "0.75rem", 
          right: "0.75rem", 
          zIndex: 50, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          pointerEvents: "none"
        }}
      >
        <div 
          style={{ 
            background: "rgba(20, 24, 40, 0.88)", 
            backdropFilter: "blur(8px)", 
            border: "1px solid rgba(255, 255, 255, 0.08)", 
            borderRadius: "10px", 
            padding: "0.4rem 0.8rem", 
            display: "flex", 
            alignItems: "center", 
            gap: "0.6rem",
            pointerEvents: "auto",
            boxShadow: "0 4px 15px rgba(0,0,0,0.4)"
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>FOCUS:</span>
          {activeFocus ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#e08e6d", fontWeight: "bold" }}>{activeFocus.name}</span>
              <button 
                onClick={() => clearFocus()}
                style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold", padding: "0 0.2rem" }}
              >
                ✕
              </button>
            </div>
          ) : (
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>Entire Story (Radial Root)</span>
          )}
        </div>

        {/* Depth / Zoom controller */}
        <div 
          style={{ 
            background: "rgba(20, 24, 40, 0.88)", 
            backdropFilter: "blur(8px)", 
            border: "1px solid rgba(255, 255, 255, 0.08)", 
            borderRadius: "10px", 
            padding: "0.4rem 0.8rem", 
            display: "flex", 
            alignItems: "center", 
            gap: "0.8rem",
            pointerEvents: "auto",
            boxShadow: "0 4px 15px rgba(0,0,0,0.4)"
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: "bold" }}>
            DEPTH:
            <select
              value={graphDepth}
              onChange={(e) => setGraphDepth(Number(e.target.value))}
              style={{ background: "#0d0f17", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.75rem", borderRadius: "4px", padding: "0.1rem 0.3rem" }}
            >
              <option value={1}>1 Degree</option>
              <option value={2}>2 Degrees</option>
              <option value={3}>3 Degrees</option>
            </select>
          </label>
          <button 
            onClick={resetCamera}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "0.72rem", padding: "0.2rem 0.5rem", cursor: "pointer", fontWeight: "bold" }}
          >
            ⟳ Reset View
          </button>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <svg
        style={{ width: "100%", height: "100%", cursor: "grab" }}
        onMouseDown={(e) => {
          if (containerRef.current) handlePointerDown(e, containerRef.current.getBoundingClientRect());
        }}
        onMouseMove={(e) => {
          if (containerRef.current) handlePointerMove(e, containerRef.current.getBoundingClientRect());
        }}
        onMouseUp={(e) => {
          if (containerRef.current) handlePointerUp(e, containerRef.current.getBoundingClientRect());
        }}
        onTouchStart={(e) => {
          if (containerRef.current) handlePointerDown(e, containerRef.current.getBoundingClientRect());
        }}
        onTouchMove={(e) => {
          if (containerRef.current) handlePointerMove(e, containerRef.current.getBoundingClientRect());
        }}
        onTouchEnd={(e) => {
          if (containerRef.current) handlePointerUp(e, containerRef.current.getBoundingClientRect());
        }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          
          {/* 1. Edges / Links */}
          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <line
                key={edge.id}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={
                  edge.type === "leads_to" ? "rgba(159, 138, 208, 0.4)" :
                  edge.type === "appears_in" ? "rgba(224, 142, 109, 0.25)" :
                  edge.type === "relationship" ? "rgba(239, 68, 68, 0.4)" :
                  edge.type === "reveals" ? "rgba(6, 182, 212, 0.4)" : "rgba(255, 255, 255, 0.15)"
                }
                strokeWidth={
                  edge.type === "relationship" ? 3 :
                  edge.type === "leads_to" ? 2.5 : 1.5
                }
                strokeDasharray={
                  edge.type === "mentions" ? "4,4" : undefined
                }
              />
            );
          })}

          {/* 2. Nodes */}
          {nodes.map((node) => {
            const isCenter = node.id === activeFocus?.id;
            const isSelected = node.id === selectedNodeId;
            const color = getNodeColor(node.type);

            return (
              <g 
                key={node.id} 
                className="anim-scale-in"
                transform={`translate(${node.x}, ${node.y})`}
                style={{ cursor: "pointer", touchAction: "none" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                  if (activeFocus?.id !== node.id) {
                    pushFocus({
                      id: node.id,
                      type: node.type,
                      name: node.label
                    });
                    setGraphDepth(2);
                  } else {
                    // Toggle depth if tapping the already focused center node
                    setGraphDepth(graphDepth === 1 ? 2 : 1);
                  }
                }}
              >
                {/* Node Ring outer boundary highlight */}
                {(isCenter || isSelected) && (
                  <circle
                    r={24}
                    fill="none"
                    stroke={isCenter ? "#e08e6d" : "#3b82f6"}
                    strokeWidth={2}
                    strokeDasharray="4,2"
                    style={{ animation: "spin 12s linear infinite" }}
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r={14 + ((node.importance || 50) / 100) * 12}
                  fill={color}
                  stroke="#0d0f17"
                  strokeWidth={2.5}
                  style={{
                    filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.5))"
                  }}
                />

                {/* Node Symbol Emojis */}
                <text
                  textAnchor="middle"
                  y={4 + ((node.importance || 50) / 100) * 2}
                  style={{
                    fontSize: `${0.5 + ((node.importance || 50) / 100) * 0.35}rem`,
                    userSelect: "none",
                    pointerEvents: "none"
                  }}
                >
                  {getNodeEmoji(node.type)}
                </text>

                {/* Label text */}
                <text
                  y={34}
                  textAnchor="middle"
                  style={{
                    fontSize: "0.72rem",
                    fill: isSelected ? "#60a5fa" : "#fff",
                    fontWeight: isCenter ? "bold" : 500,
                    userSelect: "none",
                    pointerEvents: "none",
                    filter: "drop-shadow(0px 1.5px 2px rgba(0,0,0,0.9))"
                  }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Touch Help overlay banner */}
      <div 
        style={{ 
          position: "absolute", 
          bottom: selectedNode ? "150px" : "10px", 
          left: "50%", 
          transform: "translateX(-50%)", 
          fontSize: "0.68rem", 
          color: "rgba(255,255,255,0.35)", 
          pointerEvents: "none", 
          textAlign: "center",
          whiteSpace: "nowrap",
          transition: "bottom 0.25s ease"
        }}
      >
        Gesture controls: Drag canvas to pan • Pinch to zoom • Tap node to select • Double tap to center focus
      </div>

      {/* Bottom Sheet Drawer for Selected Node inspector */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: selectedNode ? "145px" : 0,
          background: "rgba(20, 24, 40, 0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          transition: "height 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 100,
          padding: selectedNode ? "1rem 1.25rem" : 0,
          boxShadow: "0 -5px 20px rgba(0,0,0,0.5)",
          overflow: "hidden"
        }}
      >
        {selectedNode && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{getNodeEmoji(selectedNode.type)}</span>
                  <h4 style={{ margin: 0, color: "#fff", fontSize: "1.05rem", fontWeight: "bold" }}>{selectedNode.label}</h4>
                  <span style={{ fontSize: "0.62rem", textTransform: "uppercase", background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.4rem", borderRadius: "4px", color: "rgba(255,255,255,0.5)" }}>
                    {selectedNode.type}
                  </span>
                </div>
                <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
                  Importance rating: {selectedNode.importance} • Connected to {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} other story elements.
                </p>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "1.1rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", gap: "0.6rem", paddingBottom: "0.2rem" }}>
              <button
                onClick={() => {
                  pushFocus({
                    id: selectedNode.id,
                    type: selectedNode.type,
                    name: selectedNode.label
                  });
                }}
                style={{
                  background: "#e08e6d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  padding: "0.4rem 0.8rem",
                  cursor: "pointer"
                }}
              >
                🕸️ Center Radial Focus
              </button>
              <button
                onClick={() => {
                  // Direct select node in timeline/journey by pushing to focus
                  pushFocus({
                    id: selectedNode.id,
                    type: selectedNode.type,
                    name: selectedNode.label
                  });
                }}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  color: "#fff",
                  padding: "0.4rem 0.8rem",
                  cursor: "pointer"
                }}
              >
                ⏳ View Journey / Arcs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
