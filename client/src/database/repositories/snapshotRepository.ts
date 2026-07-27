import { db } from "../db";

export interface ProjectSnapshot {
  id: string;
  projectId: string;
  projectName: string;
  created: number;
  timestamp: string;
  summary: string;
  version: number;
  data: {
    project: any;
    chapters: any[];
    scenes: any[];
    entities: any[];
    graphNodes?: any[];
    graphEdges?: any[];
  };
}

export class SnapshotRepository {
  /**
   * Create a full project snapshot into IndexedDB & localStorage
   */
  public static async createSnapshot(projectId: string, projectName: string, summary: string = "Manual Checkpoint"): Promise<ProjectSnapshot> {
    const project = await db.projects.get(projectId);
    const chapters = await db.chapters.where("projectId").equals(projectId).toArray();
    const scenes = await db.scenes.where("projectId").equals(projectId).toArray();
    const entities = await db.storyEntities.where("projectId").equals(projectId).toArray();

    const now = Date.now();
    const snapshot: ProjectSnapshot = {
      id: `snap_${now}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      projectName,
      created: now,
      timestamp: new Date(now).toISOString(),
      summary,
      version: 1,
      data: {
        project,
        chapters,
        scenes,
        entities
      }
    };

    // Save into localStorage snapshots store
    const localSnaps = JSON.parse(localStorage.getItem(`aevorin_snapshots_${projectId}`) || "[]");
    localSnaps.unshift(snapshot);
    // Keep max 20 snapshots per project
    localStorage.setItem(`aevorin_snapshots_${projectId}`, JSON.stringify(localSnaps.slice(0, 20)));

    return snapshot;
  }

  /**
   * Get all snapshots for a project
   */
  public static getSnapshots(projectId: string): ProjectSnapshot[] {
    try {
      return JSON.parse(localStorage.getItem(`aevorin_snapshots_${projectId}`) || "[]");
    } catch (e) {
      return [];
    }
  }

  /**
   * Export snapshot as downloadable .aevorin JSON bundle
   */
  public static exportSnapshotFile(snapshot: ProjectSnapshot) {
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snapshot.projectName.toLowerCase().replace(/\s+/g, "_")}_snapshot_${Date.now()}.aevorin`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Restore a project state from a snapshot object
   */
  public static async restoreSnapshot(snapshot: ProjectSnapshot): Promise<boolean> {
    if (!snapshot || !snapshot.data) return false;

    const { projectId, data } = snapshot;

    // Purge existing project records
    await db.chapters.where("projectId").equals(projectId).delete();
    await db.scenes.where("projectId").equals(projectId).delete();
    await db.storyEntities.where("projectId").equals(projectId).delete();

    // Restore items
    if (data.chapters && data.chapters.length > 0) {
      await db.chapters.bulkPut(data.chapters);
    }
    if (data.scenes && data.scenes.length > 0) {
      await db.scenes.bulkPut(data.scenes);
    }
    if (data.entities && data.entities.length > 0) {
      await db.storyEntities.bulkPut(data.entities);
    }

    return true;
  }
}
