import { db } from "../db";
import type { Project } from "../schema";
import { DeviceIdentityManager } from "../../sync/DeviceIdentity";

export class ProjectRepository {
  public static async getAll(): Promise<Project[]> {
    return await db.projects
      .filter((p) => !p.deletedAt)
      .reverse()
      .sortBy("updatedAt");
  }

  public static async getById(id: string): Promise<Project | undefined> {
    const project = await db.projects.get(id);
    return project && !project.deletedAt ? project : undefined;
  }

  public static async getByName(name: string): Promise<Project | undefined> {
    const project = await db.projects.where("name").equals(name).first();
    return project && !project.deletedAt ? project : undefined;
  }

  public static async create(data: {
    name: string;
    description?: string;
    template?: string;
    targetWordCount?: number;
    coverImage?: string;
  }): Promise<Project> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const id = `proj_${now}`;

    const project: Project = {
      id,
      name: data.name,
      path: `/local/${data.name.toLowerCase().replace(/\s+/g, "_")}`,
      manifest: {
        created: new Date(now).toISOString(),
        writing_mode: (data.template || "novel").toLowerCase()
      },
      targetWordCount: data.targetWordCount || 50000,
      coverImage: data.coverImage,
      description: data.description,
      createdAt: now,
      updatedAt: now,
      version: 1,
      syncStatus: "pending",
      deviceId
    };

    await db.projects.put(project);

    // Queue for sync
    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "PROJECT",
      entityId: id,
      action: "create",
      payload: JSON.stringify(project),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    return project;
  }

  public static async update(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const existing = await db.projects.get(id);
    if (!existing || existing.deletedAt) return undefined;

    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();

    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: now,
      version: existing.version + 1,
      syncStatus: "pending",
      deviceId
    };

    await db.projects.put(updated);

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "PROJECT",
      entityId: id,
      action: "update",
      payload: JSON.stringify(updated),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    return updated;
  }

  public static async softDelete(id: string): Promise<boolean> {
    const existing = await db.projects.get(id);
    if (!existing) return false;

    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();

    await db.projects.update(id, {
      deletedAt: now,
      syncStatus: "pending"
    });

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "PROJECT",
      entityId: id,
      action: "delete",
      payload: JSON.stringify({ id, deletedAt: now }),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    return true;
  }
}
