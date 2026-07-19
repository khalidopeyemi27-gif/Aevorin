/**
 * IExporter contract interface.
 * Exposes methods to compile manuscript files into books.
 */
class IExporter {
  /**
   * Compiles the manuscript scenes into a structured output document.
   * @param {object} project - Project metadata details.
   * @param {Array<object>} scenes - List of scenes with contents.
   * @param {string} destinationPath - The filepath output location.
   * @returns {Promise<boolean>} Success state of compile task.
   */
  async compile(project, scenes, destinationPath) {
    throw new Error("IExporter.compile is not implemented.");
  }
}

module.exports = IExporter;
