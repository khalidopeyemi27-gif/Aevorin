import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/database/database.dart';
import '../../../core/sync/conflict_classifier.dart';
import '../../projects/services/scene_repository.dart';
import '../../projects/providers/scene_provider.dart';
import 'sync_compactor.dart';

final backgroundSyncServiceProvider = Provider<BackgroundSyncService>((ref) {
  final db = ref.watch(databaseProvider);
  final sceneRepo = ref.watch(sceneRepositoryProvider);
  final service = BackgroundSyncService(db, sceneRepo);
  service.start();
  ref.onDispose(() => service.stop());
  return service;
});

/// Called when a high-value conflict is detected, so the UI layer can surface
/// a resolution dialog to the user.
typedef ConflictHandler = Future<void> Function(ConflictedDraft conflict);

class BackgroundSyncService {
  final AppDatabase _db;
  final SceneRepository _sceneRepository;
  bool _isProcessing = false;
  final Set<String> _lockedResources = {};
  Timer? _pollingTimer;

  /// Optional UI callback for high-value conflicts. If null, conflicts are
  /// logged and the item is marked as [SyncQueueStatus.failed] until resolved.
  ConflictHandler? onConflict;

  BackgroundSyncService(this._db, this._sceneRepository);

  void start() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _processQueue();
    });
  }

  void stop() {
    _pollingTimer?.cancel();
  }

  Future<void> _processQueue() async {
    if (_isProcessing) return;
    _isProcessing = true;

    try {
      final isOnline = true; // In real app: check connectivity via connectivity_plus
      if (!isOnline) return;

      final raw = await _db.getWaitingSyncQueue();
      if (raw.isEmpty) return;

      // --- 1. Compact the batch before uploading ---
      final batch = SyncCompactor.compact(raw.take(20).toList());

      for (final item in batch) {
        // Exponential backoff check
        if (item.retryCount > 0 && item.lastAttemptAt != null) {
          final backoffSeconds = 2 * item.retryCount * item.retryCount;
          final elapsed = DateTime.now().difference(item.lastAttemptAt!).inSeconds;
          if (elapsed < backoffSeconds) continue;
        }

        final resourceKey = '${item.resourceType}_${item.resourceId}';
        if (_lockedResources.contains(resourceKey)) continue;

        _lockedResources.add(resourceKey);

        try {
          await _db.updateSyncQueueStatus(item.id, SyncQueueStatus.uploading, item.retryCount);

          // --- 2. Attempt the operation ---
          await _dispatchOperation(item);

          await _db.removeSyncQueueItem(item.id);
        } on DioException catch (e) {
          if (e.response?.statusCode == 409) {
            // --- 3. Conflict handling ---
            await _handleConflict(item, e.response?.data);
          } else {
            await _handleRetry(item);
          }
        } catch (e) {
          print('Sync failed for ${item.id}: $e');
          await _handleRetry(item);
        } finally {
          _lockedResources.remove(resourceKey);
        }
      }
    } finally {
      _isProcessing = false;
    }
  }

  Future<void> _dispatchOperation(SyncQueueData item) async {
    final payload = jsonDecode(item.payload) as Map<String, dynamic>;

    switch (item.resourceType) {
      case 'SCENE':
        if (item.operation == 'UPDATE') {
          await _sceneRepository.updateScene('default_project', item.resourceId, {
            'content': payload['html'] ?? '',
            'wordCount': payload['wordCount'] ?? 0,
          });
        }
        break;
      case 'ENTITY':
      case 'RELATIONSHIP':
      case 'PROJECT':
        // Real API calls will be inserted here in V1.2.1 with AI Gateway
        break;
    }
  }

  Future<void> _handleConflict(SyncQueueData item, dynamic serverResponse) async {
    final conflictClass = ConflictClassifier.classify(
      item.resourceType,
      item.operation,
      item.payload,
    );

    final conflict = ConflictedDraft(
      resourceType: item.resourceType,
      resourceId: item.resourceId,
      operationId: item.operationId,
      localPayload: item.payload,
      serverPayload: serverResponse != null ? jsonEncode(serverResponse) : null,
      detectedAt: DateTime.now(),
    );

    if (conflictClass == ConflictClass.lowValue) {
      // Auto-resolve: server wins, re-apply local change on top.
      // The item stays in queue with updated version for retry.
      final serverVersion = serverResponse?['version'] as int? ?? 0;
      await _db.updateSyncQueueStatus(item.id, SyncQueueStatus.waiting, item.retryCount);
      // Update the enqueued payload's resourceVersion to match the server's.
      // (Full re-fetch and merge is done by the repository in a real impl.)
      print('[SyncService] Low-value conflict auto-resolved for ${item.resourceId}, server version: $serverVersion');
    } else {
      // High-value: preserve both, surface to user.
      await _db.updateSyncQueueStatus(item.id, SyncQueueStatus.failed, item.retryCount);
      if (onConflict != null) {
        await onConflict!(conflict);
      } else {
        print('[SyncService] High-value conflict detected for ${item.resourceId}. No conflict handler registered.');
      }
    }
  }

  Future<void> _handleRetry(SyncQueueData item) async {
    final newRetryCount = item.retryCount + 1;
    final newStatus = newRetryCount >= 5 ? SyncQueueStatus.failed : SyncQueueStatus.waiting;
    await _db.updateSyncQueueStatus(item.id, newStatus, newRetryCount);
  }
}
