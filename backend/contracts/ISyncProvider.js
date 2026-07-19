/**
 * ISyncProvider contract interface.
 * Exposes methods to sync project database revisions to a cloud server (Reserved).
 */
class ISyncProvider {
  /**
   * Syncs database differences with a remote host.
   * @param {string} projectId - Project identifier.
   * @returns {Promise<object>} Sync status summary.
   */
  async sync(projectId) {
    throw new Error("ISyncProvider.sync is not implemented.");
  }
}

module.exports = ISyncProvider;
