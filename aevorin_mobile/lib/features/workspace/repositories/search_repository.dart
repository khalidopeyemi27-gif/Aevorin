import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/database/database.dart';

class SearchResult {
  final String id;
  final String type;
  final String title;
  final String content;

  SearchResult({
    required this.id,
    required this.type,
    required this.title,
    required this.content,
  });
}

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  final db = ref.watch(databaseProvider);
  return SearchRepository(db);
});

class SearchRepository {
  final AppDatabase _db;

  SearchRepository(this._db);

  Future<List<SearchResult>> search(String projectId, String query) async {
    final results = <SearchResult>[];
    final q = query.toLowerCase();

    try {
      // 1. Search Drafts (Manuscript)
      final drafts = await (_db.select(_db.drafts)).get();
      for (final draft in drafts) {
        // Here we just search contentDelta naively. 
        // In a real app we'd join with Scenes to get the title, but Drafts has sceneId.
        if (draft.contentDelta != null && draft.contentDelta!.toLowerCase().contains(q)) {
          results.add(SearchResult(
            id: draft.sceneId,
            type: 'SCENE',
            title: 'Scene ${draft.sceneId}', // Placeholder until joined
            content: _snippet(draft.contentDelta!, q),
          ));
        }
      }

      // 2. Search StoryEntities (Worldbuilding)
      final entities = await (_db.select(_db.storyEntities)
        ..where((t) => t.projectId.equals(projectId)))
        .get();
        
      for (final entity in entities) {
        if (entity.title.toLowerCase().contains(q) || 
           (entity.description != null && entity.description!.toLowerCase().contains(q)) ||
           (entity.metadataJson != null && entity.metadataJson!.toLowerCase().contains(q))) {
          
          results.add(SearchResult(
            id: entity.id,
            type: entity.type,
            title: entity.title,
            content: entity.description ?? 'No description',
          ));
        }
      }

      // 3. Search Relationships
      final relationships = await (_db.select(_db.entityRelationships)
        ..where((t) => t.projectId.equals(projectId)))
        .get();
        
      for (final rel in relationships) {
        if ((rel.notes != null && rel.notes!.toLowerCase().contains(q)) ||
            (rel.description != null && rel.description!.toLowerCase().contains(q))) {
          results.add(SearchResult(
            id: rel.id,
            type: 'RELATIONSHIP',
            title: 'Connection (${rel.relationshipType})',
            content: rel.notes ?? rel.description ?? '',
          ));
        }
      }

    } catch (e) {
      print('Local search error: $e');
    }

    return results;
  }
  
  String _snippet(String content, String query) {
    // Basic snippet extraction
    final idx = content.toLowerCase().indexOf(query);
    if (idx == -1) return content;
    final start = (idx - 30).clamp(0, content.length);
    final end = (idx + query.length + 30).clamp(0, content.length);
    return (start > 0 ? '...' : '') + content.substring(start, end).replaceAll('\n', ' ') + (end < content.length ? '...' : '');
  }
}
