import 'package:flutter/material.dart';
import '../../../core/sync/conflict_classifier.dart';

/// Presented when a high-value sync conflict is detected.
/// Preserves both versions in full — no silent overwriting.
///
/// User choices:
///   - Keep Mine:   dismiss the server version, re-queue local change.
///   - Keep Server: discard local change, accept server version.
///   - Merge Later: dismiss dialog, mark conflict for manual review later.
enum ConflictResolution { keepMine, keepServer, mergeLater }

class ConflictResolutionDialog extends StatelessWidget {
  final ConflictedDraft conflict;

  const ConflictResolutionDialog({Key? key, required this.conflict}) : super(key: key);

  static Future<ConflictResolution?> show(BuildContext context, ConflictedDraft conflict) {
    return showDialog<ConflictResolution>(
      context: context,
      barrierDismissible: false,
      builder: (_) => ConflictResolutionDialog(conflict: conflict),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return AlertDialog(
      title: Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: colorScheme.error),
          const SizedBox(width: 12),
          const Text('Edit Conflict'),
        ],
      ),
      content: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This ${conflict.resourceType.toLowerCase()} was also edited on another device.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            _VersionCard(
              label: 'Your Version',
              payload: conflict.localPayload,
              icon: Icons.phone_android,
              color: colorScheme.primaryContainer,
            ),
            const SizedBox(height: 8),
            _VersionCard(
              label: 'Server Version',
              payload: conflict.serverPayload ?? '(not available)',
              icon: Icons.cloud,
              color: colorScheme.tertiaryContainer,
            ),
            const SizedBox(height: 16),
            Text(
              'Detected: ${_formatDate(conflict.detectedAt)}',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(color: colorScheme.outline),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(ConflictResolution.mergeLater),
          child: const Text('Merge Later'),
        ),
        OutlinedButton(
          onPressed: () => Navigator.of(context).pop(ConflictResolution.keepServer),
          child: const Text('Keep Server'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(ConflictResolution.keepMine),
          child: const Text('Keep Mine'),
        ),
      ],
    );
  }

  String _formatDate(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

class _VersionCard extends StatelessWidget {
  final String label;
  final String payload;
  final IconData icon;
  final Color color;

  const _VersionCard({
    required this.label,
    required this.payload,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    // Show only a short excerpt of the payload for readability.
    final preview = payload.length > 120 ? '${payload.substring(0, 120)}…' : payload;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                const SizedBox(height: 4),
                Text(preview, style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
