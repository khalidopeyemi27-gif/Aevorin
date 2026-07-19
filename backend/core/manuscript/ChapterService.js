const { v4: uuidv4 } = require("uuid");
const EventTypes = require("../infrastructure/events/EventTypes");

/**
 * ChapterService class.
 * Service coordinating Chapter modifications.
 */
class ChapterService {
  constructor(chapterRepository, sceneRepository, eventBus) {
    this.chapterRepository = chapterRepository;
    this.sceneRepository = sceneRepository;
    this.eventBus = eventBus;
  }

  /**
   * Fetches sorted list of chapters.
   * @param {string} projectId - Project identifier.
   * @returns {Promise<Array<object>>}
   */
  async getChapters(projectId) {
    return this.chapterRepository.findAllByProject(projectId);
  }

  /**
   * Creates a new chapter at the end of the manuscript list.
   * @param {string} projectId - Project identifier.
   * @param {string} title - Chapter name.
   * @returns {Promise<object>} Created chapter.
   */
  async createChapter(projectId, title) {
    const existing = await this.chapterRepository.findAllByProject(projectId);
    const orderIndex = existing.length;

    const chapter = {
      id: uuidv4(),
      projectId,
      title: title || `Chapter ${orderIndex + 1}`,
      order_index: orderIndex
    };

    await this.chapterRepository.create(chapter);

    this.eventBus.publish(EventTypes.CHAPTER_CREATED, {
      projectId,
      chapterId: chapter.id,
      title: chapter.title
    });

    return chapter;
  }

  /**
   * Modifies a chapter title.
   * @param {string} id - Chapter identifier.
   * @param {string} title - New chapter name.
   * @returns {Promise<object>} Updated chapter.
   */
  async renameChapter(id, title) {
    const chapter = await this.chapterRepository.findById(id);
    if (!chapter) throw new Error("Chapter not found");

    const updates = {
      title,
      order_index: chapter.order_index
    };

    await this.chapterRepository.update(id, updates);

    this.eventBus.publish(EventTypes.CHAPTER_UPDATED, {
      projectId: chapter.project_id,
      chapterId: id,
      title
    });

    return { ...chapter, title };
  }

  /**
   * Deletes a chapter. Detaches scenes inside it (setting chapter_id = null).
   * @param {string} id - Chapter identifier.
   * @returns {Promise<void>}
   */
  async deleteChapter(id) {
    const chapter = await this.chapterRepository.findById(id);
    if (!chapter) throw new Error("Chapter not found");

    const projectId = chapter.project_id;

    // Detach all scenes associated with this chapter
    const associatedScenes = await this.sceneRepository.findByChapter(id);
    for (const scene of associatedScenes) {
      await this.sceneRepository.update(scene.id, { chapterId: null });
      this.eventBus.publish(EventTypes.SCENE_UPDATED, {
        projectId,
        sceneId: scene.id,
        detached: true
      });
    }

    // Delete chapter row
    await this.chapterRepository.delete(id);

    // Re-index remaining chapters to ensure sequential order indexes
    const remaining = await this.chapterRepository.findAllByProject(projectId);
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order_index !== i) {
        await this.chapterRepository.update(remaining[i].id, {
          title: remaining[i].title,
          order_index: i
        });
      }
    }

    this.eventBus.publish(EventTypes.CHAPTER_UPDATED, {
      projectId,
      chapterId: id,
      deleted: true
    });
  }
}

module.exports = ChapterService;
