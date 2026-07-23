import { db } from "../db";
import type { TimelineEvent } from "../schema";
import { DeviceIdentityManager } from "../../sync/DeviceIdentity";

export class TimelineRepository {
  public static async getEvents(projectId: string): Promise<TimelineEvent[]> {
    return await db.timelineEvents
      .where("projectId")
      .equals(projectId)
      .filter((e) => !e.deletedAt)
      .sortBy("position");
  }

  public static async createEvent(data: {
    projectId: string;
    title: string;
    description: string;
    timestamp: string;
    actId?: string;
    position?: number;
  }): Promise<TimelineEvent> {
    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();
    const id = `evt_${now}`;

    const event: TimelineEvent = {
      id,
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      timestamp: data.timestamp,
      actId: data.actId,
      position: data.position || 1,
      createdAt: now,
      updatedAt: now,
      version: 1,
      syncStatus: "pending",
      deviceId
    };

    await db.timelineEvents.put(event);

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "TIMELINE",
      entityId: id,
      action: "create",
      payload: JSON.stringify(event),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    return event;
  }

  public static async updateEvent(id: string, updates: Partial<TimelineEvent>): Promise<TimelineEvent | undefined> {
    const existing = await db.timelineEvents.get(id);
    if (!existing || existing.deletedAt) return undefined;

    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();

    const updated: TimelineEvent = {
      ...existing,
      ...updates,
      updatedAt: now,
      version: existing.version + 1,
      syncStatus: "pending",
      deviceId
    };

    await db.timelineEvents.put(updated);

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "TIMELINE",
      entityId: id,
      action: "update",
      payload: JSON.stringify(updated),
      createdAt: now,
      attempts: 0,
      deviceId
    });

    return updated;
  }

  public static async softDeleteEvent(id: string): Promise<boolean> {
    const existing = await db.timelineEvents.get(id);
    if (!existing) return false;

    const deviceId = await DeviceIdentityManager.getDeviceId();
    const now = Date.now();

    await db.timelineEvents.update(id, {
      deletedAt: now,
      syncStatus: "pending"
    });

    await db.syncQueue.add({
      operationId: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: "TIMELINE",
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
