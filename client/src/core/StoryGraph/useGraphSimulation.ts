import { useState, useEffect, useRef } from "react";
import type { GraphNode, GraphEdge } from "./types";
import { runPhysicsIteration, getDistance } from "./physics";

export function useGraphSimulation(
  initialNodes: GraphNode[],
  initialEdges: GraphEdge[],
  width: number,
  height: number
) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  
  // Simulation loop tracking
  const simulationRef = useRef<number | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  
  // Transform camera tracking
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Dragging and Pinch tracking
  const draggingNodeId = useRef<string | null>(null);
  const pointerStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanning = useRef<boolean>(false);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1.0);

  // Sync state reference to avoid stale closures in frame loops
  useEffect(() => {
    // Keep reference coordinates but seed initial positions randomly around center if x=0
    const seeded = initialNodes.map(n => {
      const match = nodesRef.current.find(old => old.id === n.id);
      if (match) return { ...n, x: match.x, y: match.y, vx: match.vx, vy: match.vy };
      return {
        ...n,
        x: n.x || width / 2 + (Math.random() - 0.5) * 150,
        y: n.y || height / 2 + (Math.random() - 0.5) * 150,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null
      };
    });
    
    nodesRef.current = seeded;
    edgesRef.current = initialEdges;
    setNodes(seeded);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  // Physics animation tick
  useEffect(() => {
    let alpha = 1.0;
    const tick = () => {
      if (nodesRef.current.length === 0) return;
      
      runPhysicsIteration(nodesRef.current, edgesRef.current, width, height, alpha);
      setNodes([...nodesRef.current]);

      // Cooling down parameter to let graph settle
      if (alpha > 0.05) {
        alpha *= 0.985;
        simulationRef.current = requestAnimationFrame(tick);
      } else {
        simulationRef.current = null;
      }
    };

    simulationRef.current = requestAnimationFrame(tick);
    return () => {
      if (simulationRef.current) cancelAnimationFrame(simulationRef.current);
    };
  }, [initialNodes]); // Re-simulate when input nodes load

  // Wake up physics on interaction
  const wakeSimulation = () => {
    if (!simulationRef.current) {
      let alpha = 0.6;
      const tick = () => {
        runPhysicsIteration(nodesRef.current, edgesRef.current, width, height, alpha);
        setNodes([...nodesRef.current]);
        if (alpha > 0.05) {
          alpha *= 0.975;
          simulationRef.current = requestAnimationFrame(tick);
        } else {
          simulationRef.current = null;
        }
      };
      simulationRef.current = requestAnimationFrame(tick);
    }
  };

  // Convert client coordinates to graph coordinate space
  const getGraphCoords = (clientX: number, clientY: number, containerRect: DOMRect) => {
    const rx = clientX - containerRect.left;
    const ry = clientY - containerRect.top;
    return {
      x: (rx - pan.x) / zoom,
      y: (ry - pan.y) / zoom
    };
  };

  // Event handlers
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, containerRect: DOMRect) => {
    const isTouch = "touches" in e;
    
    // 1. Pinch gesture check
    if (isTouch && e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = getDistance(t1.clientX, t1.clientY, t2.clientX, t2.clientY);
      pinchStartDist.current = dist;
      pinchStartZoom.current = zoom;
      isPanning.current = false;
      draggingNodeId.current = null;
      return;
    }

    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    const coords = getGraphCoords(clientX, clientY, containerRect);

    // 2. Node Dragging hit-test
    const hit = nodesRef.current.find(n => getDistance(n.x, n.y, coords.x, coords.y) < 32);
    if (hit) {
      draggingNodeId.current = hit.id;
      hit.fx = coords.x;
      hit.fy = coords.y;
      pointerStart.current = { x: clientX, y: clientY };
      wakeSimulation();
    } else {
      // 3. Panning start
      isPanning.current = true;
      pointerStart.current = { x: clientX, y: clientY };
      panStart.current = { ...pan };
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent, containerRect: DOMRect) => {
    const isTouch = "touches" in e;

    // 1. Pinch zoom logic
    if (isTouch && e.touches.length === 2 && pinchStartDist.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = getDistance(t1.clientX, t1.clientY, t2.clientX, t2.clientY);
      const ratio = dist / pinchStartDist.current;
      // Clamp zoom between 0.3x and 3.0x
      setZoom(Math.max(0.3, Math.min(3.0, pinchStartZoom.current * ratio)));
      return;
    }

    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    if (draggingNodeId.current) {
      const coords = getGraphCoords(clientX, clientY, containerRect);
      const hit = nodesRef.current.find(n => n.id === draggingNodeId.current);
      if (hit) {
        hit.fx = coords.x;
        hit.fy = coords.y;
        wakeSimulation();
      }
    } else if (isPanning.current) {
      const dx = clientX - pointerStart.current.x;
      const dy = clientY - pointerStart.current.y;
      setPan({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy
      });
    }
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent, _containerRect?: DOMRect) => {
    const isTouch = "touches" in e;
    
    if (draggingNodeId.current) {
      const hit = nodesRef.current.find(n => n.id === draggingNodeId.current);
      if (hit) {
        hit.fx = null;
        hit.fy = null;
      }
      
      // Select node on simple tap (small pointer drag distance)
      const clientX = isTouch ? e.changedTouches[0].clientX : e.clientX;
      const clientY = isTouch ? e.changedTouches[0].clientY : e.clientY;
      const dragDist = getDistance(clientX, clientY, pointerStart.current.x, pointerStart.current.y);
      if (dragDist < 6) {
        setSelectedNodeId(draggingNodeId.current);
      }
      
      draggingNodeId.current = null;
    }
    
    isPanning.current = false;
    pinchStartDist.current = null;
  };

  const resetCamera = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setSelectedNodeId(null);
  };

  return {
    nodes,
    edges,
    zoom,
    setZoom,
    pan,
    setPan,
    selectedNodeId,
    setSelectedNodeId,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetCamera
  };
}
