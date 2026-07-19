/**
 * ServiceContainer class.
 * Implements dependency injection registry resolving system singletons dynamically.
 */
class ServiceContainer {
  constructor() {
    this.services = new Map();
  }

  /**
   * Registers a service singleton instance.
   * @param {string} name - Unique identifier key.
   * @param {any} instance - Instantiated service.
   */
  register(name, instance) {
    console.log(`[ServiceContainer] Service registered: ${name}`);
    this.services.set(name, instance);
  }

  /**
   * Resolves and returns a registered service singleton.
   * @param {string} name - Unique identifier key.
   * @returns {any}
   */
  get(name) {
    if (!this.services.has(name)) {
      throw new Error(`[ServiceContainer] Service '${name}' not found.`);
    }
    return this.services.get(name);
  }
}

module.exports = ServiceContainer;
