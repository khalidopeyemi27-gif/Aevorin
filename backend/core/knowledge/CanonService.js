/**
 * CanonService class.
 * Service managing story rules validation, character property changes state resolution,
 * relationship replay tracking, and diagnostics warning reports.
 */
class CanonService {
  constructor(canonRepository, sceneRepository, entityRepository) {
    this.canonRepository = canonRepository;
    this.sceneRepository = sceneRepository;
    this.entityRepository = entityRepository;
  }

  // --- CHARACTER STATE RESOLUTION ENGINE ---
  /**
   * Resolves character state at a specific position key.
   * @param {string} characterId - Profile character ID
   * @param {string} positionKey - Chronological order key (e.g. '007.003')
   * @returns {Promise<object>} Compiled state.
   */
  async resolveCharacterStateAt(characterId, positionKey) {
    const changes = await this.canonRepository.getCharacterChangesByCharacter(characterId);
    
    // Filter by positionKey and sort
    const relevant = changes
      .filter(c => c.position_key <= positionKey)
      .sort((a, b) => a.position_key.localeCompare(b.position_key));

    const state = {};
    for (const c of relevant) {
      state[c.field] = c.new_value;
    }
    return state;
  }

  // --- RELATIONSHIP REPLAY ENGINE ---
  /**
   * Replays relationship changes up to a given position key.
   * @param {string} projectId - Project identifier.
   * @param {string} positionKey - Chronological position key.
   * @returns {Promise<Array<object>>} Compiled active relationships.
   */
  async replayRelationshipsUpTo(projectId, positionKey) {
    const all = await this.canonRepository.getRelationshipChanges(projectId);
    
    // Filter and sort
    const relevant = all
      .filter(m => m.position_key <= positionKey)
      .sort((a, b) => a.position_key.localeCompare(b.position_key));

    const activeMap = new Map();
    for (const m of relevant) {
      const pairKey = [m.character_a, m.character_b].sort().join("<=>");
      activeMap.set(pairKey, {
        characterA: m.character_a,
        characterB: m.character_b,
        oldRelationship: m.old_relationship,
        newRelationship: m.new_relationship,
        reason: m.reason,
        positionKey: m.position_key,
        eventId: m.event_id
      });
    }

    return Array.from(activeMap.values());
  }

