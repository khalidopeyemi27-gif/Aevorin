/**
 * IAIProvider contract interface.
 * Exposes methods to generate AI text completions or suggestions.
 */
class IAIProvider {
  /**
   * Generates a text output from a constructed prompt payload.
   * @param {string} prompt - The raw prompt text.
   * @param {object} options - Configuration overrides (temperature, etc.).
   * @returns {Promise<string>} The parsed textual response.
   */
  async generate(prompt, options = {}) {
    throw new Error("IAIProvider.generate is not implemented.");
  }
}

module.exports = IAIProvider;
