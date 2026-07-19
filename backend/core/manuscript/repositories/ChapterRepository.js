/**
 * ChapterRepository class.
 * Directs SQLite database statements for Chapters.
 */
class ChapterRepository {
  constructor(dbManager) {
    this.dbManager = dbManager;
  }

  /**
   * Fetches all chapters in a project ordered by order_index.
   * @param {string} projectId - Project identifier.
   * @returns {Promise<Array<object>>}
   */
  async findAllByProject(projectId) {
    const sql = `SELECT * FROM chapters WHERE project_id = ? ORDER BY order_index ASC`;
    return this.dbManager.all(sql, [projectId]);
  }

  /**
   * Fetches a chapter by ID.
   * @param {string} id - Chapter identifier.
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const sql = `SELECT * FROM chapters WHERE id = ?`;
    return this.dbManager.get(sql, [id]);
  }

  /**
   * Creates a new chapter record.
   * @param {object} chapter - Chapter details.
   * @returns {Promise<void>}
   */
  async create(chapter) {
    const sql = `
      INSERT INTO chapters (id, project_id, title, order_index)
      VALUES (?, ?, ?, ?)
    `;
    await this.dbManager.run(sql, [
      chapter.id,
      chapter.projectId,
      chapter.title,
      chapter.order_index
    ]);
  }

  /**
   * Updates an existing chapter.
   * @param {string} id - Chapter identifier.
   * @param {object} updates - Key-value update options.
   * @returns {Promise<void>}
   */
  async update(id, updates) {
    const sql = `
      UPDATE chapters
      SET title = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.dbManager.run(sql, [updates.title, updates.order_index, id]);
  }

  /**
   * Deletes a chapter.
   * @param {string} id - Chapter identifier.
   * @returns {Promise<void>}
   */
  async delete(id) {
    const sql = `DELETE FROM chapters WHERE id = ?`;
    await this.dbManager.run(sql, [id]);
  }
}

module.exports = ChapterRepository;
