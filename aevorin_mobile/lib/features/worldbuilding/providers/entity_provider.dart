import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/database/database.dart';
import '../../workspace/providers/workspace_provider.dart';
import '../repositories/entity_repository.dart';

final entitiesProvider = StreamProvider<List<StoryEntity>>((ref) {
  final workspaceState = ref.watch(workspaceControllerProvider);
  if (workspaceState.project == null) return const Stream.empty();
  
  final repo = ref.watch(entityRepositoryProvider);
  return repo.watchEntities(workspaceState.project!.id);
});

final entityActionsProvider = Provider<EntityActions>((ref) {
  final repo = ref.watch(entityRepositoryProvider);
  final workspaceState = ref.watch(workspaceControllerProvider);
  
  return EntityActions(repo, workspaceState.project?.id);
});

class EntityActions {
  final EntityRepository _repo;
  final String? _projectId;

  EntityActions(this._repo, this._projectId);

  Future<void> fetchAndCache() async {
    if (_projectId == null) return;
    await _repo.fetchAndCacheEntities(_projectId!);
  }

  Future<void> createEntity(String type, String title, String summary, Map<String, dynamic> metadata) async {
    if (_projectId == null) return;
    await _repo.createEntity(_projectId!, type, title, summary, metadata);
  }

  Future<void> updateEntity(String entityId, Map<String, dynamic> updates) async {
    if (_projectId == null) return;
    await _repo.updateEntity(_projectId!, entityId, updates);
  }

  Future<void> deleteEntity(String entityId) async {
    if (_projectId == null) return;
    await _repo.deleteEntity(_projectId!, entityId);
  }
}
