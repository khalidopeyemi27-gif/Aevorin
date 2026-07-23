/// Classifies sync resources into conflict resolution categories.
///
/// - [highValue]: Writing content — scene text, character descriptions, lore,
///   relationship notes. 409 conflicts are surfaced to the user so nothing is
///   silently lost.
/// - [lowValue]: Metadata and preferences — project settings, accent colors,
///   images, export preferences. 409 conflicts are resolved automatically by
///   re-fetching the server state and re-applying the local change.
enum ConflictClass { lowValue, highValue }

class ConflictClassifier {
  static const Set<String> _highValueOperations = {
    'SCENE',
    'ENTITY', // only certain fields — see [classifyPayload]
    'RELATIONSHIP',
  };

  static const Set<String> _lowValueResourceTypes = {
    'PROJECT',
  };

  /// High-value entity field keys — changes to these warrant user review.
  static const Set<String> _highValueEntityFields = {
    'title',
    'summary',
    'description',
    'notes',
  };

  /// Returns the conflict class for a given SyncQueue entry.
  static ConflictClass classify(String resourceType, String operation, String payload) {
    if (_lowValueResourceTypes.contains(resourceType)) {
      return ConflictClass.lowValue;
    }

    if (!_highValueOperations.contains(resourceType)) {
      return ConflictClass.lowValue;
    }

    if (resourceType == 'ENTITY' && operation == 'UPDATE') {
      // Only treat as high-value if any high-value field is being changed.
      final containsHighValue = _highValueEntityFields.any((f) => payload.contains('"$f"'));
      return containsHighValue ? ConflictClass.highValue : ConflictClass.lowValue;
    }

    return ConflictClass.highValue;
  }
}

/// Holds both versions of a conflicted resource so that no writing is lost.
class ConflictedDraft {
  final String resourceType;
  final String resourceId;
  final String operationId;
  final String localPayload;
  String? serverPayload;
  final DateTime detectedAt;

  ConflictedDraft({
    required this.resourceType,
    required this.resourceId,
    required this.operationId,
    required this.localPayload,
    this.serverPayload,
    required this.detectedAt,
  });
}
