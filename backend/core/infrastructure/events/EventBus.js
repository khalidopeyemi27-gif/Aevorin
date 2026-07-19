const EventEmitter = require("events");

/**
 * EventBus class.
 * Central message hub for publishing and subscribing to system events.
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase listener limits if many modules hook into the core
    this.setMaxListeners(100);
  }

  /**
   * Publishes an event to all subscribers.
   * @param {string} eventName - Standardized EventType name.
   * @param {object} payload - Structured event variables.
   */
  publish(eventName, payload = {}) {
    console.log(`[EventBus] Publish: ${eventName}`, JSON.stringify(payload));
    this.emit(eventName, payload);
  }

  /**
   * Subscribes a listener function to a specific event.
   * @param {string} eventName - Standardized EventType name.
   * @param {Function} listener - Callback function.
   */
  subscribe(eventName, listener) {
    this.on(eventName, listener);
  }

  /**
   * Removes a subscription listener.
   * @param {string} eventName - Standardized EventType name.
   * @param {Function} listener - Callback function.
   */
  unsubscribe(eventName, listener) {
    this.off(eventName, listener);
  }
}

module.exports = EventBus;
