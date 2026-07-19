/**
 * EventTypes enumeration.
 * Maps standardized event names throughout the AEVORIN system layers.
 */
const EventTypes = {
  PROJECT_CREATED: "project.created",
  PROJECT_LOADED: "project.loaded",
  CHAPTER_CREATED: "chapter.created",
  CHAPTER_UPDATED: "chapter.updated",
  SCENE_CREATED: "scene.created",
  SCENE_UPDATED: "scene.updated",
  SCENE_DELETED: "scene.deleted",
  ENTITY_CREATED: "entity.created",
  ENTITY_UPDATED: "entity.updated",
  ENTITY_DELETED: "entity.deleted",
  EXPORT_STARTED: "export.started",
  EXPORT_FINISHED: "export.finished",
  BACKUP_CREATED: "backup.created",
  FEATURE_FLAG_CHANGED: "feature.flag.changed"
};

module.exports = EventTypes;
