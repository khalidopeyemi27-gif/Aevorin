import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_quill/flutter_quill.dart' hide Text;
import '../providers/editor_provider.dart';
import '../widgets/save_indicator.dart';
import '../../projects/models/scene.dart';

class SceneEditorScreen extends ConsumerStatefulWidget {
  final String projectId;
  final String sceneId;
  final Scene scene;

  const SceneEditorScreen({
    Key? key,
    required this.projectId,
    required this.sceneId,
    required this.scene,
  }) : super(key: key);

  @override
  ConsumerState<SceneEditorScreen> createState() => _SceneEditorScreenState();
}

class _SceneEditorScreenState extends ConsumerState<SceneEditorScreen> {
  final FocusNode _focusNode = FocusNode();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(editorProvider.notifier).loadScene(
        widget.projectId,
        widget.sceneId,
        widget.scene.content,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(editorProvider);

    if (state.status == EditorStateStatus.loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Loading...')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (state.status == EditorStateStatus.draftFound) {
      return Scaffold(
        appBar: AppBar(title: const Text('Draft Recovery')),
        body: Center(
          child: Card(
            margin: const EdgeInsets.all(32),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.warning_amber_rounded, size: 48, color: Colors.orange),
                  const SizedBox(height: 16),
                  const Text(
                    'Unsaved draft found',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'An unsaved draft for this scene was found on this device. Would you like to restore it or discard it and load the server version?',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey.shade700),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextButton(
                        onPressed: () {
                          ref.read(editorProvider.notifier).discardDraft();
                        },
                        child: const Text('Discard'),
                      ),
                      const SizedBox(width: 16),
                      FilledButton(
                        onPressed: () {
                          ref.read(editorProvider.notifier).restoreDraft();
                        },
                        child: const Text('Restore Draft'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final controller = ref.read(editorProvider.notifier).controller;

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          ref.read(editorProvider.notifier).forceSave(widget.projectId);
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.scene.title),
          actions: [
            SaveIndicator(sceneId: widget.sceneId),
            Center(
              child: Padding(
                padding: const EdgeInsets.only(right: 16.0),
                child: Text('${state.wordCount} words', style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ),
            ),
          ],
        ),
        body: Column(
          children: [
            QuillSimpleToolbar(
              controller: controller,
              configurations: const QuillSimpleToolbarConfigurations(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: QuillEditor.basic(
                  controller: controller,
                  focusNode: _focusNode,
                  scrollController: _scrollController,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
