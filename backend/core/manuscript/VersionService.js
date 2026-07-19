const { v4: uuidv4 } = require("uuid");

/**
 * VersionService class.
 * Tracks version history diffs/snapshots for scenes and lore entities.
 */
class VersionService {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
  }

  /**
   * Helper to extract plain text from TipTap editor JSON document.
   */
  extractTextFromTipTap(content) {
    if (!content) return "";
    try {
      const doc = typeof content === "string" ? JSON.parse(content) : content;
      let text = "";
      const traverse = (node) => {
        if (node.type === "text") {
          text += node.text;
        } else if (node.content) {
          for (const child of node.content) {
            traverse(child);
          }
        }
        if (node.type === "paragraph" || node.type === "heading") {
          text += "\n";
        }
      };
      traverse(doc);
      return text;
    } catch (e) {
      return typeof content === "string" ? content : "";
    }
  }

  /**
   * Creates a new historical snapshot.
   * @param {string} projectId - Project identifier.
   * @param {string} entityType - 'scene' or 'entity'.
   * @param {string} entityId - Reference UUID.
   * @param {string} content - JSON snapshot.
   * @param {string} summary - Optional commit summary / reason.
   * @returns {Promise<object>} Created version.
   */
  async createVersion(projectId, entityType, entityId, content, summary = "") {
    if (entityType === "scene") {
      // Find scene's chapter_id
      const sceneSql = `SELECT chapter_id FROM scenes WHERE id = ?`;
      const sceneRow = await this.databaseManager.get(sceneSql, [entityId]);
      const chapterId = sceneRow ? sceneRow.chapter_id : null;

      // Extract plain text and count words
      const text = this.extractTextFromTipTap(content);
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

      const id = uuidv4();
      const sql = `
        INSERT INTO manuscript_versions (id, project_id, chapter_id, scene_id, content_snapshot, word_count, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await this.databaseManager.run(sql, [
        id,
        projectId,
        chapterId,
        entityId,
        typeof content === "string" ? content : JSON.stringify(content),
        wordCount,
        summary || "autosave checkpoint"
      ]);

      return { id, version_number: null };
    } else {
      // Find current max version number for general entities
      const maxSql = `
        SELECT IFNULL(MAX(version_number), 0) as maxNum 
        FROM version_history 
        WHERE entity_id = ? AND entity_type = ?
      `;
      const res = await this.databaseManager.get(maxSql, [entityId, entityType]);
      const nextVersionNum = (res?.maxNum || 0) + 1;

      const id = uuidv4();
      const sql = `
        INSERT INTO version_history (id, project_id, entity_type, entity_id, version_number, content, summary)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await this.databaseManager.run(sql, [
        id,
        projectId,
        entityType,
        entityId,
        nextVersionNum,
        content,
        summary || `Version ${nextVersionNum}`
      ]);

      return { id, version_number: nextVersionNum };
    }
  }

  /**
   * Lists available history checkpoints for a scene, character, or project.
   * @param {string} [entityId] - Entity identifier.
   * @param {string} [entityType] - 'scene' or 'entity'.
   * @param {string} [projectId] - Optional project identifier.
   * @returns {Promise<Array<object>>}
   */
  async getHistory(entityId, entityType, projectId = null) {
    if (entityId && entityType === "scene") {
      const sql = `
        SELECT id, created_at, reason as summary, word_count
        FROM manuscript_versions 
        WHERE scene_id = ? 
        ORDER BY created_at DESC
      `;
      const list = await this.databaseManager.all(sql, [entityId]);
      return list.map((item, idx) => ({
        ...item,
        version_number: list.length - idx,
        summary: item.summary || "autosave checkpoint"
      }));
    } else if (entityId) {
      const sql = `
        SELECT id, version_number, summary, created_at 
        FROM version_history 
        WHERE entity_id = ? AND entity_type = ? 
        ORDER BY version_number DESC
      `;
      return this.databaseManager.all(sql, [entityId, entityType]);
    } else if (projectId) {
      const sql = `
        SELECT mv.id, mv.created_at, mv.reason as summary, mv.word_count, s.title as scene_title
        FROM manuscript_versions mv
        JOIN scenes s ON mv.scene_id = s.id
        WHERE mv.project_id = ?
        ORDER BY mv.created_at DESC
        LIMIT 10
      `;
      return this.databaseManager.all(sql, [projectId]);
    }
    return [];
  }

  /**
   * Fetches specific version details.
   * @param {string} versionId - Version identifier.
   * @returns {Promise<object|null>}
   */
  async getVersionById(versionId) {
    // Try manuscript_versions first
    const mvSql = `SELECT * FROM manuscript_versions WHERE id = ?`;
    const mvRow = await this.databaseManager.get(mvSql, [versionId]);
    if (mvRow) {
      return {
        id: mvRow.id,
        project_id: mvRow.project_id,
        entity_type: "scene",
        entity_id: mvRow.scene_id,
        content: mvRow.content_snapshot,
        summary: mvRow.reason,
        created_at: mvRow.created_at
      };
    }

    const sql = `SELECT * FROM version_history WHERE id = ?`;
    return this.databaseManager.get(sql, [versionId]);
  }

  /**
   * Restores an active entity to a historical state.
   * @param {string} versionId - Version identifier.
   * @returns {Promise<object>} Restored data.
   */
  async restoreVersion(versionId) {
    const version = await this.getVersionById(versionId);
    if (!version) throw new Error("Version history checkpoint not found");

    if (version.entity_type === "scene") {
      const sql = `
        UPDATE scenes 
        SET content = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      await this.databaseManager.run(sql, [version.content, version.entity_id]);
    } else if (version.entity_type === "entity") {
      const sql = `
        UPDATE entities 
        SET metadata = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      await this.databaseManager.run(sql, [version.content, version.entity_id]);
    }

    return version;
  }
}

module.exports = VersionService;
