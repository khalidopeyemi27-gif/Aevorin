import Dexie, { type Table } from "dexie";

export type SyncStatus = "pending" | "synced" | "conflict";

export interface LocalProject {
  id: string;
  name: string;
  path: string;
  manifest: {
    created: string;
    writing_mode: string;
    archived?: boolean;
  };
  targetWordCount?: number;
  coverImage?: string;
  description?: string;
  accentColor?: string;
  fontPair?: string;
  bookSeries?: string;
  volume?: number;
  publisher?: string;
  copyright?: string;
  language?: string;
  authorName?: string;
  genre?: string;
  updatedAt: string;
  version: number;
  syncStatus: SyncStatus;
}

export interface LocalChapter {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  actIndex: number;
  updatedAt: string;
  version: number;
  syncStatus: SyncStatus;
}

export interface LocalScene {
  id: string;
  projectId: string;
  chapterId: string;
  title: string;
  content: string;
  wordCount: number;
  orderIndex: number;
  updatedAt: string;
  version: number;
  syncStatus: SyncStatus;
}

export interface LocalDraft {
  id: string;
  sceneId: string;
  contentDelta: string;
  contentHash: string;
  wordCount: number;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface LocalEntity {
  id: string;
  projectId: string;
  type: string; // CHARACTER, WORLD, ITEM, FACTION, EVENT
  title: string;
  summary: string;
  imagePath?: string;
  metadataJson?: string;
  updatedAt: string;
  version: number;
  syncStatus: SyncStatus;
}

export interface LocalRelationship {
  id: string;
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  direction?: string;
  notes?: string;
  description?: string;
  updatedAt: string;
  version: number;
  syncStatus: SyncStatus;
}

export interface LocalGraphNode {
  id: string;
  projectId: string;
  entityId: string;
  label: string;
  type: string;
  importance: number;
  x: number;
  y: number;
  color?: string;
  size?: number;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface LocalGraphEdge {
  id: string;
  projectId: string;
  from: string;
  to: string;
  relationship: string;
  syncStatus: SyncStatus;
}

export interface LocalTimelineEvent {
  id: string;
  projectId: string;
  title: string;
  description: string;
  timestamp: string;
  actId?: string;
  position: number;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface LocalSyncItem {
  id?: number;
  opId: string;
  resourceType: string; // PROJECT, CHAPTER, SCENE, ENTITY, RELATIONSHIP, GRAPH, TIMELINE
  resourceId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  payload: string;
  timestamp: string;
}

export class AevorinDatabase extends Dexie {
  projects!: Table<LocalProject, string>;
  chapters!: Table<LocalChapter, string>;
  scenes!: Table<LocalScene, string>;
  drafts!: Table<LocalDraft, string>;
  storyEntities!: Table<LocalEntity, string>;
  entityRelationships!: Table<LocalRelationship, string>;
  graphNodes!: Table<LocalGraphNode, string>;
  graphEdges!: Table<LocalGraphEdge, string>;
  timelineEvents!: Table<LocalTimelineEvent, string>;
  syncQueue!: Table<LocalSyncItem, number>;

  constructor() {
    super("aevorin_local");
    this.version(1).stores({
      projects: "id, name, updatedAt, syncStatus",
      chapters: "id, projectId, orderIndex, updatedAt, syncStatus",
      scenes: "id, projectId, chapterId, orderIndex, updatedAt, syncStatus",
      drafts: "id, sceneId, updatedAt, syncStatus",
      storyEntities: "id, projectId, type, title, updatedAt, syncStatus",
      entityRelationships: "id, projectId, sourceEntityId, targetEntityId, syncStatus",
      graphNodes: "id, projectId, entityId, syncStatus",
      graphEdges: "id, projectId, from, to, syncStatus",
      timelineEvents: "id, projectId, position, timestamp, syncStatus",
      syncQueue: "++id, opId, resourceType, resourceId, timestamp"
    });
  }
}

export const db = new AevorinDatabase();
