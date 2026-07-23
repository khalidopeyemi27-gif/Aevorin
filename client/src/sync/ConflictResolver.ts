import type { LocalEntity } from "../database/schema";

export interface Conflict<T extends LocalEntity> {
  local: T;
  remote: T;
  baseVersion?: number;
}

export class ConflictResolver {
  /**
   * Last-Write-Wins (LWW) strategy for general metadata entities (Characters, Worlds, Timeline Events)
   */
  public static resolveLWW<T extends LocalEntity>(local: T, remote: T): T {
    if (remote.updatedAt > local.updatedAt) {
      return { ...remote, syncStatus: "synced" };
    }
    return { ...local, syncStatus: "pending" };
  }

  /**
   * Detects manuscript scene draft conflict for 3-way merge
   */
  public static detectDraftConflict(
    localContentHash: string,
    remoteContentHash: string,
    baseVersion?: number,
    remoteVersion?: number
  ): boolean {
    if (localContentHash === remoteContentHash) return false;
    if (baseVersion !== undefined && remoteVersion !== undefined && remoteVersion > baseVersion) {
      return true;
    }
    return false;
  }
}
