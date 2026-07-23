import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/database/database.dart';
import 'package:dio/dio.dart';

final graphRepositoryProvider = Provider<GraphRepository>((ref) {
  final db = ref.watch(databaseProvider);
  return GraphRepository(db, ApiClient().dio);
});

class GraphRepository {
  final AppDatabase _db;
  final Dio _dio;

  GraphRepository(this._db, this._dio);

  Future<Map<String, dynamic>> fetchGraphData(String projectId) async {
    try {
      final response = await _dio.get('/api/projects/$projectId/canon/graph/data');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      // Local Drift SQLite fallback for offline / local projects
      final entities = await (_db.select(_db.storyEntities)..where((t) => t.projectId.equals(projectId))).get();
      final relationships = await (_db.select(_db.entityRelationships)..where((t) => t.projectId.equals(projectId))).get();

      final nodes = entities.map((e) => {
        'id': e.id,
        'name': e.title,
        'entity_type': e.type.toLowerCase(),
        'importance': 50,
      }).toList();

      final edges = relationships.map((r) => {
        'source_id': r.sourceEntityId,
        'target_id': r.targetEntityId,
        'edge_type': r.relationshipType,
      }).toList();

      return {
        'nodes': nodes,
        'edges': edges,
      };
    }
  }
}
