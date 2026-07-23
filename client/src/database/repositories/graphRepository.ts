import { db } from "../db";
import type { GraphNode, GraphEdge } from "../schema";
import { DeviceIdentityManager } from "../../sync/DeviceIdentity";

export class GraphRepository {
  public static async getGraphData(projectId: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const nodes = await db.graphNodes
      .where("projectId")
      .equals(projectId)
      .filter((n) => !n.deletedAt)
      .toArray();

    const edges = await db.graphEdges
      .where("projectId")
      .equals(projectId)
      .filter((e) => !e.deletedAt)
      .toArray();

    return { nodes, edges };
  }

  public static async saveNodePosition(
    projectId: string,
    entityId: string,
    x: number,
    y: number
  ): Promise<GraphNode> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const id = `node_${entityId}`;

    const existing = await db.graphNodes.get(id);

    const node: GraphNode = {
      id,
      projectId,
      entityId,
      label: existing ? existing.label : "Entity Node",
      type: existing ? existing.type : "character",
      importance: existing ? existing.importance : 50,
      x,
      y,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      version: existing ? existing.version + 1 : 1,
      syncStatus: "pending",
      deviceId
    };

    await db.graphNodes.put(node);
    return node;
  }
}
