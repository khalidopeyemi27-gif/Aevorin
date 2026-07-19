class AIContextService {
  constructor(sceneRepository, entityRepository, chapterRepository, databaseManager) {
    this.sceneRepository = sceneRepository;
    this.entityRepository = entityRepository;
    this.chapterRepository = chapterRepository;
    this.databaseManager = databaseManager;
  }

  /**
   * Helper to extract plain text from TipTap editor JSON document.
   */
  extractTextFromTipTap(content) {
    if (!content) return "";
    try {
      const doc = typeof content === "string" ? JSON.parse(content) : content;
      let text = "";
      const traverse = (node) => {
        if (node.type === "text") {
          text += node.text;
        } else if (node.content) {
          for (const child of node.content) {
            traverse(child);
          }
        }
        if (node.type === "paragraph" || node.type === "heading") {
          text += "\n";
        }
      };
      traverse(doc);
      return text;
    } catch (e) {
      return typeof content === "string" ? content : "";
    }
  }

  /**
   * Compiles structured context for LLM prompts.
   * @param {string} projectId - Project identifier.
   * @param {string} sceneId - Scene identifier.
   * @returns {Promise<object>} Structured context.
   */
  async buildSceneAIContext(projectId, sceneId) {
    // 1. Fetch active scene details
    const scene = await this.sceneRepository.findById(sceneId);
    if (!scene) throw new Error("Scene not found");

    const sceneText = this.extractTextFromTipTap(scene.content);

    // 2. Fetch preceding scene summaries (sort by chapter order index and scene order index)
    const allScenes = await this.sceneRepository.findAllByProject(projectId);
    
    // Filter to find other scenes in narrative timeline
    const precedingScenes = allScenes
      .filter(s => s.id !== sceneId)
      .slice(0, 5) // Limit to top 5 previous scenes to preserve context window limits
      .map(s => ({
        title: s.title,
        summary: s.summary || "No summary provided",
        wordCount: s.word_count || 0
      }));

    // 3. Find characters and locations mentioned in the current scene content
    const entities = await this.entityRepository.findAllByProject(projectId);
    const lowercaseText = sceneText.toLowerCase();

    const characters = [];
    const locations = [];

    for (const ent of entities) {
      const title = ent.title.toLowerCase();
      if (lowercaseText.includes(title)) {
        const item = {
          title: ent.title,
          summary: ent.summary || "",
          metadata: ent.metadata ? JSON.parse(ent.metadata) : {}
        };
        if (ent.type === "character") {
          characters.push(item);
        } else if (ent.type === "location") {
          locations.push(item);
        }
      }
    }

    // 4. Fetch timeline events for context
    const timelineEvents = await this.databaseManager.all(`
      SELECT title, description, chronological_date 
      FROM timeline_events 
      WHERE project_id = ? 
      ORDER BY chronological_date ASC 
      LIMIT 10
    `, [projectId]);

    // 5. Gather writing style telemetry (averages from the project analytics)
    const statsSql = `SELECT SUM(word_count) as totalWords FROM scenes WHERE project_id = ?`;
    const statsRow = await this.databaseManager.get(statsSql, [projectId]);
    const totalWords = statsRow?.totalWords || 0;

    return {
      currentScene: {
        title: scene.title,
        content: sceneText,
        wordCount: scene.word_count || 0
      },
      previousScenes: precedingScenes,
      characters,
      locations,
      timeline: timelineEvents || [],
      writingStyle: {
        totalProjectWords: totalWords,
        avgSceneLength: allScenes.length > 0 ? Math.round(totalWords / allScenes.length) : 0
      }
    };
  }
}

module.exports = AIContextService;
