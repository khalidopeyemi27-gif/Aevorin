import { db, type LocalSyncItem } from "../../lib/db";
import { apiUrl } from "../../lib/api";
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
      const items: LocalSyncItem[] = await db.syncQueue.orderBy("timestamp").toArray();
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
          // Break loop on failure to preserve queue order
          break;
        }
      }
    } catch (e) {
      console.error("[QueueProcessor] Error processing sync queue:", e);
    } finally {
      this.isProcessing = false;
    }
  }

  private async uploadItem(item: LocalSyncItem): Promise<boolean> {
    try {
      const payload = JSON.parse(item.payload);
      let endpoint = "";
      let method = "POST";

      switch (item.resourceType) {
        case "PROJECT":
          if (item.action === "CREATE") {
            endpoint = "/api/projects";
            method = "POST";
          } else if (item.action === "UPDATE") {
            endpoint = `/api/projects/${item.resourceId}`;
            method = "PUT";
          } else if (item.action === "DELETE") {
            endpoint = `/api/projects/${item.resourceId}`;
            method = "DELETE";
          }
          break;

        case "CHAPTER":
          if (item.action === "CREATE") {
            endpoint = `/api/projects/${payload.projectId}/chapters`;
            method = "POST";
          } else if (item.action === "UPDATE") {
            endpoint = `/api/projects/${payload.projectId}/chapters/${item.resourceId}`;
            method = "PUT";
          } else if (item.action === "DELETE") {
            endpoint = `/api/projects/${payload.projectId}/chapters/${item.resourceId}`;
            method = "DELETE";
          }
          break;

        case "SCENE":
          if (item.action === "CREATE") {
            endpoint = `/api/projects/${payload.projectId}/scenes`;
            method = "POST";
          } else if (item.action === "UPDATE") {
            endpoint = `/api/projects/${payload.projectId}/scenes/${item.resourceId}`;
            method = "PUT";
          } else if (item.action === "DELETE") {
            endpoint = `/api/projects/${payload.projectId}/scenes/${item.resourceId}`;
            method = "DELETE";
          }
          break;

        case "ENTITY":
          if (item.action === "CREATE") {
            endpoint = `/api/projects/${payload.projectId}/entities`;
            method = "POST";
          } else if (item.action === "UPDATE") {
            endpoint = `/api/projects/${payload.projectId}/entities/${item.resourceId}`;
            method = "PUT";
          } else if (item.action === "DELETE") {
            endpoint = `/api/projects/${payload.projectId}/entities/${item.resourceId}`;
            method = "DELETE";
          }
          break;

        default:
          endpoint = `/api/sync/operation`;
          method = "POST";
          break;
      }

      if (!endpoint) return true; // Skip unsupported

      const res = await fetch(apiUrl(endpoint), {
        method,
        headers: { "Content-Type": "application/json" },
        body: method !== "DELETE" ? JSON.stringify(payload) : undefined
      });

      return res.ok;
    } catch (e) {
      console.error(`[QueueProcessor] Failed to upload sync item ${item.opId}:`, e);
      return false;
    }
  }
}

export const QueueProcessor = new QueueProcessorService();
