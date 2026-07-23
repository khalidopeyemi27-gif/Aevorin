import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../database/database.dart';
import '../../features/worldbuilding/repositories/entity_repository.dart';
import 'indexes/entity_index.dart';
import 'indexes/relationship_index.dart';
import 'indexes/scene_index.dart';
import 'indexes/search_index.dart';
import 'indexes/timeline_index.dart';

final knowledgeEngineProvider = Provider<KnowledgeEngine>((ref) {
  return KnowledgeEngine(
    entityIndex: ref.watch(entityIndexProvider),
    relationshipIndex: ref.watch(relationshipIndexProvider),
    sceneIndex: ref.watch(sceneIndexProvider),
    searchIndex: ref.watch(searchIndexProvider),
    timelineIndex: ref.watch(timelineIndexProvider),
  );
});

/// Façade over all knowledge indexes.
///
/// This is the single entry point for AI components, analysis tools, and search.
/// Nothing above this layer should know about Drift, Repositories, or raw SQL.
///
/// Each index is lazily populated on first access and invalidated when
/// the underlying data changes. The engine does not pre-load the entire
/// project into memory.
class KnowledgeEngine {
  final EntityIndex entityIndex;
  final RelationshipIndex relationshipIndex;
  final SceneIndex sceneIndex;
  final SearchIndex searchIndex;
  final TimelineIndex timelineIndex;

  KnowledgeEngine({
    required this.entityIndex,
    required this.relationshipIndex,
    required this.sceneIndex,
    required this.searchIndex,
    required this.timelineIndex,
  });

  // ---------------------------------------------------------------------------
  // Entity queries
  // ---------------------------------------------------------------------------

  Future<StoryEntity?> findEntityById(String id) =>
      entityIndex.getById(id);

  Future<StoryEntity?> findEntityByName(String name, {String? type}) =>
      entityIndex.getByName(name, type: type);

  Future<List<StoryEntity>> findEntitiesByType(String type) =>
      entityIndex.getByType(type);

  Future<List<StoryEntity>> getCharacterAppearances(String characterId) =>
      entityIndex.getAppearances(characterId);

  // ---------------------------------------------------------------------------
  // Relationship queries
  // ---------------------------------------------------------------------------

  Future<List<EntityRelationship>> getRelationships(String entityId) =>
      relationshipIndex.getForEntity(entityId);

  Future<Map<String, List<EntityRelationship>>> getRelationshipGraph(String projectId) =>
      relationshipIndex.getFullGraph(projectId);

  // ---------------------------------------------------------------------------
  // Scene / Manuscript queries
  // ---------------------------------------------------------------------------

  Future<List<SceneContext>> findScenesContaining(String keyword) =>
      sceneIndex.search(keyword);

  Future<SceneContext?> getSceneContext(String sceneId) =>
      sceneIndex.getContext(sceneId);

  Future<String> getWorldSummary(String projectId) =>
      sceneIndex.getSummary(projectId);

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  Future<SearchResults> search(String projectId, String query) =>
      searchIndex.query(projectId, query);

  // ---------------------------------------------------------------------------
  // Timeline (stub — V1.2.2)
  // ---------------------------------------------------------------------------

  Future<List<TimelineEvent>> getTimeline(String projectId) =>
      timelineIndex.getEvents(projectId);

  // ---------------------------------------------------------------------------
  // Cache invalidation
  // ---------------------------------------------------------------------------

  void invalidateEntity(String entityId) {
    entityIndex.invalidate(entityId);
    relationshipIndex.invalidate(entityId);
    searchIndex.invalidateEntity(entityId);
  }

  void invalidateProject(String projectId) {
    entityIndex.invalidateAll();
    relationshipIndex.invalidateAll();
    sceneIndex.invalidateAll();
    searchIndex.invalidateAll();
  }
}
