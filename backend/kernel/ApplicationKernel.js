const ServiceContainer = require("./ServiceContainer");
const EventBus = require("../core/infrastructure/events/EventBus");
const FeatureRegistry = require("../core/infrastructure/feature/FeatureRegistry");
const DatabaseManager = require("../core/infrastructure/database/db");
const ProjectManager = require("../core/workspace/ProjectManager");
const BackupManager = require("../core/infrastructure/backup/BackupManager");
const AnalyticsCollector = require("../core/infrastructure/analytics/AnalyticsCollector");

// Manuscript Core Repositories & Services
const ChapterRepository = require("../core/manuscript/repositories/ChapterRepository");
const SceneRepository = require("../core/manuscript/repositories/SceneRepository");
const ChapterService = require("../core/manuscript/ChapterService");
const SceneService = require("../core/manuscript/SceneService");
const ExportService = require("../core/manuscript/ExportService");
const SearchService = require("../core/manuscript/SearchService");
const AnalyticsService = require("../core/manuscript/AnalyticsService");
const VersionService = require("../core/manuscript/VersionService");

// Knowledge Core Repositories & Services
const EntityRepository = require("../core/knowledge/repositories/EntityRepository");
const EntityService = require("../core/knowledge/EntityService");
const AIContextService = require("../core/ai/AIContextService");
const CanonRepository = require("../core/knowledge/repositories/CanonRepository");
const CanonService = require("../core/knowledge/CanonService");

/**
 * ApplicationKernel class (Singleton).
 * Coordinates core subsystems start sequences, registers singletons, and listens for event cycles.
 */
class ApplicationKernel {
  constructor() {
    this.container = new ServiceContainer();
    this.isBooted = false;
  }

  /**
   * Bootstraps system infrastructure and registers services.
   */
  async boot() {
    if (this.isBooted) return;

    console.log("AEVORIN Kernel Booting...");

    // Instantiate Infrastructure
    const eventBus = new EventBus();
    const featureRegistry = new FeatureRegistry();
    const databaseManager = new DatabaseManager(eventBus);
    const projectManager = new ProjectManager(databaseManager, eventBus);
    const backupManager = new BackupManager(databaseManager, projectManager);
    const analyticsCollector = new AnalyticsCollector(databaseManager, eventBus);

    // Instantiate Repositories
    const chapterRepository = new ChapterRepository(databaseManager);
    const sceneRepository = new SceneRepository(databaseManager);
    const entityRepository = new EntityRepository(databaseManager);
    const canonRepository = new CanonRepository(databaseManager);

    // Instantiate Services
    const chapterService = new ChapterService(chapterRepository, sceneRepository, eventBus);
    const sceneService = new SceneService(sceneRepository, eventBus);
    const entityService = new EntityService(entityRepository, eventBus);
    const exportService = new ExportService(chapterRepository, sceneRepository, projectManager, eventBus);
    const searchService = new SearchService(sceneRepository, entityRepository);
    const analyticsService = new AnalyticsService(sceneRepository, entityRepository, chapterRepository, databaseManager);
    const versionService = new VersionService(databaseManager);
    const aiContextService = new AIContextService(sceneRepository, entityRepository, chapterRepository, databaseManager);
    const canonService = new CanonService(canonRepository, sceneRepository, entityRepository);

    // Register Services
    this.container.register("eventBus", eventBus);
    this.container.register("featureRegistry", featureRegistry);
    this.container.register("databaseManager", databaseManager);
    this.container.register("projectManager", projectManager);
    this.container.register("backupManager", backupManager);
    this.container.register("analyticsCollector", analyticsCollector);

    // Register Manuscript Core
    this.container.register("chapterRepository", chapterRepository);
    this.container.register("sceneRepository", sceneRepository);
    this.container.register("chapterService", chapterService);
    this.container.register("sceneService", sceneService);
    this.container.register("exportService", exportService);
    this.container.register("searchService", searchService);
    this.container.register("analyticsService", analyticsService);
    this.container.register("versionService", versionService);

    // Register Knowledge Core
    this.container.register("entityRepository", entityRepository);
    this.container.register("entityService", entityService);
    this.container.register("aiContextService", aiContextService);
    this.container.register("canonRepository", canonRepository);
    this.container.register("canonService", canonService);

    // Setup global subscriptions
    analyticsCollector.subscribe();
    this.setupEventListeners();

    console.log("AEVORIN Kernel Started");
    console.log("Database initialized");
    console.log("Feature Registry loaded");
    console.log("Event Bus online");

    this.isBooted = true;
  }

  /**
   * Binds central audit log event hooks.
   */
  setupEventListeners() {
    const eventBus = this.container.get("eventBus");

    eventBus.subscribe("project.created", (payload) => {
      console.log(`[Kernel] Audit: Project created: ID=${payload.id}, Path=${payload.path}`);
    });

    eventBus.subscribe("project.loaded", (payload) => {
      console.log(`[Kernel] Audit: Project loaded: ID=${payload.id}, Path=${payload.path}`);
    });

    eventBus.subscribe("chapter.created", (payload) => {
      console.log(`[Kernel] Audit: Chapter created: ID=${payload.chapterId}, Title=${payload.title}`);
    });

    eventBus.subscribe("scene.created", (payload) => {
      console.log(`[Kernel] Audit: Scene created: ID=${payload.sceneId}, Title=${payload.title}`);
    });

    eventBus.subscribe("entity.created", (payload) => {
      console.log(`[Kernel] Audit: Entity created: ID=${payload.entityId}, Type=${payload.type}, Title=${payload.title}`);
    });

    eventBus.subscribe("export.started", (payload) => {
      console.log(`[Kernel] Audit: Export started: format=${payload.format}, project=${payload.projectId}`);
    });

    eventBus.subscribe("export.finished", (payload) => {
      console.log(`[Kernel] Audit: Export complete: format=${payload.format}, path=${payload.path}`);
    });

    eventBus.subscribe("scene.updated", (payload) => {
      if (payload.updates && payload.updates.content) {
        const dbManager = this.container.get("databaseManager");
        const analyticsService = this.container.get("analyticsService");
        setImmediate(async () => {
          try {
            if (!dbManager.isConnected()) return;
            await analyticsService.performBackgroundAnalysis(payload.projectId, payload.sceneId, payload.updates.content);
          } catch (e) {
            console.error("[Kernel] Background mentions scanning failed:", e);
          }
        });
      }
    });
  }

  /**
   * Releases active SQLite file handlers.
   */
  async shutdown() {
    if (!this.isBooted) return;

    const dbManager = this.container.get("databaseManager");
    await dbManager.closeDatabase();

    console.log("AEVORIN Kernel Shutdown Complete");
    this.isBooted = false;
  }

  /**
   * Exposes ServiceContainer.
   * @returns {ServiceContainer}
   */
  getContainer() {
    return this.container;
  }
}

// Export singleton instance
module.exports = new ApplicationKernel();
