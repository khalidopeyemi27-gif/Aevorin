const ReadabilityService = require("../intelligence/ReadabilityService");
const PacingService = require("../intelligence/PacingService");
const VocabularyService = require("../intelligence/VocabularyService");
const LoreMentionsService = require("../intelligence/LoreMentionsService");

/**
 * AnalyticsService class.
 * Provides offline manuscript statistics, vocabulary density, dialogue ratios, readability scores, and pacing analysis.
 */
class AnalyticsService {
  constructor(sceneRepository, entityRepository, chapterRepository, databaseManager) {
    this.sceneRepository = sceneRepository;
    this.entityRepository = entityRepository;
    this.chapterRepository = chapterRepository;
    this.databaseManager = databaseManager;

    this.readabilityService = new ReadabilityService();
    this.pacingService = new PacingService();
    this.vocabularyService = new VocabularyService();
    this.loreMentionsService = new LoreMentionsService(databaseManager, entityRepository);
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
   * Computes analysis details for a project manuscript draft.
   * Runs readability ease, pacing stddev variance checks, vocabulary variety counts, and co-occurrences.
   */
  async computeAnalytics(projectId) {
    const chapters = await this.chapterRepository.findAllByProject(projectId);
    const scenes = await this.sceneRepository.findAllByProject(projectId);
    const entities = await this.entityRepository.findAllByProject(projectId);

    // Reconstruct full plain text to compute global metrics
    let fullText = "";
    let dialogueWords = 0;
    const povDistribution = {};

    for (const scene of scenes) {
      const text = this.extractTextFromTipTap(scene.content);
      fullText += text + "\n";

      // Dialogue calculations
      const cleanText = text.trim();
      const quotesMatch = cleanText.match(/["“][^"”]*["”]/g);
      if (quotesMatch) {
        for (const match of quotesMatch) {
          const quoteWords = match.replace(/["“”]/g, "").trim().split(/\s+/).filter(Boolean);
          dialogueWords += quoteWords.length;
        }
      }

      // POV tracking
      if (scene.pov_entity_id) {
        povDistribution[scene.pov_entity_id] = (povDistribution[scene.pov_entity_id] || 0) + 1;
      } else {
        povDistribution["unspecified"] = (povDistribution["unspecified"] || 0) + 1;
      }
    }

    const readability = this.readabilityService.computeFleschReadingEase(fullText);
    const pacing = this.pacingService.computeChapterPacing(chapters, scenes);
    const vocabulary = this.vocabularyService.computeVocabulary(fullText);

    // Parse POV list
    const povList = Object.entries(povDistribution).map(([entityId, sceneCount]) => {
      const entity = entities.find(e => e.id === entityId);
      return {
        name: entity ? entity.title : (entityId === "unspecified" ? "No POV Assigned" : "Unknown Character"),
        count: sceneCount
      };
    });

    return {
      totalWords: readability.wordCount,
      dialogueRatio: readability.wordCount > 0 ? (dialogueWords / readability.wordCount) * 100 : 0,
      vocabularyDensity: vocabulary.ttr,
      topRepeatedWords: vocabulary.repeatedPhrases.map(p => ({ word: p.phrase, count: p.count })),
      povDistribution: povList,
      readability,
      pacing
    };
  }

  /**
   * Background runner to perform incremental mentions analysis
   */
  async performBackgroundAnalysis(projectId, sceneId, sceneContent) {
    console.log(`[AnalyticsService] Running background analysis for Scene=${sceneId}`);
    try {
      await this.loreMentionsService.scanSceneMentions(projectId, sceneId, sceneContent);
      console.log(`[AnalyticsService] Mentions scan complete for Scene=${sceneId}`);
    } catch (e) {
      console.error("[AnalyticsService] Error during background scan:", e);
    }
  }
}

module.exports = AnalyticsService;
