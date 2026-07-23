/**
 * SearchService class.
 * Narrative Query Engine parsing filter queries (e.g. status:draft involving:Marino).
 */
class SearchService {
  constructor(sceneRepository, entityRepository) {
    this.sceneRepository = sceneRepository;
    this.entityRepository = entityRepository;
  }

  /**
   * Performs narrative querying over scenes and project lore.
   * @param {string} projectId - Project identifier.
   * @param {string} queryString - Raw search prompt.
   * @returns {Promise<Array<object>>} Matching scenes.
   */
  async search(projectId, queryString) {
    const allScenes = await this.sceneRepository.findAllByProject(projectId);
    const allEntities = await this.entityRepository.findAllByProject(projectId);
    
    // For V1.1 compatibility, we also need chapters. Since we don't have chapterRepository injected directly,
    // we can either fetch them or rely on scene data. Ideally, we fetch them from DB.
    // However, I can query the DB directly here or rely on injected chapter repo.
    const db = require("../../kernel/ApplicationKernel").getContainer().get("databaseManager").activeDb;
    const allChapters = db ? db.prepare("SELECT * FROM chapters").all() : [];

    let cleanQuery = (queryString || "").trim().toLowerCase();
    
    let results = [];

    // Map Chapters
    for (const ch of allChapters) {
      if (cleanQuery === "" || (ch.title && ch.title.toLowerCase().includes(cleanQuery))) {
        results.push({
          id: ch.id,
          type: "CHAPTER",
          title: ch.title,
          content: ch.summary || "",
          keywords: []
        });
      }
    }

    // Map Scenes
    for (const sc of allScenes) {
      const textPool = `${sc.title} ${sc.summary} ${sc.content}`.toLowerCase();
      if (cleanQuery === "" || textPool.includes(cleanQuery)) {
        results.push({
          id: sc.id,
          type: "SCENE",
          title: sc.title,
          content: sc.content || sc.summary || "",
          keywords: []
        });
      }
    }

    // Map Entities (Characters, Items, Worlds, Factions)
    for (const e of allEntities) {
      const textPool = `${e.title} ${e.description} ${e.metadata_json}`.toLowerCase();
      if (cleanQuery === "" || textPool.includes(cleanQuery)) {
        results.push({
          id: e.id,
          type: e.type ? e.type.toUpperCase() : "ENTITY",
          title: e.title,
          content: e.description || "",
          keywords: []
        });
      }
    }

    return results;
  }
}

module.exports = SearchService;
