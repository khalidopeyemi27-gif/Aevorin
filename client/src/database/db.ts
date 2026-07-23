import Dexie, { type Table } from "dexie";
import type {
  DeviceIdentity,
  Project,
  Chapter,
  Scene,
  Draft,
  DraftRecovery,
  SyncConflict,
  SyncEvent,
  StoryEntity,
  EntityRelationship,
  GraphNode,
  GraphEdge,
  TimelineEvent,
  SyncQueueItem
} from "./schema";

export class AevorinDatabase extends Dexie {
  deviceIdentity!: Table<DeviceIdentity, string>;
  projects!: Table<Project, string>;
  chapters!: Table<Chapter, string>;
  scenes!: Table<Scene, string>;
  drafts!: Table<Draft, string>;
  draftRecovery!: Table<DraftRecovery, string>;
  syncConflicts!: Table<SyncConflict, string>;
  syncEvents!: Table<SyncEvent, string>;
  storyEntities!: Table<StoryEntity, string>;
  entityRelationships!: Table<EntityRelationship, string>;
  graphNodes!: Table<GraphNode, string>;
  graphEdges!: Table<GraphEdge, string>;
  timelineEvents!: Table<TimelineEvent, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("aevorin_local");

    this.version(1).stores({
      deviceIdentity: "deviceId",
      projects: "id, name, updatedAt, syncStatus, deletedAt",
      chapters: "id, projectId, orderIndex, updatedAt, syncStatus, deletedAt",
      scenes: "id, projectId, chapterId, orderIndex, updatedAt, syncStatus, deletedAt",
      drafts: "id, sceneId, updatedAt, syncStatus, deletedAt",
      draftRecovery: "id, sceneId, createdAt",
      syncConflicts: "id, resourceId, resourceType, status, createdAt",
      syncEvents: "id, operationId, type, timestamp",
      storyEntities: "id, projectId, type, title, updatedAt, syncStatus, deletedAt",
      entityRelationships: "id, projectId, sourceEntityId, targetEntityId, syncStatus, deletedAt",
      graphNodes: "id, projectId, entityId, syncStatus, deletedAt",
      graphEdges: "id, projectId, from, to, syncStatus, deletedAt",
      timelineEvents: "id, projectId, position, timestamp, syncStatus, deletedAt",
      syncQueue: "++id, operationId, entityType, entityId, createdAt, deviceId"
    });

    // Version 2 non-destructive schema migration example
    this.version(2)
      .stores({
        drafts: "id, sceneId, contentHash, syncStatus, updatedAt, deletedAt"
      })
      .upgrade((tx) => {
        return tx
          .table("drafts")
          .toCollection()
          .modify((draft: Draft) => {
            draft.contentHash = draft.contentHash || draft.contentDelta.length.toString();
          });
      });
  }
}

export const db = new AevorinDatabase();
