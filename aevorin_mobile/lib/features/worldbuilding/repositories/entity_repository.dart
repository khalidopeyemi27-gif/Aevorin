import 'package:drift/drift.dart' as drift;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/database/database.dart';
import '../../../core/utils/ulid.dart';
import 'package:dio/dio.dart';
import 'dart:convert';

final entityRepositoryProvider = Provider<EntityRepository>((ref) {
  final db = ref.watch(databaseProvider);
  return EntityRepository(db, ApiClient().dio);
});

class EntityRepository {
  final AppDatabase _db;
  final Dio _dio;

  EntityRepository(this._db, this._dio);

  Future<void> fetchAndCacheEntities(String projectId) async {
    try {
      final response = await _dio.get('/api/projects/$projectId/entities');
      final data = response.data as List;
      
      for (final item in data) {
        await _db.into(_db.storyEntities).insertOnConflictUpdate(
          StoryEntitiesCompanion.insert(
            id: item['id'],
            projectId: projectId,
            type: item['type'] ?? 'CHARACTER',
            templateId: drift.Value(item['metadata']?['templateId']),
            title: item['title'] ?? 'Untitled',
            description: drift.Value(item['summary'] ?? ''),
            imageSource: drift.Value(item['metadata']?['imageSource']),
            imagePath: drift.Value(item['metadata']?['imagePath']),
            thumbnailPath: drift.Value(item['metadata']?['thumbnailPath']),
            metadataJson: drift.Value(jsonEncode(item['metadata'] ?? {})),
            createdAt: DateTime.tryParse(item['created_at'] ?? '') ?? DateTime.now(),
            updatedAt: DateTime.tryParse(item['updated_at'] ?? '') ?? DateTime.now(),
          ),
        );
      }
    } catch (e) {
      print('Failed to fetch entities: $e');
      rethrow;
    }
  }
  
  Stream<List<StoryEntity>> watchEntities(String projectId) {
    return (_db.select(_db.storyEntities)
      ..where((t) => t.projectId.equals(projectId))
      ..orderBy([(t) => drift.OrderingTerm(expression: t.title)])
    ).watch();
  }

  Future<StoryEntity?> getEntityById(String id) async {
    return (_db.select(_db.storyEntities)..where((t) => t.id.equals(id))).getSingleOrNull();
  }

  Future<StoryEntity?> findEntityByName(String name, {String? type}) async {
    final query = _db.select(_db.storyEntities)
      ..where((t) => t.title.equals(name));
    if (type != null) {
      query.where((t) => t.type.equals(type));
    }
    return query.getSingleOrNull();
  }

  Future<List<StoryEntity>> getEntitiesByType(String type) async {
    return (_db.select(_db.storyEntities)
      ..where((t) => t.type.equals(type))
    ).get();
  }

  Future<List<EntityRelationship>> getRelationshipsForEntity(String entityId) async {
    return (_db.select(_db.entityRelationships)
      ..where((t) => t.sourceEntityId.equals(entityId) | t.targetEntityId.equals(entityId))
    ).get();
  }

  Future<List<EntityRelationship>> getAllRelationships(String projectId) async {
    return (_db.select(_db.entityRelationships)
      ..where((t) => t.projectId.equals(projectId))
    ).get();
  }

