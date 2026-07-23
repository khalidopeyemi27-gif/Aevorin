import 'dart:convert';

import '../../../core/database/database.dart';
import '../../../core/sync/conflict_classifier.dart';

/// Compacts a list of [SyncQueueData] for the same resource, applying the
/// following rules per (source, target) operation pair:
///
/// | Incoming          | Result                                    |
/// |-------------------|-------------------------------------------|
/// | CREATE → UPDATE   | CREATE (merged payload)                   |
/// | UPDATE → UPDATE   | UPDATE (merged payload)                   |
/// | CREATE → DELETE   | no-op (remove both — never hit the server)|
/// | UPDATE → DELETE   | DELETE                                    |
/// | DELETE → CREATE   | CREATE (recreation with new identity)     |
///
/// Operations for unrelated resources are never reordered relative to one
/// another — only operations targeting the *same* resourceId are compacted.
class SyncCompactor {
  /// Compact [queue] and return the resulting list.
  ///
  /// The overall chronological order across different resources is preserved.
  static List<SyncQueueData> compact(List<SyncQueueData> queue) {
    if (queue.isEmpty) return [];

    // Group by resourceId, preserving insertion order of first appearance.
    final Map<String, List<SyncQueueData>> grouped = {};
    for (final item in queue) {
      grouped.putIfAbsent(item.resourceId, () => []).add(item);
    }

    // Compact each resource's operation chain, then merge back preserving
    // the relative chronological order of the *first* operation per resource.
    final List<_Positioned<SyncQueueData>> result = [];

    for (final entry in grouped.entries) {
      final ops = entry.value;
      final compacted = _compactChain(ops);

      for (int i = 0; i < compacted.length; i++) {
        // Position is the index of the first original op for stable merging.
        result.add(_Positioned(queue.indexOf(ops.first) + i, compacted[i]));
      }
    }

    result.sort((a, b) => a.position.compareTo(b.position));
    return result.map((p) => p.value).toList();
  }

  static List<SyncQueueData> _compactChain(List<SyncQueueData> ops) {
    if (ops.length <= 1) return ops;

    var accumulator = ops.first;

    for (int i = 1; i < ops.length; i++) {
      final next = ops[i];
      final current = accumulator.operation;
      final incoming = next.operation;

      if (current == 'CREATE' && incoming == 'UPDATE') {
        // CREATE + UPDATE → CREATE (merge payload)
        accumulator = _merge(accumulator, next, 'CREATE');
        continue;
      }
      if (current == 'UPDATE' && incoming == 'UPDATE') {
        // UPDATE + UPDATE → UPDATE (merge payload)
        accumulator = _merge(accumulator, next, 'UPDATE');
        continue;
      }
      if (current == 'CREATE' && incoming == 'DELETE') {
        // CREATE + DELETE → no-op: return empty list (handled below)
        return []; // never existed on the server
      }
      if (current == 'UPDATE' && incoming == 'DELETE') {
        // UPDATE + DELETE → DELETE
        accumulator = _withOperation(next, 'DELETE');
        continue;
      }
      if (current == 'DELETE' && incoming == 'CREATE') {
        // DELETE + CREATE → CREATE (recreation)
        accumulator = _withOperation(next, 'CREATE');
        continue;
      }

      // Unhandled combination — keep both in order (e.g. DELETE → UPDATE is
      // an error state; surface it to the server for rejection).
      return [accumulator, ...ops.sublist(i)];
    }

    return [accumulator];
  }

  /// Merges the payload of [base] with [update], with [update]'s keys winning.
  static SyncQueueData _merge(SyncQueueData base, SyncQueueData update, String resultOperation) {
    Map<String, dynamic> mergedPayload;
    try {
      final baseMap = jsonDecode(base.payload) as Map<String, dynamic>;
      final updateMap = jsonDecode(update.payload) as Map<String, dynamic>;
      mergedPayload = {...baseMap, ...updateMap};
    } catch (_) {
      mergedPayload = {};
    }

    return SyncQueueData(
      id: base.id,
      operationId: update.operationId, // ULID of the latest operation wins
      resourceType: base.resourceType,
      resourceId: base.resourceId,
      operation: resultOperation,
      resourceVersion: update.resourceVersion,
      payload: jsonEncode(mergedPayload),
      createdAt: base.createdAt,
      retryCount: 0,
      lastAttemptAt: null,
      status: SyncQueueStatus.waiting,
    );
  }

  static SyncQueueData _withOperation(SyncQueueData base, String operation) {
    return SyncQueueData(
      id: base.id,
      operationId: base.operationId,
      resourceType: base.resourceType,
      resourceId: base.resourceId,
      operation: operation,
      resourceVersion: base.resourceVersion,
      payload: base.payload,
      createdAt: base.createdAt,
      retryCount: 0,
      lastAttemptAt: null,
      status: SyncQueueStatus.waiting,
    );
  }
}

class _Positioned<T> {
  final int position;
  final T value;
  _Positioned(this.position, this.value);
}
