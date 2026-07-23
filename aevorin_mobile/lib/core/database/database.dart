import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:flutter_riverpod/flutter_riverpod.dart';

part 'database.g.dart';

enum DraftSyncState { pending, syncing, synced, failed }
enum SyncQueueStatus { waiting, uploading, completed, failed }

class Drafts extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get sceneId => text().unique()();
  TextColumn get contentDelta => text().nullable()();
  TextColumn get contentHash => text().nullable()();
  TextColumn get formatVersion => text().withDefault(const Constant('delta-v1'))();
  IntColumn get syncState => intEnum<DraftSyncState>().withDefault(const Constant(0))();
  IntColumn get wordCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get lastSaved => dateTime()();
  DateTimeColumn get lastSyncedAt => dateTime().nullable()();
  TextColumn get deviceId => text().nullable()();
  IntColumn get serverVersion => integer().nullable()();
}

class SyncQueue extends Table {
  TextColumn get id => text()();
  /// ULID — time-sortable, globally unique, used for server-side idempotency.
  TextColumn get operationId => text().unique()();
  TextColumn get resourceType => text()(); // SCENE, ENTITY, RELATIONSHIP, PROJECT
  TextColumn get resourceId => text()();
  TextColumn get operation => text()(); // CREATE, UPDATE, DELETE
  /// The last resource version the client observed before making this change.
  /// Server rejects with 409 if its current version != this value.
  IntColumn get resourceVersion => integer().withDefault(const Constant(0))();
  TextColumn get payload => text()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get lastAttemptAt => dateTime().nullable()();
  IntColumn get status => intEnum<SyncQueueStatus>().withDefault(const Constant(0))();
  
  @override
  Set<Column> get primaryKey => {id};
}

