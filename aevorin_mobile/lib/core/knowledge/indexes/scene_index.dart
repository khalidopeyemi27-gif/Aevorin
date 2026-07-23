import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../database/database.dart';

final sceneIndexProvider = Provider<SceneIndex>((ref) {
  final db = ref.watch(databaseProvider);
  return SceneIndex(db);
});

class SceneContext {
  final String sceneId;
  final String title;
  final String? chapterId;
  final String? excerpt;
  final int wordCount;

  SceneContext({
    required this.sceneId,
    required this.title,
    this.chapterId,
    this.excerpt,
    this.wordCount = 0,
  });
}

/// Manuscript structural index.
/// Provides scene lookups, keyword search within scene content, and
/// project-level summary generation.
class SceneIndex {
  final AppDatabase _db;

  final Map<String, SceneContext> _byId = {};

  SceneIndex(this._db);

  Future<SceneContext?> getContext(String sceneId) async {
    if (_byId.containsKey(sceneId)) return _byId[sceneId];

    final draft = await _db.getDraft(sceneId);
    if (draft == null) return null;

    final ctx = SceneContext(
      sceneId: sceneId,
      title: 'Scene $sceneId',
      excerpt: draft.contentDelta != null && draft.contentDelta!.length > 200
          ? draft.contentDelta!.substring(0, 200)
          : draft.contentDelta,
      wordCount: draft.wordCount,
    );

    _byId[sceneId] = ctx;
    return ctx;
  }

  /// Simple keyword search over cached draft content.
  Future<List<SceneContext>> search(String keyword) async {
    final lower = keyword.toLowerCase();
    final results = <SceneContext>[];

    for (final ctx in _byId.values) {
      if ((ctx.excerpt ?? '').toLowerCase().contains(lower) ||
          ctx.title.toLowerCase().contains(lower)) {
        results.add(ctx);
      }
    }

    return results;
  }

  /// Returns a high-level summary of the project's manuscript.
  /// In V1.2.1 this will be powered by AI; for now it returns a stat string.
  Future<String> getSummary(String projectId) async {
    final totalWords = _byId.values.fold<int>(0, (sum, s) => sum + s.wordCount);
    final sceneCount = _byId.length;
    return '$sceneCount scenes indexed, ~$totalWords words.';
  }

  void invalidateAll() => _byId.clear();
}
