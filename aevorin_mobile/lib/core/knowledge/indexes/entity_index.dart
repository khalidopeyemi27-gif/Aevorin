import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../database/database.dart';
import '../../../features/worldbuilding/repositories/entity_repository.dart';

final entityIndexProvider = Provider<EntityIndex>((ref) {
  final repo = ref.watch(entityRepositoryProvider);
  return EntityIndex(repo);
});

/// Cache-aside index for [StoryEntity] lookups.
///
/// Entries are populated lazily on first access and evicted individually when
/// [invalidate] is called. Does NOT eagerly load the full project.
class EntityIndex {
  final EntityRepository _repo;

  final Map<String, StoryEntity> _byId = {};
  final Map<String, List<StoryEntity>> _byType = {};

  EntityIndex(this._repo);

  Future<StoryEntity?> getById(String id) async {
    if (_byId.containsKey(id)) return _byId[id];

    // Repository is the single source of truth; no direct DB access here.
    final entity = await _repo.getEntityById(id);
    if (entity != null) _byId[entity.id] = entity;
    return entity;
  }

  Future<StoryEntity?> getByName(String name, {String? type}) async {
    final lower = name.toLowerCase();

    // Check cache first
    final cached = _byId.values.where((e) {
      final titleMatch = e.title.toLowerCase() == lower;
      return type != null ? titleMatch && e.type == type : titleMatch;
    }).firstOrNull;

    if (cached != null) return cached;

    // Repository fallback
    return _repo.findEntityByName(name, type: type);
  }

  Future<List<StoryEntity>> getByType(String type) async {
    if (_byType.containsKey(type)) return _byType[type]!;

    // Not cached; fallback to repository.
    // The result is NOT cached here to avoid stale type-lists after mutations.
    return _repo.getEntitiesByType(type);
  }

  /// Returns the list of entities (scenes) where this character appears.
  /// Placeholder — populated when Scene indexing is wired.
  Future<List<StoryEntity>> getAppearances(String characterId) async {
    return [];
  }

  void invalidate(String entityId) {
    final entity = _byId.remove(entityId);
    if (entity != null) {
      _byType[entity.type]?.removeWhere((e) => e.id == entityId);
    }
  }

  void invalidateAll() {
    _byId.clear();
    _byType.clear();
  }
}
