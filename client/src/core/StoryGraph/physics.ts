import type { GraphNode, GraphEdge } from "./types";

export function runPhysicsIteration(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  alpha = 1.0
) {
  const k = 140; // Ideal spring length between connected elements
  const repForce = 1200; // Repelling force between adjacent nodes
  const attForce = 0.055; // Attract multiplier for edges
  const centerForce = 0.015; // Centripetal gravity to avoid floating away

  const cx = width / 2;
  const cy = height / 2;

  // 1. Coulomb's Law Repulsion
  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    if (nodeA.fx !== null && nodeA.fy !== null) continue;

    // Node A's mass/importance scalar
    const massA = (nodeA.importance || 50) / 50; 

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const nodeB = nodes[j];

      const massB = (nodeB.importance || 50) / 50;

      let dx = nodeA.x - nodeB.x;
      let dy = nodeA.y - nodeB.y;

      if (dx === 0 && dy === 0) {
        dx = Math.random() - 0.5;
        dy = Math.random() - 0.5;
      }

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 450 * massA * massB) {
        const force = (repForce * massA * massB / Math.max(15, dist)) * alpha;
        // Lighter nodes get pushed more easily
        const accelerationA = force / massA; 
        nodeA.vx += (dx / Math.max(1, dist)) * accelerationA;
        nodeA.vy += (dy / Math.max(1, dist)) * accelerationA;
      }
    }
  }

  // 2. Hooke's Law Edge Attraction
  for (const edge of edges) {
    const s = nodes.find(n => n.id === edge.source);
    const t = nodes.find(n => n.id === edge.target);

    if (!s || !t) continue;

    const dx = t.x - s.x;
    const dy = t.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const force = (dist - k) * attForce * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (s.fx === null) {
        s.vx += fx;
        s.vy += fy;
      }
      if (t.fx === null) {
        t.vx -= fx;
        t.vy -= fy;
      }
    }
  }

  // 3. Gravity Pull & Integration
  const damping = 0.82;
  for (const node of nodes) {
    if (node.fx !== null && node.fy !== null) {
      node.x = node.fx;
      node.y = node.fy;
      node.vx = 0;
      node.vy = 0;
      continue;
    }

    node.vx += (cx - node.x) * centerForce;
    node.vy += (cy - node.y) * centerForce;

    node.x += node.vx;
    node.y += node.vy;

    node.vx *= damping;
    node.vy *= damping;
  }
}
export function getDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
