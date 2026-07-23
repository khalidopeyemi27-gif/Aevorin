import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../database/database.dart';
import '../../../features/worldbuilding/repositories/entity_repository.dart';

final relationshipIndexProvider = Provider<RelationshipIndex>((ref) {
  final repo = ref.watch(entityRepositoryProvider);
  return RelationshipIndex(repo);
});



/// Cache-aside index for entity relationship lookups and graph traversal.
class RelationshipIndex {
  final EntityRepository _repo;

  /// Relationships keyed by entityId (either source or target).
  final Map<String, List<EntityRelationship>> _byEntity = {};

  RelationshipIndex(this._repo);

  /// Returns all relationships involving [entityId].
  Future<List<EntityRelationship>> getForEntity(String entityId) async {
    if (_byEntity.containsKey(entityId)) return _byEntity[entityId]!;

    final rels = await _repo.getRelationshipsForEntity(entityId);
    _byEntity[entityId] = rels;
    return rels;
  }

  /// Returns a map of entityId → its relationships, forming an adjacency-list
  /// representation of the full graph for [projectId].
  Future<Map<String, List<EntityRelationship>>> getFullGraph(String projectId) async {
    final all = await _repo.getAllRelationships(projectId);
    final Map<String, List<EntityRelationship>> graph = {};

    for (final rel in all) {
      graph.putIfAbsent(rel.sourceEntityId, () => []).add(rel);
      graph.putIfAbsent(rel.targetEntityId, () => []).add(rel);
    }

    return graph;
  }

  void invalidate(String entityId) {
    _byEntity.remove(entityId);
    // Also evict any entry that references this entity as its counterpart.
    _byEntity.removeWhere((key, rels) =>
      rels.any((r) => r.sourceEntityId == entityId || r.targetEntityId == entityId));
  }

  void invalidateAll() => _byEntity.clear();
}
