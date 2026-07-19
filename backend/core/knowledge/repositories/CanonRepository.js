const { v4: uuidv4 } = require("uuid");

/**
 * CanonRepository class.
 * Manages SQLite operations for timeline events, character property changes, relationship changes, and continuity reports.
 */
class CanonRepository {
  constructor(dbManager) {
    this.dbManager = dbManager;
  }

  // --- CANON EVENTS ---
  async getCanonEvents(projectId) {
    const sql = `SELECT * FROM canon_events WHERE project_id = ? ORDER BY position_key ASC, created_at ASC`;
    return this.dbManager.all(sql, [projectId]);
  }

  async findCanonEventById(id) {
    return this.dbManager.get(`SELECT * FROM canon_events WHERE id = ?`, [id]);
  }

  async createCanonEvent(event) {
    const sql = `
      INSERT INTO canon_events (id, project_id, position_key, title, description, importance, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await this.dbManager.run(sql, [
      event.id || uuidv4(),
      event.projectId,
      event.positionKey,
      event.title,
      event.description || "",
      event.importance || "major",
      event.status || "confirmed"
    ]);
  }

  async updateCanonEvent(id, updates) {
    const fields = [];
    const values = [];
    const allowed = ["title", "description", "position_key", "importance", "status"];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    }
    if (fields.length === 0) return;
    values.push(id);
    await this.dbManager.run(`UPDATE canon_events SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  async deleteCanonEvent(id) {
    await this.dbManager.run(`DELETE FROM canon_events WHERE id = ?`, [id]);
  }

  // --- CHARACTER CHANGES ---
  async getCharacterChangesByEvent(eventId) {
    return this.dbManager.all(`SELECT * FROM character_changes WHERE event_id = ?`, [eventId]);
  }

  async getCharacterChangesByCharacter(characterId) {
    return this.dbManager.all(`SELECT * FROM character_changes WHERE character_id = ? ORDER BY position_key ASC`, [characterId]);
  }

  async createCharacterChange(change) {
    let positionKey = change.positionKey;
    if (change.eventId && change.eventId !== "manual") {
      const ev = await this.dbManager.get(`SELECT position_key FROM canon_events WHERE id = ?`, [change.eventId]);
      if (ev) {
        positionKey = ev.position_key;
      }
    }

    const sql = `
      INSERT INTO character_changes (id, character_id, event_id, position_key, field, old_value, new_value)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await this.dbManager.run(sql, [
      change.id || uuidv4(),
      change.characterId,
      change.eventId,
      positionKey,
      change.field,
      change.oldValue || null,
      change.newValue
    ]);
  }

  async deleteCharacterChange(id) {
    await this.dbManager.run(`DELETE FROM character_changes WHERE id = ?`, [id]);
  }

  // --- RELATIONSHIP CHANGES ---
  async getRelationshipChanges(projectId) {
    return this.dbManager.all(`
      SELECT * FROM relationship_changes WHERE project_id = ? ORDER BY position_key ASC
    `, [projectId]);
  }

  async createRelationshipChange(change) {
    let positionKey = change.positionKey;
    if (change.eventId && change.eventId !== "manual") {
      const ev = await this.dbManager.get(`SELECT position_key FROM canon_events WHERE id = ?`, [change.eventId]);
      if (ev) {
        positionKey = ev.position_key;
      }
    }

    const sql = `
      INSERT INTO relationship_changes (id, project_id, character_a, character_b, event_id, position_key, old_relationship, new_relationship, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.dbManager.run(sql, [
      change.id || uuidv4(),
      change.projectId,
      change.characterA,
      change.characterB,
      change.eventId || null,
      positionKey,
      change.oldRelationship || null,
      change.newRelationship,
      change.reason || null
    ]);
  }

  // --- CONTINUITY REPORTS ---
  async getContinuityReports(projectId) {
    return this.dbManager.all(`
      SELECT r.*, e.title as affected_character
      FROM continuity_reports r
      LEFT JOIN entities e ON r.affected_entity_id = e.id
      WHERE r.project_id = ? AND r.status = 'active'
      ORDER BY r.created_at DESC
    `, [projectId]);
  }

  async createContinuityReport(report) {
    const sql = `
      INSERT INTO continuity_reports (id, project_id, scene_id, type, message, severity, affected_entity_id, evidence, confidence, status, resolved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0)
    `;
    await this.dbManager.run(sql, [
      report.id || uuidv4(),
      report.projectId,
      report.sceneId,
      report.type,
      report.message,
      report.severity,
      report.affectedEntityId || null,
      report.evidence || null,
      report.confidence !== undefined ? report.confidence : 1.0
    ]);
  }

  async resolveContinuityReport(id) {
    await this.dbManager.run(`UPDATE continuity_reports SET status = 'resolved', resolved = 1 WHERE id = ?`, [id]);
  }

  async clearContinuityReportsForScene(sceneId) {
    await this.dbManager.run(`DELETE FROM continuity_reports WHERE scene_id = ?`, [sceneId]);
  }
}

module.exports = CanonRepository;
