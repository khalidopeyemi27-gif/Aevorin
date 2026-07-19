/**
 * IPlugin contract interface.
 * Defines lifecycle methods for extension scripts.
 */
class IPlugin {
  /**
   * Initializes the plugin.
   * @param {object} serviceContainer - Container for resolving AEVORIN core services.
   * @returns {Promise<void>}
   */
  async initialize(serviceContainer) {
    throw new Error("IPlugin.initialize is not implemented.");
  }

  /**
   * Cleans up hooks upon disabling the plugin.
   * @returns {Promise<void>}
   */
  async disable() {
    throw new Error("IPlugin.disable is not implemented.");
  }
}

module.exports = IPlugin;
