/**
 * AnalyticsCollector — Local Usage Insights
 * 
 * Privacy-safe event logger that records application usage events
 * to the project's local SQLite database. Zero network calls.
 * Never captures manuscript content, character names, or story data.
 * 
 * Tracked events:
 *   app.opened, project.created, chapter.created, scene.created,
 *   entity.created, backup.created, export.started, export.completed
 */
class AnalyticsCollector {
  /**
   * @param {import('../database/db')} databaseManager
   * @param {import('../events/EventBus')} eventBus
   */
  constructor(databaseManager, eventBus) {
    this.db = databaseManager;
    this.eventBus = eventBus;
    this.subscribed = false;
  }

  /**
   * Subscribe to EventBus topics and log them as analytics events.
   * Only logs safe metadata — never content.
   */
  subscribe() {
    if (this.subscribed) return;

    // Map EventBus topics → analytics event names with safe metadata extractors
    const eventMap = {
      "project.created": {
        name: "project.created",
        meta: () => ({})  // No metadata — just the event
      },
      "project.loaded": {
        name: "app.opened",
        meta: () => ({})
      },
      "chapter.created": {
        name: "chapter.created",
        meta: () => ({})
      },
      "scene.created": {
        name: "scene.created",
        meta: () => ({})
      },
      "entity.created": {
        name: "entity.created",
        meta: (payload) => ({ type: payload.type || "unknown" })  // Only entity type, never title/content
      },
      "backup.created": {
        name: "backup.created",
        meta: () => ({})
      },
      "export.started": {
        name: "export.started",
        meta: (payload) => ({ format: payload.format || "unknown" })  // Only format type
      },
      "export.finished": {
        name: "export.completed",
        meta: (payload) => ({ format: payload.format || "unknown" })
      }
    };

    for (const [topic, config] of Object.entries(eventMap)) {
      this.eventBus.subscribe(topic, async (payload) => {
        try {
          await this.logEvent(config.name, config.meta(payload));
        } catch (err) {
          // Analytics should never crash the application
          console.error(`[AnalyticsCollector] Failed to log event "${config.name}":`, err.message);
        }
      });
    }

    this.subscribed = true;
    console.log("[AnalyticsCollector] Local Usage Insights active. Zero network tracking.");
  }

  /**
   * Insert an analytics event into the local database.
   * @param {string} eventName 
   * @param {object} metadata 
   */
  async logEvent(eventName, metadata = {}) {
    if (!this.db.isConnected()) return;

    await this.db.run(
      `INSERT INTO analytics_events (event_name, metadata, created_at) VALUES (?, ?, datetime('now'))`,
      [eventName, JSON.stringify(metadata)]
    );
  }

  /**
   * Get aggregated event counts for the diagnostics/insights view.
   * @returns {Promise<object>}
   */
  async getSummary() {
    if (!this.db.isConnected()) return { events: [], totalEvents: 0 };

    const events = await this.db.all(
      `SELECT event_name, COUNT(*) as count, MAX(created_at) as last_occurred
       FROM analytics_events
       GROUP BY event_name
       ORDER BY count DESC`
    );

    const totalEvents = await this.db.get(
      `SELECT COUNT(*) as total FROM analytics_events`
    );

    const recentEvents = await this.db.all(
      `SELECT event_name, metadata, created_at
       FROM analytics_events
       ORDER BY created_at DESC
       LIMIT 20`
    );

    return {
      events: events || [],
      totalEvents: totalEvents?.total || 0,
      recentEvents: recentEvents || []
    };
  }
}

module.exports = AnalyticsCollector;
