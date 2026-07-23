export type SyncStatus = "synced" | "pending" | "conflict" | "failed";

export interface LocalEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  syncStatus: SyncStatus;
  lastSyncedAt?: number;
  deviceId: string;
  deletedAt?: number;
}

export interface DeviceIdentity {
  deviceId: string;
  platform: "WEB" | "DESKTOP" | "MOBILE";
  createdAt: number;
  lastSeen: number;
  appVersion: string;
}

export interface Project extends LocalEntity {
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
}

export interface Chapter extends LocalEntity {
  projectId: string;
  title: string;
  orderIndex: number;
  actIndex: number;
}

export interface Scene extends LocalEntity {
  projectId: string;
  chapterId: string;
  title: string;
  wordCount: number;
  orderIndex: number;
}

export interface Draft extends LocalEntity {
  sceneId: string;
  contentDelta: string;
  contentHTML: string;
  contentHash: string;
  wordCount: number;
  baseVersion?: number;
}

export interface DraftRecovery {
  id: string;
  sceneId: string;
  contentDelta: string;
  contentHash: string;
  createdAt: number;
  reason: "browser_crash" | "manual_snapshot";
}

export interface SyncConflict {
  id: string;
  resourceType: string;
  resourceId: string;
  localVersion: number;
  serverVersion: number;
  localHash: string;
  serverHash: string;
  localPayload: string;
  serverPayload: string;
  resolution?: "LOCAL" | "SERVER" | "MERGED";
  resolvedAt?: number;
  createdAt: number;
  status: "OPEN" | "RESOLVED";
}

export interface SyncEvent {
  id: string;
  operationId: string;
  type: "UPLOAD_STARTED" | "UPLOAD_SUCCESS" | "UPLOAD_FAILED" | "CONFLICT_CREATED";
  entityId: string;
  timestamp: number;
}

export interface StoryEntity extends LocalEntity {
  projectId: string;
  type: string; // CHARACTER, WORLD, ITEM, FACTION, EVENT
  title: string;
  summary: string;
  imagePath?: string;
  metadataJson?: string;
}

export interface EntityRelationship extends LocalEntity {
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  direction?: string;
  notes?: string;
  description?: string;
}

export interface GraphNode extends LocalEntity {
  projectId: string;
  entityId: string;
  label: string;
  type: string;
  importance: number;
  x: number;
  y: number;
  color?: string;
  size?: number;
}

export interface GraphEdge extends LocalEntity {
  projectId: string;
  from: string;
  to: string;
  relationship: string;
}

export interface TimelineEvent extends LocalEntity {
  projectId: string;
  title: string;
  description: string;
  timestamp: string;
  actId?: string;
  position: number;
}

export interface SyncQueueItem {
  id?: number;
  operationId: string;
  entityType: "PROJECT" | "CHAPTER" | "SCENE" | "DRAFT" | "ENTITY" | "RELATIONSHIP" | "GRAPH" | "TIMELINE";
  entityId: string;
  action: "create" | "update" | "delete";
  payload: string;
  attemptCount?: number;
  nextRetryAt?: number;
  createdAt: number;
  attempts: number;
  deviceId: string;
  status?: "PENDING" | "SYNCING" | "SUCCESS" | "FAILED";
}

export interface AevorinBackupPayload {
  format: "aevorin-backup";
  schemaVersion: number;
  appVersion: string;
  checksum: string; // sha256(JSON.stringify(workspace))
  encrypted: boolean;
  createdAt: string;
  workspace: {
    projects: Project[];
    chapters: Chapter[];
    scenes: Scene[];
    drafts: Draft[];
    storyEntities: StoryEntity[];
    timelineEvents: TimelineEvent[];
    graphNodes: GraphNode[];
    graphEdges: GraphEdge[];
  };
}
