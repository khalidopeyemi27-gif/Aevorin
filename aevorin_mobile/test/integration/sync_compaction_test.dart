import 'package:flutter_test/flutter_test.dart';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:aevorin_mobile/core/database/database.dart';
import 'package:aevorin_mobile/features/editor/services/sync_compactor.dart';

/// Helpers
SyncQueueData _op(String id, String resourceId, String operation, {String payload = '{}'}) {
  return SyncQueueData(
    id: id,
    operationId: '01${id.padLeft(24, '0')}',
    resourceType: 'ENTITY',
    resourceId: resourceId,
    operation: operation,
    resourceVersion: 0,
    payload: payload,
    createdAt: DateTime.now(),
    retryCount: 0,
    lastAttemptAt: null,
    status: SyncQueueStatus.waiting,
  );
}

void main() {
  group('SyncCompactor', () {
    test('CREATE → UPDATE collapses to CREATE with merged payload', () {
      final queue = [
        _op('1', 'A', 'CREATE', payload: '{"title":"Alice"}'),
        _op('2', 'A', 'UPDATE', payload: '{"title":"Alice Liddell"}'),
      ];
      final result = SyncCompactor.compact(queue);
      expect(result.length, 1);
      expect(result.first.operation, 'CREATE');
      expect(result.first.payload, contains('"Alice Liddell"'));
    });

    test('UPDATE → UPDATE collapses to single UPDATE with merged payload', () {
      final queue = [
        _op('1', 'A', 'UPDATE', payload: '{"description":"brave"}'),
        _op('2', 'A', 'UPDATE', payload: '{"description":"very brave","age":"30"}'),
      ];
      final result = SyncCompactor.compact(queue);
      expect(result.length, 1);
      expect(result.first.operation, 'UPDATE');
      expect(result.first.payload, contains('"very brave"'));
      expect(result.first.payload, contains('"30"'));
    });

    test('CREATE → DELETE is a no-op (removes both)', () {
      final queue = [
        _op('1', 'A', 'CREATE'),
        _op('2', 'A', 'DELETE'),
      ];
      final result = SyncCompactor.compact(queue);
      expect(result, isEmpty);
    });

    test('UPDATE → DELETE collapses to DELETE', () {
      final queue = [
        _op('1', 'A', 'UPDATE', payload: '{"title":"changed"}'),
        _op('2', 'A', 'DELETE'),
      ];
      final result = SyncCompactor.compact(queue);
      expect(result.length, 1);
      expect(result.first.operation, 'DELETE');
    });

    test('DELETE → CREATE collapses to CREATE (recreation)', () {
      final queue = [
        _op('1', 'A', 'DELETE'),
        _op('2', 'A', 'CREATE', payload: '{"title":"Reborn"}'),
      ];
      final result = SyncCompactor.compact(queue);
      expect(result.length, 1);
      expect(result.first.operation, 'CREATE');
    });

    test('CREATE → UPDATE → UPDATE → DELETE is a no-op', () {
      final queue = [
        _op('1', 'A', 'CREATE'),
        _op('2', 'A', 'UPDATE'),
        _op('3', 'A', 'UPDATE'),
        _op('4', 'A', 'DELETE'),
      ];
      final result = SyncCompactor.compact(queue);
      expect(result, isEmpty);
    });

    test('Multiple resources compact independently', () {
      final queue = [
        _op('1', 'A', 'CREATE'),
        _op('2', 'B', 'CREATE'),
        _op('3', 'A', 'UPDATE', payload: '{"title":"A Updated"}'),
        _op('4', 'B', 'DELETE'),
      ];
      final result = SyncCompactor.compact(queue);
      // A: CREATE+UPDATE → CREATE; B: CREATE+DELETE → no-op
      expect(result.length, 1);
      expect(result.first.resourceId, 'A');
      expect(result.first.operation, 'CREATE');
    });

    test('Compaction preserves relative order across unrelated resources', () {
      final queue = [
        _op('1', 'A', 'UPDATE'),
        _op('2', 'B', 'UPDATE'),
        _op('3', 'C', 'UPDATE'),
      ];
      final result = SyncCompactor.compact(queue);
      expect(result.length, 3);
      expect(result.map((r) => r.resourceId).toList(), ['A', 'B', 'C']);
    });

    test('Duplicate operationId of latest op wins after compaction', () {
      final queue = [
        _op('1', 'A', 'CREATE'),
        _op('2', 'A', 'UPDATE'),
      ];
      final result = SyncCompactor.compact(queue);
      // The latest operationId should be the one on the UPDATE entry
      expect(result.first.operationId, queue[1].operationId);
    });
  });
}
