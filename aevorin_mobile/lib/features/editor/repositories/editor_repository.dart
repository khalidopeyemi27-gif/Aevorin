import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/database/database.dart';
import '../../../core/utils/ulid.dart';
import '../../projects/services/scene_repository.dart';
import '../../projects/providers/scene_provider.dart';

final editorRepositoryProvider = Provider<EditorRepository>((ref) {
  final db = ref.watch(databaseProvider);
  final sceneRepo = ref.watch(sceneRepositoryProvider);
  return EditorRepository(db, sceneRepo);
});

class EditorRepository {
  final AppDatabase _db;
  final SceneRepository _sceneRepository;

  EditorRepository(this._db, this._sceneRepository);

  Future<void> saveDraftToCache(String sceneId, String contentDelta, String contentHash, int wordCount) async {
    await _db.saveDraft(
      sceneId: sceneId,
      contentDelta: contentDelta,
      contentHash: contentHash,
      wordCount: wordCount,
      syncState: DraftSyncState.pending,
    );
  }

  Future<Draft?> getDraftFromCache(String sceneId) async {
    return _db.getDraft(sceneId);
  }

  Future<void> syncToBackend(String projectId, String sceneId, String htmlContent, int wordCount) async {
    try {
      await _sceneRepository.updateScene(projectId, sceneId, {
        'content': htmlContent,
        'wordCount': wordCount,
      });

      await _db.updateSyncState(
        sceneId: sceneId,
        newState: DraftSyncState.synced,
        lastSyncedAt: DateTime.now(),
        serverVersion: 0, // Scene versioning wired in V1.2.1
      );
    } catch (e) {
      await _db.updateSyncState(sceneId: sceneId, newState: DraftSyncState.failed);
      rethrow;
    }
  }

  Future<void> enqueueSync(String sceneId, String payload) async {
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    final opId = Ulid.generate();
    await _db.enqueueSync(id, opId, 'SCENE', sceneId, 'UPDATE', payload, resourceVersion: 0);
  }
}
