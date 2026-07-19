/**
 * IAnalyticsEngine contract interface.
 * Exposes methods to parse manuscript contents and compile formatting metrics.
 */
class IAnalyticsEngine {
  /**
   * Compiles reading level, dialogue, pacing, and overused words indicators.
   * @param {string} rawText - Combined clean textual draft of scene.
   * @returns {Promise<object>} Map containing analytics vectors.
   */
  async analyze(rawText) {
    throw new Error("IAnalyticsEngine.analyze is not implemented.");
  }
}

module.exports = IAnalyticsEngine;
