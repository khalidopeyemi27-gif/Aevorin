import { db, type LocalProject, type LocalChapter, type LocalScene, type LocalEntity, type LocalRelationship, type LocalGraphNode, type LocalGraphEdge, type LocalTimelineEvent } from "../../lib/db";
import { NetworkMonitor } from "./NetworkMonitor";
import { QueueProcessor } from "./QueueProcessor";

class SyncManagerService {
  constructor() {
    NetworkMonitor.subscribe((isOnline) => {
      if (isOnline) {
        QueueProcessor.processQueue();
      }
    });
  }

  // --- Project CRUD (Local-First) ---
  public async getProjects(): Promise<LocalProject[]> {
    return await db.projects.orderBy("updatedAt").reverse().toArray();
  }

  public async saveProject(project: Omit<LocalProject, "updatedAt" | "version" | "syncStatus"> & Partial<LocalProject>): Promise<LocalProject> {
    const now = new Date().toISOString();
    const fullProject: LocalProject = {
      ...project,
      updatedAt: now,
      version: (project.version || 0) + 1,
      syncStatus: NetworkMonitor.getStatus() ? "synced" : "pending"
    };

    await db.projects.put(fullProject);

    // Queue for background sync
    await db.syncQueue.add({
      opId: `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      resourceType: "PROJECT",
      resourceId: fullProject.name,
      action: project.version ? "UPDATE" : "CREATE",
      payload: JSON.stringify(fullProject),
      timestamp: now
    });

    QueueProcessor.processQueue();
    return fullProject;
  }

  public async deleteProject(name: string): Promise<void> {
    const now = new Date().toISOString();
    const project = await db.projects.where("name").equals(name).first();
    if (project) {
      await db.projects.delete(project.id);
    }

    await db.syncQueue.add({
      opId: `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      resourceType: "PROJECT",
      resourceId: name,
      action: "DELETE",
      payload: JSON.stringify({ name }),
      timestamp: now
    });

    QueueProcessor.processQueue();
  }

  // --- Chapter CRUD ---
  public async getChapters(projectId: string): Promise<LocalChapter[]> {
    return await db.chapters.where("projectId").equals(projectId).sortBy("orderIndex");
  }

  public async saveChapter(chapter: Omit<LocalChapter, "updatedAt" | "version" | "syncStatus"> & Partial<LocalChapter>): Promise<LocalChapter> {
    const now = new Date().toISOString();
    const fullChapter: LocalChapter = {
      ...chapter,
      updatedAt: now,
      version: (chapter.version || 0) + 1,
      syncStatus: NetworkMonitor.getStatus() ? "synced" : "pending"
    };

    await db.chapters.put(fullChapter);

    await db.syncQueue.add({
      opId: `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      resourceType: "CHAPTER",
      resourceId: fullChapter.id,
      action: chapter.version ? "UPDATE" : "CREATE",
      payload: JSON.stringify(fullChapter),
      timestamp: now
    });

    QueueProcessor.processQueue();
    return fullChapter;
  }

  // --- Scene CRUD ---
  public async getScenes(projectId: string): Promise<LocalScene[]> {
    return await db.scenes.where("projectId").equals(projectId).sortBy("orderIndex");
  }

  public async saveScene(scene: Omit<LocalScene, "updatedAt" | "version" | "syncStatus"> & Partial<LocalScene>): Promise<LocalScene> {
    const now = new Date().toISOString();
    const fullScene: LocalScene = {
      ...scene,
      updatedAt: now,
      version: (scene.version || 0) + 1,
      syncStatus: NetworkMonitor.getStatus() ? "synced" : "pending"
    };

    await db.scenes.put(fullScene);

    await db.syncQueue.add({
      opId: `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      resourceType: "SCENE",
      resourceId: fullScene.id,
      action: scene.version ? "UPDATE" : "CREATE",
      payload: JSON.stringify(fullScene),
      timestamp: now
    });

    QueueProcessor.processQueue();
    return fullScene;
  }

  // --- Entity CRUD ---
  public async getEntities(projectId: string): Promise<LocalEntity[]> {
    return await db.storyEntities.where("projectId").equals(projectId).toArray();
  }

  public async saveEntity(entity: Omit<LocalEntity, "updatedAt" | "version" | "syncStatus"> & Partial<LocalEntity>): Promise<LocalEntity> {
    const now = new Date().toISOString();
    const fullEntity: LocalEntity = {
      ...entity,
      updatedAt: now,
      version: (entity.version || 0) + 1,
      syncStatus: NetworkMonitor.getStatus() ? "synced" : "pending"
    };

    await db.storyEntities.put(fullEntity);

    await db.syncQueue.add({
      opId: `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      resourceType: "ENTITY",
      resourceId: fullEntity.id,
      action: entity.version ? "UPDATE" : "CREATE",
      payload: JSON.stringify(fullEntity),
      timestamp: now
    });

    QueueProcessor.processQueue();
    return fullEntity;
  }
}

export const SyncManager = new SyncManagerService();