class Projects extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get authorName => text().nullable()();
  TextColumn get genre => text().nullable()();
  TextColumn get themeColor => text().nullable()();
  TextColumn get coverImage => text().nullable()();
  IntColumn get targetWordCount => integer().nullable()();
  
  // V1.1.5 Book Identity
  TextColumn get accentColor => text().nullable()();
  TextColumn get fontPair => text().nullable()();
  TextColumn get bookSeries => text().nullable()();
  IntColumn get volume => integer().nullable()();
  TextColumn get publisher => text().nullable()();
  TextColumn get copyright => text().nullable()();
  TextColumn get language => text().nullable()();

  // V1.2 — Versioning
  IntColumn get version => integer().withDefault(const Constant(0))();

  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class StoryEntities extends Table {
  TextColumn get id => text()();
  TextColumn get projectId => text().references(Projects, #id)();
  TextColumn get type => text()(); // CHARACTER, ITEM, WORLD, FACTION, etc.
  TextColumn get templateId => text().nullable()(); // Hero, Kingdom, etc.
  TextColumn get title => text()();
  TextColumn get description => text().nullable()();
  
  // Media fields
  TextColumn get imageSource => text().nullable()(); // LOCAL, REMOTE, GENERATED
  TextColumn get imagePath => text().nullable()();
  TextColumn get thumbnailPath => text().nullable()();
  
  TextColumn get metadataJson => text().nullable()(); // Rich details specific to template
  
  // AI and Computed fields
  TextColumn get aiSummary => text().nullable()();
  TextColumn get embeddingVersion => text().nullable()();
  IntColumn get connectionCount => integer().withDefault(const Constant(0))();
  IntColumn get sceneAppearances => integer().withDefault(const Constant(0))();
  IntColumn get importanceScore => integer().withDefault(const Constant(50))();

  // V1.2 — Versioning (server-assigned; client stores the last known version).
  IntColumn get version => integer().withDefault(const Constant(0))();
  TextColumn get updatedBy => text().nullable()(); // deviceId that made the last local change

  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class EntityRelationships extends Table {
  TextColumn get id => text()();
  TextColumn get projectId => text().references(Projects, #id)();
  
  @ReferenceName('sourceEntityRelationships')
  TextColumn get sourceEntityId => text().references(StoryEntities, #id)();
  
  @ReferenceName('targetEntityRelationships')
  TextColumn get targetEntityId => text().references(StoryEntities, #id)();
  
  TextColumn get relationshipType => text()(); // e.g. "ALLIES", "ENEMIES", "OWNS"
  IntColumn get strength => integer().withDefault(const Constant(50))();
  TextColumn get direction => text().withDefault(const Constant('bidirectional'))(); // bidirectional, forward, reverse
  TextColumn get description => text().nullable()();
  TextColumn get notes => text().nullable()();
  TextColumn get metadataJson => text().nullable()();

  // V1.2 — Versioning
  IntColumn get version => integer().withDefault(const Constant(0))();
  TextColumn get updatedBy => text().nullable()();
  
  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [Drafts, SyncQueue, Projects, StoryEntities, EntityRelationships])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 7;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator m) async {
        await m.createAll();
      },
      onUpgrade: (Migrator m, int from, int to) async {
        if (from < 2) {
          await m.deleteTable(drafts.actualTableName);
          await m.createTable(drafts);
        }
        if (from < 3) {
          await m.createTable(syncQueue);
          await m.addColumn(drafts, drafts.contentHash);
          await m.addColumn(drafts, drafts.lastSyncedAt);
          await m.addColumn(drafts, drafts.deviceId);
          await m.addColumn(drafts, drafts.serverVersion);
          
          print('WARNING: Development Database Reset for Drafts Table (V2 -> V3)');
          await m.deleteTable(drafts.actualTableName);
          await m.createTable(drafts);
        }
        if (from < 4) {
          await m.createTable(projects);
          await m.createTable(storyEntities);
          await m.createTable(entityRelationships);
        }
        if (from < 5) {
          // Drop and recreate since V4 entities had missing columns and no user data exists yet
          await m.deleteTable(entityRelationships.actualTableName);
          await m.deleteTable(storyEntities.actualTableName);
          await m.createTable(storyEntities);
          await m.createTable(entityRelationships);
        }
        if (from < 6) {
          await m.deleteTable(syncQueue.actualTableName);
          await m.deleteTable(projects.actualTableName);
          await m.deleteTable(entityRelationships.actualTableName);
          await m.deleteTable(storyEntities.actualTableName);
          await m.createTable(syncQueue);
          await m.createTable(projects);
          await m.createTable(storyEntities);
          await m.createTable(entityRelationships);
        }
        if (from < 7) {
          // Non-destructive: addColumn only. Existing rows get default values.
          await m.addColumn(syncQueue, syncQueue.operationId as GeneratedColumn);
          await m.addColumn(storyEntities, storyEntities.version as GeneratedColumn);
          await m.addColumn(storyEntities, storyEntities.updatedBy as GeneratedColumn);
          await m.addColumn(entityRelationships, entityRelationships.version as GeneratedColumn);
          await m.addColumn(entityRelationships, entityRelationships.updatedBy as GeneratedColumn);
          await m.addColumn(projects, projects.version as GeneratedColumn);
        }
      },
    );
  }

  Future<void> saveDraft({
    required String sceneId,
    required String contentDelta,
    required String contentHash,
    required int wordCount,
    required DraftSyncState syncState,
  }) async {
    await into(drafts).insertOnConflictUpdate(
      DraftsCompanion(
        sceneId: Value(sceneId),
        contentDelta: Value(contentDelta),
        contentHash: Value(contentHash),
        wordCount: Value(wordCount),
        lastSaved: Value(DateTime.now()),
        syncState: Value(syncState),
      ),
    );
  }

  Future<Draft?> getDraft(String sceneId) async {
    return (select(drafts)..where((t) => t.sceneId.equals(sceneId))).getSingleOrNull();
  }

  Future<void> updateSyncState({
    required String sceneId,
    required DraftSyncState newState,
    DateTime? lastSyncedAt,
    int? serverVersion,
  }) async {
    await (update(drafts)..where((t) => t.sceneId.equals(sceneId))).write(
      DraftsCompanion(
        syncState: Value(newState),
        lastSyncedAt: lastSyncedAt != null ? Value(lastSyncedAt) : const Value.absent(),
        serverVersion: serverVersion != null ? Value(serverVersion) : const Value.absent(),
      ),
    );
  }
  
  // Sync Queue Methods
  Future<void> enqueueSync(
    String id,
    String operationId,
    String resourceType,
    String resourceId,
    String operation,
    String payload, {
    int resourceVersion = 0,
  }) async {
    await into(syncQueue).insert(
      SyncQueueCompanion.insert(
        id: id,
        operationId: operationId,
        resourceType: resourceType,
        resourceId: resourceId,
        operation: operation,
        resourceVersion: Value(resourceVersion),
        payload: payload,
        status: const Value(SyncQueueStatus.waiting),
        retryCount: const Value(0),
      ),
    );
  }
  
  Future<List<SyncQueueData>> getWaitingSyncQueue() async {
    return (select(syncQueue)
      ..where((t) => t.status.equals(SyncQueueStatus.waiting.index))
      ..orderBy([(t) => OrderingTerm(expression: t.createdAt, mode: OrderingMode.asc)])
    ).get();
  }
  
  Future<void> updateSyncQueueStatus(String id, SyncQueueStatus status, int retryCount) async {
    await (update(syncQueue)..where((t) => t.id.equals(id))).write(
      SyncQueueCompanion(
        status: Value(status),
        retryCount: Value(retryCount),
        lastAttemptAt: Value(DateTime.now()),
      ),
    );
  }
  
  Future<void> removeSyncQueueItem(String id) async {
    await (delete(syncQueue)..where((t) => t.id.equals(id))).go();
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'aevorin.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}

final databaseProvider = Provider<AppDatabase>((ref) {
  return AppDatabase();
});
