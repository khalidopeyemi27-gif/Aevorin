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
    if (!queryString || queryString.trim() === "") {
      return this.sceneRepository.findAllByProject(projectId);
    }

    const allScenes = await this.sceneRepository.findAllByProject(projectId);
    const allEntities = await this.entityRepository.findAllByProject(projectId);

    // 1. Parse Filter Criteria
    let statusFilter = null;
    let involvingFilter = null;
    let cleanQuery = queryString;

    // Matches status:draft or status:in_progress
    const statusMatch = queryString.match(/status:([^\s]+)/i);
    if (statusMatch) {
      statusFilter = statusMatch[1].toLowerCase();
      cleanQuery = cleanQuery.replace(statusMatch[0], "");
    }

    // Matches involving:Marino
    const involvingMatch = queryString.match(/involving:([^\s]+)/i);
    if (involvingMatch) {
      involvingFilter = involvingMatch[1].toLowerCase();
      cleanQuery = cleanQuery.replace(involvingMatch[0], "");
    }

    cleanQuery = cleanQuery.trim().toLowerCase();

    // 2. Perform filtering
    return allScenes.filter(scene => {
      // Status Filter match
      if (statusFilter && scene.status.toLowerCase() !== statusFilter) {
        return false;
      }

      // Involving Character/Entity filter match
      if (involvingFilter) {
        // Resolve entity ID from name
        const matchEntities = allEntities.filter(e => e.title.toLowerCase().includes(involvingFilter));
        const matchIds = matchEntities.map(e => e.id);

        let entityMatch = false;

        // Is POV
        if (scene.pov_entity_id && matchIds.includes(scene.pov_entity_id)) {
          entityMatch = true;
        }

        // Is name referenced in title, summary, or content
        const searchPool = `${scene.title} ${scene.summary} ${scene.content}`.toLowerCase();
        if (searchPool.includes(involvingFilter)) {
          entityMatch = true;
        }

        if (!entityMatch) return false;
      }

      // Text keywords search match
      if (cleanQuery !== "") {
        const textPool = `${scene.title} ${scene.summary} ${scene.content}`.toLowerCase();
        if (!textPool.includes(cleanQuery)) {
          return false;
        }
      }

      return true;
    });
  }
}

module.exports = SearchService;
