import { db } from "../database/db";
import type { SyncQueueItem } from "../database/schema";
import { apiUrl } from "../lib/api";
import { NetworkMonitor } from "./NetworkMonitor";

class QueueProcessorService {
  private isProcessing = false;

  constructor() {
    NetworkMonitor.subscribe((isOnline) => {
      if (isOnline) {
        this.processQueue();
      }
    });
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing || !NetworkMonitor.getStatus()) return;
    this.isProcessing = true;

    try {
      const items: SyncQueueItem[] = await db.syncQueue.orderBy("createdAt").toArray();
      if (items.length === 0) {
        this.isProcessing = false;
        return;
      }

      for (const item of items) {
        if (!NetworkMonitor.getStatus()) break;

        const success = await this.uploadItem(item);
        if (success && item.id) {
          await db.syncQueue.delete(item.id);
        } else {
          // Increment attempts on failure
          if (item.id) {
            await db.syncQueue.update(item.id, { attempts: (item.attempts || 0) + 1 });
          }
          break;
        }
      }
    } catch (e) {
      console.error("[QueueProcessor] Error processing sync queue:", e);
    } finally {
      this.isProcessing = false;
    }
  }

  private async uploadItem(item: SyncQueueItem): Promise<boolean> {
    try {
      const payload = JSON.parse(item.payload);
      let endpoint = "";
      let method = "POST";

      switch (item.entityType) {
        case "PROJECT":
          if (item.action === "create") {
            endpoint = "/api/projects";
            method = "POST";
          } else if (item.action === "update") {
            endpoint = `/api/projects/${item.entityId}`;
            method = "PUT";
          } else if (item.action === "delete") {
            endpoint = `/api/projects/${item.entityId}`;
            method = "DELETE";
          }
          break;

        case "CHAPTER":
          if (item.action === "create") {
            endpoint = `/api/projects/${payload.projectId}/chapters`;
            method = "POST";
          } else if (item.action === "update") {
            endpoint = `/api/projects/${payload.projectId}/chapters/${item.entityId}`;
            method = "PUT";
          } else if (item.action === "delete") {
            endpoint = `/api/projects/${payload.projectId}/chapters/${item.entityId}`;
            method = "DELETE";
          }
          break;

        case "SCENE":
          if (item.action === "create") {
            endpoint = `/api/projects/${payload.projectId}/scenes`;
            method = "POST";
          } else if (item.action === "update") {
            endpoint = `/api/projects/${payload.projectId}/scenes/${item.entityId}`;
            method = "PUT";
          } else if (item.action === "delete") {
            endpoint = `/api/projects/${payload.projectId}/scenes/${item.entityId}`;
            method = "DELETE";
          }
          break;

        case "ENTITY":
          if (item.action === "create") {
            endpoint = `/api/projects/${payload.projectId}/entities`;
            method = "POST";
          } else if (item.action === "update") {
            endpoint = `/api/projects/${payload.projectId}/entities/${item.entityId}`;
            method = "PUT";
          } else if (item.action === "delete") {
            endpoint = `/api/projects/${payload.projectId}/entities/${item.entityId}`;
            method = "DELETE";
          }
          break;

        default:
          endpoint = `/api/sync/operation`;
          method = "POST";
          break;
      }

      if (!endpoint) return true;

      const res = await fetch(apiUrl(endpoint), {
        method,
        headers: { "Content-Type": "application/json" },
        body: method !== "DELETE" ? JSON.stringify(payload) : undefined
      });

      return res.ok;
    } catch (e) {
      console.error(`[QueueProcessor] Failed to upload sync item ${item.operationId}:`, e);
      return false;
    }
  }
}

export const QueueProcessor = new QueueProcessorService();
