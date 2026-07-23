import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/editor_provider.dart';

class SaveIndicator extends ConsumerWidget {
  final String sceneId;

  const SaveIndicator({Key? key, required this.sceneId}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(editorProvider);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (state.status == EditorStateStatus.saving)
            const SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          if (state.status == EditorStateStatus.saving)
            const SizedBox(width: 8),
          
          Text(
            _getStatusText(state.status),
            style: TextStyle(
              fontSize: 12,
              color: state.status == EditorStateStatus.saveFailed ? Colors.red : Colors.grey,
            ),
          ),
          
          if (state.status == EditorStateStatus.saveFailed) ...[
            const SizedBox(width: 8),
            const Icon(Icons.error_outline, size: 14, color: Colors.red),
          ]
        ],
      ),
    );
  }

  String _getStatusText(EditorStateStatus status) {
    switch (status) {
      case EditorStateStatus.loading:
        return 'Loading...';
      case EditorStateStatus.draftFound:
        return 'Draft Found';
      case EditorStateStatus.ready:
        return '';
      case EditorStateStatus.modified:
        return 'Unsaved changes';
      case EditorStateStatus.saving:
        return 'Saving...';
      case EditorStateStatus.saved:
        return 'Saved';
      case EditorStateStatus.saveFailed:
        return 'Save failed';
    }
  }
}
