import { db } from "../db";
import type { StoryEntity, EntityRelationship } from "../schema";
import { DeviceIdentityManager } from "../../sync/DeviceIdentity";

export class EntityRepository {
  public static async getEntities(projectId: string, type?: string): Promise<StoryEntity[]> {
    const query = db.storyEntities
      .where("projectId")
      .equals(projectId)
      .filter((e) => !e.deletedAt);

    const results = await query.toArray();
    if (type && type !== "OVERVIEW") {
      return results.filter((e) => e.type.toUpperCase() === type.toUpperCase());
    }
    return results;
  }

  public static async createEntity(data: {
    projectId: string;
    type: string;
    title: string;
    summary: string;
    imagePath?: string;
    metadataJson?: string;
  }): Promise<StoryEntity> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const id = `ent_${now}`;

    const entity: StoryEntity = {
      id,
      projectId: data.projectId,
      type: data.type,
      title: data.title,
      summary: data.summary,
      imagePath: data.imagePath,
      metadataJson: data.metadataJson,
      createdAt: now,
      updatedAt: now,
      version: 1,
      syncStatus: "pending",
      deviceId
    };

    await db.storyEntities.put(entity);

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "ENTITY",
      entityId: id,
      action: "create",
      payload: JSON.stringify(entity),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    return entity;
  }

  public static async updateEntity(
    id: string,
    updates: Partial<Omit<StoryEntity, "id" | "projectId" | "createdAt">>
  ): Promise<StoryEntity | undefined> {
    const existing = await db.storyEntities.get(id);
    if (!existing || existing.deletedAt) return undefined;

    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();

    const updated: StoryEntity = {
      ...existing,
      ...updates,
      updatedAt: now,
      version: (existing.version || 1) + 1,
      syncStatus: "pending",
      deviceId
    };

    await db.storyEntities.put(updated);

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "ENTITY",
      entityId: id,
      action: "update",
      payload: JSON.stringify(updated),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    return updated;
  }

  public static async softDeleteEntity(id: string): Promise<boolean> {
    const existing = await db.storyEntities.get(id);
    if (!existing) return false;

    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();

    await db.storyEntities.update(id, {
      deletedAt: now,
      syncStatus: "pending"
    });

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "ENTITY",
      entityId: id,
      action: "delete",
      payload: JSON.stringify({ id, deletedAt: now }),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    return true;
  }

  public static async getRelationships(projectId: string): Promise<EntityRelationship[]> {
    return await db.entityRelationships
      .where("projectId")
      .equals(projectId)
      .filter((r) => !r.deletedAt)
      .toArray();
  }

  public static async createRelationship(data: {
    projectId: string;
    sourceEntityId: string;
    targetEntityId: string;
    relationshipType: string;
    notes?: string;
  }): Promise<EntityRelationship> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const id = `rel_${now}`;

    const rel: EntityRelationship = {
      id,
      projectId: data.projectId,
      sourceEntityId: data.sourceEntityId,
      targetEntityId: data.targetEntityId,
      relationshipType: data.relationshipType,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
      version: 1,
      syncStatus: "pending",
      deviceId
    };

    await db.entityRelationships.put(rel);

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "RELATIONSHIP",
      entityId: id,
      action: "create",
      payload: JSON.stringify(rel),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    return rel;
  }
}