  Future<void> createEntity(String projectId, String type, String title, String summary, Map<String, dynamic> metadata) async {
    final entityId = DateTime.now().millisecondsSinceEpoch.toString();
    
    // 1. Save locally
    await _db.into(_db.storyEntities).insertOnConflictUpdate(
      StoryEntitiesCompanion.insert(
        id: entityId,
        projectId: projectId,
        type: type,
        title: title,
        description: drift.Value(summary),
        templateId: drift.Value(metadata['templateId']),
        metadataJson: drift.Value(jsonEncode(metadata)),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    );
    
    // 2. Queue for Sync
    final syncId = Ulid.generate();
    final opId = Ulid.generate();
    final payload = jsonEncode({
      'projectId': projectId,
      'type': type,
      'title': title,
      'summary': summary,
      'metadata': metadata,
    });
    
    await _db.enqueueSync(syncId, opId, 'ENTITY', entityId, 'CREATE', payload, resourceVersion: 0);
  }
  
  Future<void> updateEntity(String projectId, String entityId, Map<String, dynamic> updates) async {
    // 1. Update locally
    await (_db.update(_db.storyEntities)..where((t) => t.id.equals(entityId))).write(
      StoryEntitiesCompanion(
        title: updates['title'] != null ? drift.Value(updates['title']) : const drift.Value.absent(),
        description: updates['summary'] != null ? drift.Value(updates['summary']) : const drift.Value.absent(),
        metadataJson: updates['metadata'] != null ? drift.Value(jsonEncode(updates['metadata'])) : const drift.Value.absent(),
        templateId: updates['metadata']?['templateId'] != null ? drift.Value(updates['metadata']['templateId']) : const drift.Value.absent(),
        updatedAt: drift.Value(DateTime.now()),
      ),
    );
    
    // 2. Queue for Sync — version defaults to 0 until the schema is regenerated.
    final syncId = Ulid.generate();
    final opId = Ulid.generate();
    final payload = jsonEncode({
      'projectId': projectId,
      'updates': updates,
    });

    await _db.enqueueSync(syncId, opId, 'ENTITY', entityId, 'UPDATE', payload, resourceVersion: 0);
  }
  
  Future<void> deleteEntity(String projectId, String entityId) async {
    // 1. Find relationships involving this entity
    final relationships = await (_db.select(_db.entityRelationships)
      ..where((t) => t.sourceEntityId.equals(entityId) | t.targetEntityId.equals(entityId)))
      .get();

    // 2. Queue relationships for sync deletion — version defaults to 0 until schema regenerated.
    for (final rel in relationships) {
      final relSyncId = Ulid.generate();
      final relOpId = Ulid.generate();
      final relPayload = jsonEncode({'projectId': projectId});
      await _db.enqueueSync(relSyncId, relOpId, 'RELATIONSHIP', rel.id, 'DELETE', relPayload, resourceVersion: 0);
    }

    // 3. Delete relationships locally
    await (_db.delete(_db.entityRelationships)
      ..where((t) => t.sourceEntityId.equals(entityId) | t.targetEntityId.equals(entityId)))
      .go();

    // 4. Queue entity deletion — version defaults to 0 until schema regenerated.
    final syncId = Ulid.generate();
    final opId = Ulid.generate();
    final payload = jsonEncode({'projectId': projectId});
    await _db.enqueueSync(syncId, opId, 'ENTITY', entityId, 'DELETE', payload, resourceVersion: 0);

    // 5. Delete entity locally
    await (_db.delete(_db.storyEntities)..where((t) => t.id.equals(entityId))).go();
  }

  Future<void> createRelationship(String projectId, String sourceId, String targetId, String type, String direction, {String? notes, String? description}) async {
    if (sourceId == targetId) {
      throw Exception('Self-referencing relationships are not allowed.');
    }
    
    final validDirections = ['bidirectional', 'forward', 'reverse'];
    if (!validDirections.contains(direction)) {
      throw Exception('Invalid relationship direction.');
    }

    final relId = DateTime.now().millisecondsSinceEpoch.toString();

    // 1. Save locally
    await _db.into(_db.entityRelationships).insertOnConflictUpdate(
      EntityRelationshipsCompanion.insert(
        id: relId,
        projectId: projectId,
        sourceEntityId: sourceId,
        targetEntityId: targetId,
        relationshipType: type,
        direction: drift.Value(direction),
        notes: drift.Value(notes),
        description: drift.Value(description),
      ),
    );

    // 2. Queue for sync
    final syncId = Ulid.generate();
    final opId = Ulid.generate();
    final payload = jsonEncode({
      'projectId': projectId,
      'sourceId': sourceId,
      'targetId': targetId,
      'type': type,
      'direction': direction,
      'notes': notes,
      'description': description,
    });
    
    await _db.enqueueSync(syncId, opId, 'RELATIONSHIP', relId, 'CREATE', payload, resourceVersion: 0);
  }
}
