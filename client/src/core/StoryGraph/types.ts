export interface GraphNode {
  id: string;
  label: string;
  type: "character" | "chapter" | "thread" | "location";
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
  importance: number;
}

export interface GraphEdge {
  id: string;
  source: string; // node ID
  target: string; // node ID
  type: "leads_to" | "appears_in" | "relationship" | "reveals" | "mentions" | "relationship_change";
  importance: number;
}
