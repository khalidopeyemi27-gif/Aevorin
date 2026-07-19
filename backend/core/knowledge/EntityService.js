const { v4: uuidv4 } = require("uuid");
const EventTypes = require("../infrastructure/events/EventTypes");

/**
 * EntityService class.
 * Service coordinating World Lore and Character profiles.
 */
class EntityService {
  constructor(entityRepository, eventBus) {
    this.entityRepository = entityRepository;
    this.eventBus = eventBus;
  }

  /**
   * Fetches entities in project.
   * @param {string} projectId - Project identifier.
   * @param {string|null} type - Filter by type ('character', 'location', etc.)
   * @returns {Promise<Array<object>>}
   */
  async getEntities(projectId, type = null) {
    const all = await this.entityRepository.findAllByProject(projectId);
    
    // Parse metadata JSON strings in results
    const parsed = all.map(e => ({
      ...e,
      metadata: e.metadata ? JSON.parse(e.metadata) : {}
    }));

    if (type) {
      return parsed.filter(e => e.type === type);
    }
    return parsed;
  }

  /**
   * Creates a new entity.
   * @param {string} projectId - Project identifier.
   * @param {string} type - Entity type ('character', 'location', 'faction', 'item', 'magic', 'race', 'religion').
   * @param {string} title - Entity name.
   * @param {string} summary - Brief summary.
   * @param {object} metadata - Custom template fields.
   * @returns {Promise<object>} Created entity.
   */
  async createEntity(projectId, type, title, summary = "", metadata = {}) {
    if (!title || title.trim() === "") throw new Error("Entity title is required");

    const entity = {
      id: uuidv4(),
      projectId,
      type: type || "character",
      title: title.trim(),
      summary: summary || "",
      metadata: metadata || {}
    };

    await this.entityRepository.create(entity);

    this.eventBus.publish(EventTypes.ENTITY_CREATED, {
      projectId,
      entityId: entity.id,
      type: entity.type,
      title: entity.title
    });

    return entity;
  }

  /**
   * Updates entity information.
   * @param {string} id - Entity identifier.
   * @param {object} updates - Key-value parameters.
   * @returns {Promise<object>} Updated entity.
   */
  async updateEntity(id, updates) {
    const entity = await this.entityRepository.findById(id);
    if (!entity) throw new Error("Entity not found");

    await this.entityRepository.update(id, updates);

    // Fetch the fresh updated row from database
    const updated = await this.entityRepository.findById(id);

    // Parse metadata JSON to object
    const parsed = {
      ...updated,
      metadata: updated.metadata ? JSON.parse(updated.metadata) : {}
    };

    this.eventBus.publish(EventTypes.ENTITY_UPDATED, {
      projectId: parsed.project_id,
      entityId: id,
      type: parsed.type,
      title: parsed.title
    });

    return parsed;
  }

  /**
   * Deletes an entity.
   * @param {string} id - Entity identifier.
   * @returns {Promise<void>}
   */
  async deleteEntity(id) {
    const entity = await this.entityRepository.findById(id);
    if (!entity) throw new Error("Entity not found");

    await this.entityRepository.delete(id);

    this.eventBus.publish(EventTypes.ENTITY_DELETED, {
      projectId: entity.project_id,
      entityId: id,
      type: entity.type
    });
  }

  /**
   * Computes story intelligence metadata for a specific entity.
   */
  async getEntityIntelligence(entityId) {
    const db = this.entityRepository.dbManager;

    // 1. Compute total mentions count
    const countRow = await db.get(`
      SELECT SUM(count) as total FROM entity_mentions WHERE entity_id = ?
    `, [entityId]);
    const totalMentions = countRow?.total || 0;

    // 2. Fetch first appearance details
    const firstAppRow = await db.get(`
      SELECT s.id as scene_id, s.title as scene_title, c.id as chapter_id, c.title as chapter_title, c.order_index as chapter_order, s.order_index as scene_order
      FROM entity_mentions em
      JOIN scenes s ON em.scene_id = s.id
      LEFT JOIN chapters c ON s.chapter_id = c.id
      WHERE em.entity_id = ?
      ORDER BY c.order_index ASC, s.order_index ASC, em.first_position ASC
      LIMIT 1
    `, [entityId]);

    let firstAppearance = null;
    if (firstAppRow) {
      firstAppearance = {
        sceneId: firstAppRow.scene_id,
        sceneTitle: firstAppRow.scene_title,
        chapterId: firstAppRow.chapter_id,
        chapterTitle: firstAppRow.chapter_title || "Unassigned Scene",
        label: firstAppRow.chapter_title 
          ? `Chapter ${firstAppRow.chapter_order + 1}: ${firstAppRow.chapter_title} • ${firstAppRow.scene_title}`
          : firstAppRow.scene_title
      };
    }

    // 3. Fetch connected co-occurring entities
    const connections = await db.all(`
      SELECT e.id, e.title, e.type, r.weight 
      FROM entity_relationships r
      JOIN entities e ON (r.entity_a = e.id OR r.entity_b = e.id)
      WHERE (r.entity_a = ? OR r.entity_b = ?) AND e.id != ?
      ORDER BY r.weight DESC
    `, [entityId, entityId, entityId]);

    return {
      totalMentions,
      firstAppearance,
      connectedEntities: connections || []
    };
  }
}

module.exports = EntityService;
