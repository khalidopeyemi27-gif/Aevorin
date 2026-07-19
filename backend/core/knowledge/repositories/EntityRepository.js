/**
 * EntityRepository class.
 * Directs SQLite database statements for Unified Entities (Characters, Locations, Lore, etc.).
 */
class EntityRepository {
  constructor(dbManager) {
    this.dbManager = dbManager;
  }

  /**
   * Fetches all entities inside a project.
   * @param {string} projectId - Project identifier.
   * @returns {Promise<Array<object>>}
   */
  async findAllByProject(projectId) {
    const sql = `SELECT * FROM entities WHERE project_id = ? ORDER BY title ASC`;
    return this.dbManager.all(sql, [projectId]);
  }

  /**
   * Fetches an entity by ID.
   * @param {string} id - Entity identifier.
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const sql = `SELECT * FROM entities WHERE id = ?`;
    return this.dbManager.get(sql, [id]);
  }

  /**
   * Creates a new entity.
   * @param {object} entity - Entity details.
   * @returns {Promise<void>}
   */
  async create(entity) {
    const sql = `
      INSERT INTO entities (id, project_id, type, title, summary, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await this.dbManager.run(sql, [
      entity.id,
      entity.projectId,
      entity.type,
      entity.title,
      entity.summary || "",
      entity.metadata ? JSON.stringify(entity.metadata) : "{}"
    ]);
  }

  /**
   * Updates an existing entity.
   * @param {string} id - Entity identifier.
   * @param {object} updates - Map of updates.
   * @returns {Promise<void>}
   */
  async update(id, updates) {
    const fields = [];
    const values = [];

    const fieldMap = {
      type: "type",
      title: "title",
      summary: "summary",
      metadata: "metadata"
    };

    for (const [key, dbCol] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbCol} = ?`);
        let val = updates[key];
        if (key === "metadata" && typeof val === "object") {
          val = JSON.stringify(val);
        }
        values.push(val);
      }
    }

    if (fields.length === 0) return;

    values.push(id);
    const sql = `
      UPDATE entities
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await this.dbManager.run(sql, values);
  }

  /**
   * Deletes an entity.
   * @param {string} id - Entity identifier.
   * @returns {Promise<void>}
   */
  async delete(id) {
    const sql = `DELETE FROM entities WHERE id = ?`;
    await this.dbManager.run(sql, [id]);
  }
}

module.exports = EntityRepository;
