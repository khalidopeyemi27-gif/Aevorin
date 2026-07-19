const { v4: uuidv4 } = require("uuid");

class LoreMentionsService {
  constructor(databaseManager, entityRepository) {
    this.databaseManager = databaseManager;
    this.entityRepository = entityRepository;
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
   * Scans a scene's text draft and detects entity mentions.
   * Updates entity_mentions and entity_relationships co-occurrence weights.
   */
  async scanSceneMentions(projectId, sceneId, sceneContent) {
    const text = this.extractTextFromTipTap(sceneContent);
    if (!text || text.trim() === "") return;

    const lowercaseText = text.toLowerCase();

    // 1. Fetch all lore entities in the project
    const entities = await this.entityRepository.findAllByProject(projectId);

    // Clean old mentions for this scene
    await this.databaseManager.run(`DELETE FROM entity_mentions WHERE scene_id = ?`, [sceneId]);

    const activeMentions = [];

    // 2. Scan and record matches
    for (const ent of entities) {
      const name = ent.title.toLowerCase();
      // Simple word match boundary search
      const regex = new RegExp(`\\b${this.escapeRegExp(name)}\\b`, 'g');
      const matches = [...lowercaseText.matchAll(regex)];

      if (matches.length > 0) {
        const count = matches.length;
        const firstPosition = matches[0].index || 0;
        const id = uuidv4();

        await this.databaseManager.run(`
          INSERT INTO entity_mentions (id, entity_id, scene_id, count, first_position)
          VALUES (?, ?, ?, ?, ?)
        `, [id, ent.id, sceneId, count, firstPosition]);

        activeMentions.push(ent.id);
      }
    }

    // 3. Update Co-occurrence weights for entity relations
    // Any two entities mentioned in the same scene co-occur.
    for (let k = 0; k < activeMentions.length; k++) {
      for (let j = k + 1; j < activeMentions.length; j++) {
        const entA = activeMentions[k];
        const entB = activeMentions[j];

        // Keep alphabetical order of IDs to avoid duplicates (A->B and B->A)
        const [first, second] = entA < entB ? [entA, entB] : [entB, entA];

        // Check if co-occurrence relationship already exists
        const existing = await this.databaseManager.get(`
          SELECT weight FROM entity_relationships 
          WHERE entity_a = ? AND entity_b = ?
        `, [first, second]);

        if (existing) {
          await this.databaseManager.run(`
            UPDATE entity_relationships 
            SET weight = weight + 1 
            WHERE entity_a = ? AND entity_b = ?
          `, [first, second]);
        } else {
          await this.databaseManager.run(`
            INSERT INTO entity_relationships (entity_a, entity_b, relationship_type, weight)
            VALUES (?, ?, ?, ?)
          `, [first, second, "appeared_with", 1]);
        }
      }
    }
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = LoreMentionsService;