  // --- CONTINUITY CHECKERS ---
  /**
   * Checks a scene draft text content for character and rules contradictions.
   * Runs local checkers on the text.
   */
  async checkSceneConsistency(projectId, sceneId, text) {
    // Clear any previous reports for this scene to prevent duplicate warnings accumulation
    await this.canonRepository.clearContinuityReportsForScene(sceneId);

    if (!text || text.trim() === "") return [];

    const scene = await this.sceneRepository.findById(sceneId);
    if (!scene) throw new Error("Scene not found");

    // Construct a sortable position key: pad chapter & scene order indexes
    let chapterOrder = 0;
    if (scene.chapter_id) {
      const chapter = await this.canonRepository.dbManager.get(
        `SELECT order_index FROM chapters WHERE id = ?`,
        [scene.chapter_id]
      );
      if (chapter) {
        chapterOrder = chapter.order_index;
      }
    }
    const chIdx = String(chapterOrder).padStart(3, "0");
    const scIdx = String(scene.order_index || 0).padStart(3, "0");
    const positionKey = `${chIdx}.${scIdx}`;

    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
    const reports = [];

    // Fetch all standard entities in this project
    const allEntities = await this.entityRepository.findAllByProject(projectId);
    const characters = allEntities.filter(e => e.type === "character");
    const worldRules = allEntities.filter(e => e.type === "rule");

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const sentenceLower = sentence.toLowerCase();

      // --- 1. CHARACTER CHECKER ---
      for (const char of characters) {
        const charName = char.title.toLowerCase();
        if (sentenceLower.includes(charName)) {
          // Resolve state of character at this scene position
          const state = await this.resolveCharacterStateAt(char.id, positionKey);

          // Physical Contradiction: Lost/Missing Arm
          const leftArmValue = (state.left_arm || "").toLowerCase();
          const hasLostLeftArm = 
            leftArmValue === "lost" || 
            leftArmValue === "missing" || 
            leftArmValue === "amputated";

          if (hasLostLeftArm) {
            const usesLeftLimb = 
              sentenceLower.includes("left hand") || 
              sentenceLower.includes("left arm") || 
              sentenceLower.includes("left wrist") || 
              sentenceLower.includes("left fingers");

            const isLossEvent = 
              sentenceLower.includes("lost") || 
              sentenceLower.includes("severed") || 
              sentenceLower.includes("cut off") || 
              sentenceLower.includes("amputated");

            if (usesLeftLimb && !isLossEvent) {
              const rep = {
                projectId,
                sceneId,
                type: "character",
                severity: "critical",
                message: `${char.title} is described using their left arm/hand, but memory states indicate it is lost or amputated at this point in the timeline.`,
                affectedEntityId: char.id,
                evidence: sentence,
                confidence: 0.98
              };
              reports.push(rep);
              await this.canonRepository.createContinuityReport(rep);
            }
          }

          // Sensory Contradiction: Blindness
          const isBlind = 
            state.blind === "true" || 
            state.blind === true || 
            state.status === "blind" || 
            state.blindness === "true";

          if (isBlind) {
            const visualAction = 
              sentenceLower.includes(" saw ") || 
              sentenceLower.includes(" looked ") || 
              sentenceLower.includes(" stared ") || 
              sentenceLower.includes(" read ") || 
              sentenceLower.includes(" gazed ") || 
              sentenceLower.includes(" watched ");

            if (visualAction) {
              const rep = {
                projectId,
                sceneId,
                type: "character",
                severity: "critical",
                message: `${char.title} is marked as blind at this timeline milestone, but performs a visual action in this sentence.`,
                affectedEntityId: char.id,
                evidence: sentence,
                confidence: 0.95
              };
              reports.push(rep);
              await this.canonRepository.createContinuityReport(rep);
            }
          }

          // Status Contradiction: Dead
          const isDeceased = 
            state.alive === "false" || 
            state.status === "dead" || 
            state.status === "deceased" || 
            state.alive === false;

          if (isDeceased) {
            const activeAction = 
              sentenceLower.includes(" walked") || 
              sentenceLower.includes(" spoke") || 
              sentenceLower.includes(" ran") || 
              sentenceLower.includes(" smiled") || 
              sentenceLower.includes(" fought") || 
              sentenceLower.includes(" laughed");

            if (activeAction) {
              const rep = {
                projectId,
                sceneId,
                type: "character",
                severity: "critical",
                message: `${char.title} is deceased at this timeline checkpoint, but performs active narrative actions in this sentence.`,
                affectedEntityId: char.id,
                evidence: sentence,
                confidence: 0.99
              };
              reports.push(rep);
              await this.canonRepository.createContinuityReport(rep);
            }
          }
        }
      }

      // --- 2. WORLD RULE CHECKER ---
      for (const rule of worldRules) {
        const ruleName = rule.title.toLowerCase();
        if (sentenceLower.includes(ruleName)) {
          const details = (rule.summary || "").toLowerCase();
          if (details.includes("cannot") || details.includes("must not") || details.includes("limit")) {
            const rep = {
              projectId,
              sceneId,
              type: "world",
              severity: "warning",
              message: `Potential conflict with World Rule "${rule.title}": "${rule.summary}"`,
              affectedEntityId: rule.id,
              evidence: sentence,
              confidence: 0.75
            };
            reports.push(rep);
            await this.canonRepository.createContinuityReport(rep);
          }
        }
      }
    }

    return reports;
  }
}

module.exports = CanonService;
