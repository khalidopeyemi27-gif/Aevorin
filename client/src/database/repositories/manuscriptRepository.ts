import { db } from "../db";
import type { Chapter, Scene, Draft, DraftRecovery } from "../schema";
import { DeviceIdentityManager } from "../../sync/DeviceIdentity";

export class ManuscriptRepository {
  // --- Chapter Operations ---
  public static async getChapters(projectId: string): Promise<Chapter[]> {
    return await db.chapters
      .where("projectId")
      .equals(projectId)
      .filter((c) => !c.deletedAt)
      .sortBy("orderIndex");
  }

  public static async createChapter(projectId: string, title: string, orderIndex?: number): Promise<Chapter> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const id = `chap_${now}`;

    const chapter: Chapter = {
      id,
      projectId,
      title,
      orderIndex: orderIndex || 1,
      actIndex: 1,
      createdAt: now,
      updatedAt: now,
      version: 1,
      syncStatus: "pending",
      deviceId
    };

    await db.chapters.put(chapter);

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "CHAPTER",
      entityId: id,
      action: "create",
      payload: JSON.stringify(chapter),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    return chapter;
  }

  // --- Scene Operations (Metadata Only) ---
  public static async getScenes(projectId: string): Promise<Scene[]> {
    return await db.scenes
      .where("projectId")
      .equals(projectId)
      .filter((s) => !s.deletedAt)
      .sortBy("orderIndex");
  }

  public static async createScene(projectId: string, chapterId: string, title: string): Promise<Scene> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const id = `scene_${now}`;

    const scene: Scene = {
      id,
      projectId,
      chapterId,
      title,
      wordCount: 0,
      orderIndex: 1,
      createdAt: now,
      updatedAt: now,
      version: 1,
      syncStatus: "pending",
      deviceId
    };

    await db.scenes.put(scene);

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "SCENE",
      entityId: id,
      action: "create",
      payload: JSON.stringify(scene),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    return scene;
  }

  // --- Draft Operations (Content Storage & Hashing) ---
  public static async getDraft(sceneId: string): Promise<Draft | undefined> {
    return await db.drafts.where("sceneId").equals(sceneId).first();
  }

  public static async saveDraft(
    sceneId: string,
    contentDelta: string,
    contentHTML: string,
    wordCount: number
  ): Promise<{ draft: Draft; changed: boolean }> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const id = `draft_${sceneId}`;

    const contentHash = contentDelta.length.toString(); // Fast hash fallback or SHA256 string
    const existing = await db.drafts.where("sceneId").equals(sceneId).first();

    if (existing && existing.contentHash === contentHash) {
      return { draft: existing, changed: false }; // Skip unnecessary write
    }

    const draft: Draft = {
      id,
      sceneId,
      contentDelta,
      contentHTML,
      contentHash,
      wordCount,
      baseVersion: existing ? existing.version : 1,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      version: existing ? existing.version + 1 : 1,
      syncStatus: "pending",
      deviceId
    };

    await db.drafts.put(draft);

    // Update scene word count metadata
    await db.scenes.update(sceneId, { wordCount, updatedAt: now });

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "DRAFT",
      entityId: id,
      action: existing ? "update" : "create",
      payload: JSON.stringify(draft),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    return { draft, changed: true };
  }

  // --- Crash Recovery Operations ---
  public static async getRecoverySnapshot(sceneId: string): Promise<DraftRecovery | undefined> {
    return await db.draftRecovery.where("sceneId").equals(sceneId).first();
  }

  public static async saveRecoverySnapshot(
    sceneId: string,
    contentDelta: string,
    contentHash: string,
    reason: "browser_crash" | "manual_snapshot" = "browser_crash"
  ): Promise<DraftRecovery> {
    const id = `rec_${sceneId}`;
    const now = Date.now();

    const snapshot: DraftRecovery = {
      id,
      sceneId,
      contentDelta,
      contentHash,
      createdAt: now,
      reason
    };

    await db.draftRecovery.put(snapshot);
    return snapshot;
  }

  public static async clearRecoverySnapshot(sceneId: string): Promise<void> {
    await db.draftRecovery.delete(`rec_${sceneId}`);
  }
}
