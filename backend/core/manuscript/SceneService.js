const { v4: uuidv4 } = require("uuid");
const EventTypes = require("../infrastructure/events/EventTypes");

/**
 * SceneService class.
 * Service coordinating Scene drafting and narrative metadata.
 */
class SceneService {
  constructor(sceneRepository, eventBus) {
    this.sceneRepository = sceneRepository;
    this.eventBus = eventBus;
  }

  /**
   * Fetches scenes by project.
   * @param {string} projectId - Project identifier.
   * @returns {Promise<Array<object>>}
   */
  async getScenes(projectId) {
    return this.sceneRepository.findAllByProject(projectId);
  }

  /**
   * Fetches scenes by chapter.
   * @param {string} chapterId - Chapter identifier.
   * @returns {Promise<Array<object>>}
   */
  async getScenesByChapter(chapterId) {
    return this.sceneRepository.findByChapter(chapterId);
  }

  /**
   * Creates a new scene card.
   * @param {string} projectId - Project identifier.
   * @param {string|null} chapterId - Parent chapter identifier.
   * @param {string} title - Scene name.
   * @returns {Promise<object>} Created scene.
   */
  async createScene(projectId, chapterId = null, title = "") {
    let orderIndex = 0;
    if (chapterId) {
      const existing = await this.sceneRepository.findByChapter(chapterId);
      orderIndex = existing.length;
    } else {
      const all = await this.sceneRepository.findAllByProject(projectId);
      const independent = all.filter(s => !s.chapter_id);
      orderIndex = independent.length;
    }

    const scene = {
      id: uuidv4(),
      projectId,
      chapterId: chapterId || null,
      title: title || `Scene ${orderIndex + 1}`,
      content: "",
      summary: "",
      order_index: orderIndex,
      povEntityId: null,
      purpose: "",
      conflict: "",
      outcome: "",
      wordCount: 0,
      status: "draft",
      mood: "",
      tags: []
    };

    await this.sceneRepository.create(scene);

    this.eventBus.publish(EventTypes.SCENE_CREATED, {
      projectId,
      chapterId,
      sceneId: scene.id,
      title: scene.title
    });

    return scene;
  }

  /**
   * Updates text draft or narrative metadata of a scene.
   * @param {string} id - Scene identifier.
   * @param {object} updates - Map of changes.
   * @returns {Promise<object>} Updated scene from database.
   */
  async updateScene(id, updates) {
    const scene = await this.sceneRepository.findById(id);
    if (!scene) throw new Error("Scene not found");

    // Perform database update
    await this.sceneRepository.update(id, updates);

    // Fetch the fresh updated row from the database to ensure all keys match schema naming
    const updated = await this.sceneRepository.findById(id);

    this.eventBus.publish(EventTypes.SCENE_UPDATED, {
      projectId: updated.project_id,
      chapterId: updated.chapter_id,
      sceneId: id,
      updates
    });

    return updated;
  }

  /**
   * Reorders lists of scenes.
   * @param {string} projectId - Project identifier.
   * @param {Array<object>} sceneOrders - Array of objects containing { id, chapterId, orderIndex }
   * @returns {Promise<void>}
   */
  async reorderScenes(projectId, sceneOrders) {
    for (const item of sceneOrders) {
      const updates = {
        chapterId: item.chapterId || null,
        orderIndex: item.orderIndex
      };
      await this.sceneRepository.update(item.id, updates);
    }

    this.eventBus.publish(EventTypes.SCENE_UPDATED, {
      projectId,
      reordered: true
    });
  }

  /**
   * Deletes a scene card.
   * @param {string} id - Scene identifier.
   * @returns {Promise<void>}
   */
  async deleteScene(id) {
    const scene = await this.sceneRepository.findById(id);
    if (!scene) throw new Error("Scene not found");

    await this.sceneRepository.delete(id);

    this.eventBus.publish(EventTypes.SCENE_DELETED, {
      projectId: scene.project_id,
      chapterId: scene.chapter_id,
      sceneId: id
    });
  }
}

module.exports = SceneService;
