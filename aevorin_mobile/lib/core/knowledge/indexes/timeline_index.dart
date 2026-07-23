import 'package:flutter_riverpod/flutter_riverpod.dart';

final timelineIndexProvider = Provider<TimelineIndex>((_) => TimelineIndex());

class TimelineEvent {
  final String id;
  final String title;
  final DateTime? timestamp;
  final String? entityId;
  final String? sceneId;

  const TimelineEvent({
    required this.id,
    required this.title,
    this.timestamp,
    this.entityId,
    this.sceneId,
  });
}

/// Stub timeline index for V1.2.2 Timeline Validation.
///
/// When AI arrives, this index will be populated by:
/// 1. Parsing scene content for temporal markers ("three days later", "at dawn").
/// 2. Reading entity metadata for canonical event dates.
/// 3. Running a timeline consistency validator.
class TimelineIndex {
  final List<TimelineEvent> _events = [];

  Future<List<TimelineEvent>> getEvents(String projectId) async {
    return List.unmodifiable(_events);
  }

  void addEvent(TimelineEvent event) => _events.add(event);
  void invalidateAll() => _events.clear();
}
