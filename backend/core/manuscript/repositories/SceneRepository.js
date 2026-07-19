/**
 * SceneRepository class.
 * Directs SQLite database statements for Scenes.
 */
class SceneRepository {
  constructor(dbManager) {
    this.dbManager = dbManager;
  }

  /**
   * Fetches all scenes in a project.
   * @param {string} projectId - Project identifier.
   * @returns {Promise<Array<object>>}
   */
  async findAllByProject(projectId) {
    const sql = `SELECT * FROM scenes WHERE project_id = ? ORDER BY order_index ASC`;
    return this.dbManager.all(sql, [projectId]);
  }

  /**
   * Fetches scenes by chapter.
   * @param {string} chapterId - Chapter identifier.
   * @returns {Promise<Array<object>>}
   */
  async findByChapter(chapterId) {
    const sql = `SELECT * FROM scenes WHERE chapter_id = ? ORDER BY order_index ASC`;
    return this.dbManager.all(sql, [chapterId]);
  }

  /**
   * Fetches a scene by ID.
   * @param {string} id - Scene identifier.
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const sql = `SELECT * FROM scenes WHERE id = ?`;
    return this.dbManager.get(sql, [id]);
  }

  /**
   * Creates a new scene record.
   * @param {object} scene - Scene details.
   * @returns {Promise<void>}
   */
  async create(scene) {
    const sql = `
      INSERT INTO scenes (
        id, project_id, chapter_id, title, content, summary, order_index, 
        pov_entity_id, purpose, conflict, outcome, word_count, status, mood, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.dbManager.run(sql, [
      scene.id,
      scene.projectId,
      scene.chapterId,
      scene.title,
      scene.content || "",
      scene.summary || "",
      scene.order_index,
      scene.povEntityId || null,
      scene.purpose || "",
      scene.conflict || "",
      scene.outcome || "",
      scene.wordCount || 0,
      scene.status || "draft",
      scene.mood || "",
      scene.tags ? JSON.stringify(scene.tags) : "[]"
    ]);
  }

  /**
   * Updates an existing scene's manuscript text or narrative metadata.
   * @param {string} id - Scene identifier.
   * @param {object} updates - Fields to overwrite.
   * @returns {Promise<void>}
   */
  async update(id, updates) {
    // Dynamically build SET query parameters
    const fields = [];
    const values = [];

    const fieldMap = {
      chapterId: "chapter_id",
      title: "title",
      content: "content",
      summary: "summary",
      orderIndex: "order_index",
      povEntityId: "pov_entity_id",
      purpose: "purpose",
      conflict: "conflict",
      outcome: "outcome",
      wordCount: "word_count",
      status: "status",
      mood: "mood",
      tags: "tags"
    };

    for (const [key, dbCol] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbCol} = ?`);
        let val = updates[key];
        if (key === "tags" && Array.isArray(val)) {
          val = JSON.stringify(val);
        }
        values.push(val);
      }
    }

    if (fields.length === 0) return;

    values.push(id); // Where condition ID parameter
    const sql = `
      UPDATE scenes
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await this.dbManager.run(sql, values);
  }

  /**
   * Deletes a scene.
   * @param {string} id - Scene identifier.
   * @returns {Promise<void>}
   */
  async delete(id) {
    const sql = `DELETE FROM scenes WHERE id = ?`;
    await this.dbManager.run(sql, [id]);
  }
}

module.exports = SceneRepository;
