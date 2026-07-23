import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../database/database.dart';

final searchIndexProvider = Provider<SearchIndex>((ref) {
  final db = ref.watch(databaseProvider);
  return SearchIndex(db);
});

class SearchResultItem {
  final String id;
  final String type; // 'entity', 'scene', 'relationship'
  final String title;
  final String? excerpt;
  final String category; // 'Manuscript' or 'Worldbuilding'

  const SearchResultItem({
    required this.id,
    required this.type,
    required this.title,
    this.excerpt,
    required this.category,
  });
}

class SearchResults {
  final List<SearchResultItem> manuscript;
  final List<SearchResultItem> worldbuilding;

  const SearchResults({
    this.manuscript = const [],
    this.worldbuilding = const [],
  });

  bool get isEmpty => manuscript.isEmpty && worldbuilding.isEmpty;
  int get totalCount => manuscript.length + worldbuilding.length;
}

/// Text-based search index backed by Drift queries.
///
/// This is the swap point for semantic/embedding-based search in V1.3:
/// replace the [query] implementation without changing the interface.
class SearchIndex {
  final AppDatabase _db;

  // In-memory index of entity name → id for quick lookups.
  final Map<String, String> _entityNameIndex = {};

  SearchIndex(this._db);

  Future<SearchResults> query(String projectId, String q) async {
    if (q.trim().isEmpty) return const SearchResults();

    final lower = q.toLowerCase();
    final manuscript = <SearchResultItem>[];
    final worldbuilding = <SearchResultItem>[];

    // Search entities
    final entities = await (
      _db.select(_db.storyEntities)
        ..where((t) => t.projectId.equals(projectId))
    ).get();

    for (final e in entities) {
      if (e.title.toLowerCase().contains(lower) ||
          (e.description ?? '').toLowerCase().contains(lower)) {
        worldbuilding.add(SearchResultItem(
          id: e.id,
          type: 'entity',
          title: e.title,
          excerpt: e.description,
          category: 'Worldbuilding',
        ));
      }
      // Keep name index up to date
      _entityNameIndex[e.title.toLowerCase()] = e.id;
    }

    // Search relationships (notes / descriptions)
    final relationships = await (
      _db.select(_db.entityRelationships)
        ..where((t) => t.projectId.equals(projectId))
    ).get();

    for (final r in relationships) {
      final notesMatch = (r.notes ?? '').toLowerCase().contains(lower);
      final descMatch = (r.description ?? '').toLowerCase().contains(lower);
      if (notesMatch || descMatch) {
        worldbuilding.add(SearchResultItem(
          id: r.id,
          type: 'relationship',
          title: '${r.relationshipType} (${r.sourceEntityId} → ${r.targetEntityId})',
          excerpt: r.notes ?? r.description,
          category: 'Worldbuilding',
        ));
      }
    }

    // Search scene drafts
    final drafts = await _db.select(_db.drafts).get();
    for (final d in drafts) {
      if ((d.contentDelta ?? '').toLowerCase().contains(lower)) {
        manuscript.add(SearchResultItem(
          id: d.sceneId,
          type: 'scene',
          title: 'Scene ${d.sceneId}',
          excerpt: d.contentDelta!.length > 150
              ? '…${d.contentDelta!.substring(0, 150)}…'
              : d.contentDelta,
          category: 'Manuscript',
        ));
      }
    }

    return SearchResults(manuscript: manuscript, worldbuilding: worldbuilding);
  }

  void invalidateEntity(String entityId) {
    _entityNameIndex.removeWhere((_, id) => id == entityId);
  }

  void invalidateAll() => _entityNameIndex.clear();
}
