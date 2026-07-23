import 'package:flutter_test/flutter_test.dart';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:aevorin_mobile/core/database/database.dart';

void main() {
  group('Database Migration Tests', () {
    late AppDatabase database;

    setUp(() {
      database = AppDatabase();
    });

    tearDown(() async {
      await database.close();
    });

    test('Fresh install to V6 creates all tables', () async {
      // Trigger database creation by querying
      final projects = await database.select(database.projects).get();
      expect(projects, isEmpty);

      final entities = await database.select(database.storyEntities).get();
      expect(entities, isEmpty);

      final relationships = await database.select(database.entityRelationships).get();
      expect(relationships, isEmpty);
      
      final queue = await database.select(database.syncQueue).get();
      expect(queue, isEmpty);
    });
  });
}
