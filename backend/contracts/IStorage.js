/**
 * IStorage contract interface.
 * Exposes methods to perform local filesystem file/folder actions safely.
 */
class IStorage {
  /**
   * Reads target file contents.
   * @param {string} filePath - Absolute file path on disk.
   * @returns {Promise<string>} Content payload.
   */
  async readFile(filePath) {
    throw new Error("IStorage.readFile is not implemented.");
  }

  /**
   * Writes content payload to a disk path.
   * @param {string} filePath - Absolute file path.
   * @param {string} content - Writing contents.
   * @returns {Promise<void>}
   */
  async writeFile(filePath, content) {
    throw new Error("IStorage.writeFile is not implemented.");
  }
}

module.exports = IStorage;
