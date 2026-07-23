import { db } from "../database/db";
import type {
  Project,
  Chapter,
  Scene,
  Draft
} from "../database/schema";
import { DeviceIdentityManager } from "./DeviceIdentity";
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

  // --- Projects (Filter out soft-deleted projects) ---
  public async getProjects(): Promise<Project[]> {
    return await db.projects
      .filter((p) => !p.deletedAt)
      .reverse()
      .sortBy("updatedAt");
  }

  public async saveProject(
    project: Partial<Project> & { name: string; path: string }
  ): Promise<Project> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const id = project.id || `proj_${now}`;

    const fullProject: Project = {
      id,
      name: project.name,
      path: project.path,
      manifest: project.manifest || { created: new Date(now).toISOString(), writing_mode: "novel" },
      targetWordCount: project.targetWordCount,
      coverImage: project.coverImage,
      description: project.description,
      accentColor: project.accentColor,
      fontPair: project.fontPair,
      bookSeries: project.bookSeries,
      volume: project.volume,
      publisher: project.publisher,
      copyright: project.copyright,
      language: project.language,
      authorName: project.authorName,
      genre: project.genre,
      createdAt: project.createdAt || now,
      updatedAt: now,
      version: (project.version || 0) + 1,
      syncStatus: NetworkMonitor.getStatus() ? "synced" : "pending",
      deviceId
    };

    await db.projects.put(fullProject);

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "PROJECT",
      entityId: id,
      action: project.version ? "update" : "create",
      payload: JSON.stringify(fullProject),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    QueueProcessor.processQueue();
    return fullProject;
  }

  public async deleteProject(name: string): Promise<void> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const project = await db.projects.where("name").equals(name).first();

    if (project) {
      // Soft deletion locally
      await db.projects.update(project.id, {
        deletedAt: now,
        syncStatus: "pending"
      });
    }

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "PROJECT",
      entityId: name,
      action: "delete",
      payload: JSON.stringify({ name, deletedAt: now }),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    QueueProcessor.processQueue();
  }

  // --- Chapters ---
  public async getChapters(projectId: string): Promise<Chapter[]> {
    return await db.chapters
      .where("projectId")
      .equals(projectId)
      .filter((c) => !c.deletedAt)
      .sortBy("orderIndex");
  }

  public async saveChapter(chapter: Partial<Chapter> & { projectId: string; title: string }): Promise<Chapter> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const id = chapter.id || `chap_${now}`;

    const fullChapter: Chapter = {
      id,
      projectId: chapter.projectId,
      title: chapter.title,
      orderIndex: chapter.orderIndex || 1,
      actIndex: chapter.actIndex || 1,
      createdAt: chapter.createdAt || now,
      updatedAt: now,
      version: (chapter.version || 0) + 1,
      syncStatus: NetworkMonitor.getStatus() ? "synced" : "pending",
      deviceId
    };

    await db.chapters.put(fullChapter);

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "CHAPTER",
      entityId: id,
      action: chapter.version ? "update" : "create",
      payload: JSON.stringify(fullChapter),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    QueueProcessor.processQueue();
    return fullChapter;
  }

  // --- Scenes (Metadata) & Drafts (Content) ---
  public async getScenes(projectId: string): Promise<Scene[]> {
    return await db.scenes
      .where("projectId")
      .equals(projectId)
      .filter((s) => !s.deletedAt)
      .sortBy("orderIndex");
  }

  public async saveSceneMetadata(scene: Partial<Scene> & { projectId: string; chapterId: string; title: string }): Promise<Scene> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const id = scene.id || `scene_${now}`;

    const fullScene: Scene = {
      id,
      projectId: scene.projectId,
      chapterId: scene.chapterId,
      title: scene.title,
      wordCount: scene.wordCount || 0,
      orderIndex: scene.orderIndex || 1,
      createdAt: scene.createdAt || now,
      updatedAt: now,
      version: (scene.version || 0) + 1,
      syncStatus: NetworkMonitor.getStatus() ? "synced" : "pending",
      deviceId
    };

    await db.scenes.put(fullScene);

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "SCENE",
      entityId: id,
      action: scene.version ? "update" : "create",
      payload: JSON.stringify(fullScene),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    QueueProcessor.processQueue();
    return fullScene;
  }

  public async saveDraft(draft: Partial<Draft> & { sceneId: string; contentDelta: string; contentHTML: string }): Promise<Draft> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const id = draft.id || `draft_${draft.sceneId}`;

    const fullDraft: Draft = {
      id,
      sceneId: draft.sceneId,
      contentDelta: draft.contentDelta,
      contentHTML: draft.contentHTML,
      contentHash: draft.contentHash || draft.contentDelta.length.toString(),
      wordCount: draft.wordCount || 0,
      baseVersion: draft.baseVersion || 1,
      createdAt: draft.createdAt || now,
      updatedAt: now,
      version: (draft.version || 0) + 1,
      syncStatus: NetworkMonitor.getStatus() ? "synced" : "pending",
      deviceId
    };

    await db.drafts.put(fullDraft);
    return fullDraft;
  }

  public async getDraft(sceneId: string): Promise<Draft | undefined> {
    return await db.drafts.where("sceneId").equals(sceneId).first();
  }
}

export const SyncManager = new SyncManagerService();
