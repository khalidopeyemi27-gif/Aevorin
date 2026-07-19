/**
 * AIContextProvider contract interface.
 * Exposes methods to assemble context from the local project database for the AI memory layer.
 */
class AIContextProvider {
  /**
   * Compiles writing context for a given scene.
   * @param {string} projectId - The active project identifier.
   * @param {string} sceneId - The active scene identifier.
   * @returns {Promise<object>} Map containing manuscript, lore, character, and bible context variables.
   */
  async buildContext(projectId, sceneId) {
    throw new Error("AIContextProvider.buildContext is not implemented.");
  }
}

module.exports = AIContextProvider;
