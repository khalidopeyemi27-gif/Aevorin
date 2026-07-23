import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/workspace_provider.dart';
import '../../projects/providers/scene_provider.dart';
import '../../projects/models/chapter.dart';
import '../../projects/models/scene.dart';

class ManuscriptShellScreen extends ConsumerStatefulWidget {
  const ManuscriptShellScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ManuscriptShellScreen> createState() => _ManuscriptShellScreenState();
}

class _ManuscriptShellScreenState extends ConsumerState<ManuscriptShellScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final projectId = ref.read(workspaceControllerProvider).selectedProjectId;
      if (projectId != null) {
        ref.read(manuscriptHierarchyProvider.notifier).loadProject(projectId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final hierarchyAsync = ref.watch(manuscriptHierarchyProvider);
    final workspaceState = ref.watch(workspaceControllerProvider);

    if (hierarchyAsync.isLoading && !hierarchyAsync.hasValue) {
      return _buildSkeletonLoader();
    }

    if (hierarchyAsync.hasError && !hierarchyAsync.hasValue) {
      return _buildErrorState(hierarchyAsync.error.toString(), workspaceState);
    }

    final hierarchy = hierarchyAsync.value;
    if (hierarchy == null) return _buildSkeletonLoader();

    if (hierarchy.chapters.isEmpty && hierarchy.unassignedScenes.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.menu_book, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                const Text('Your manuscript is empty', style: TextStyle(fontSize: 18, color: Colors.grey)),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => _showCreateChapterDialog(context, ref),
                  icon: const Icon(Icons.add),
                  label: const Text('Add Chapter'),
                )
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            if (workspaceState.selectedProjectId != null) {
              await ref.read(manuscriptHierarchyProvider.notifier).loadProject(workspaceState.selectedProjectId!);
            }
          },
          child: CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final chapterNode = hierarchy.chapters[index];
                      return _buildChapterTile(context, ref, chapterNode.chapter, chapterNode.scenes, workspaceState);
                    },
                    childCount: hierarchy.chapters.length,
                  ),
                ),
              ),
              // Unassigned scenes (if any)
              if (hierarchy.unassignedScenes.isNotEmpty)
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final scene = hierarchy.unassignedScenes[index];
                      return _buildSceneTile(context, ref, scene, workspaceState);
                    },
                    childCount: hierarchy.unassignedScenes.length,
                  ),
                ),
            ],
          ),
        );
  }

  Widget _buildSkeletonLoader() {
    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.grey.withAlpha(50),
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: 200,
                height: 36,
                margin: const EdgeInsets.only(left: 32),
                decoration: BoxDecoration(
                  color: Colors.grey.withAlpha(30),
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildErrorState(String error, WorkspaceState workspaceState) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.cloud_off, size: 48, color: Colors.orange),
          const SizedBox(height: 16),
          Text('Offline or Error:\n$error', textAlign: TextAlign.center),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              if (workspaceState.selectedProjectId != null) {
                ref.read(manuscriptHierarchyProvider.notifier).loadProject(workspaceState.selectedProjectId!);
              }
            },
            child: const Text('Retry Connection'),
          )
        ],
      ),
    );
  }

  Widget _buildChapterTile(BuildContext context, WidgetRef ref, Chapter chapter, List<Scene> scenes, WorkspaceState workspaceState) {
    final isExpanded = workspaceState.expandedChapters.contains(chapter.id);

    return ExpansionTile(
      key: PageStorageKey<String>(chapter.id),
      initiallyExpanded: isExpanded,
      onExpansionChanged: (expanded) {
        ref.read(workspaceControllerProvider.notifier).toggleChapterExpansion(chapter.id);
      },
      title: GestureDetector(
        onLongPress: () => _showChapterContextMenu(context, ref, chapter),
        child: Text(chapter.title, style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
      children: [
        if (scenes.isEmpty)
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('No scenes', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic)),
          ),
        ...scenes.map((s) => _buildSceneTile(context, ref, s, workspaceState)),
        ListTile(
          leading: const Icon(Icons.add, size: 20, color: Colors.grey),
          title: const Text('Add Scene', style: TextStyle(color: Colors.grey, fontSize: 14)),
          onTap: () => _showCreateSceneDialog(context, ref, chapter.id),
        ),
      ],
    );
  }

  Widget _buildSceneTile(BuildContext context, WidgetRef ref, Scene scene, WorkspaceState workspaceState) {
    final isSelected = workspaceState.selectedSceneId == scene.id;

    return Container(
      color: isSelected ? Theme.of(context).colorScheme.primaryContainer.withAlpha(50) : null,
      child: ListTile(
        contentPadding: const EdgeInsets.only(left: 32.0, right: 16.0),
        leading: Icon(
          Icons.article_outlined,
          color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey,
        ),
        title: Text(
          scene.title,
          style: TextStyle(
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? Theme.of(context).colorScheme.primary : null,
          ),
        ),
        trailing: Text(
          '${scene.wordCount}w',
          style: const TextStyle(color: Colors.grey, fontSize: 12),
        ),
        onTap: () {
          ref.read(workspaceControllerProvider.notifier).selectChapter(scene.chapterId);
          ref.read(workspaceControllerProvider.notifier).selectScene(scene.id);
          
          final projectId = ref.read(workspaceControllerProvider).selectedProjectId;
          if (projectId == null) return;
          
          context.push(
            '/project/$projectId/scene/${scene.id}',
            extra: scene,
          );
        },
        onLongPress: () => _showSceneContextMenu(context, ref, scene),
      ),
    );
  }

  // --- Modals & Dialogs ---

  void _showChapterContextMenu(BuildContext context, WidgetRef ref, Chapter chapter) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.edit),
                title: const Text('Rename Chapter'),
                onTap: () {
                  Navigator.pop(ctx);
                  _showRenameChapterDialog(context, ref, chapter);
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete, color: Colors.red),
                title: const Text('Delete Chapter', style: TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.pop(ctx);
                  _confirmDeleteChapter(context, ref, chapter);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showSceneContextMenu(BuildContext context, WidgetRef ref, Scene scene) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.edit),
                title: const Text('Rename Scene'),
                onTap: () {
                  Navigator.pop(ctx);
                  _showRenameSceneDialog(context, ref, scene);
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete, color: Colors.red),
                title: const Text('Delete Scene', style: TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.pop(ctx);
                  _confirmDeleteScene(context, ref, scene);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // Create/Rename Forms omitted for brevity but they'd just be simple AlertDialogs
  void _showCreateChapterDialog(BuildContext context, WidgetRef ref) {
    String title = '';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Chapter'),
        content: TextField(
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Chapter Title'),
          onChanged: (val) => title = val,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              ref.read(manuscriptHierarchyProvider.notifier).createChapter(title.trim());
              Navigator.pop(ctx);
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  void _showCreateSceneDialog(BuildContext context, WidgetRef ref, String chapterId) {
    String title = '';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Scene'),
        content: TextField(
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Scene Title'),
          onChanged: (val) => title = val,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              ref.read(manuscriptHierarchyProvider.notifier).createScene(chapterId, title.trim());
              Navigator.pop(ctx);
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  void _showRenameChapterDialog(BuildContext context, WidgetRef ref, Chapter chapter) {
    String title = chapter.title;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Rename Chapter'),
        content: TextField(
          autofocus: true,
          controller: TextEditingController(text: title),
          decoration: const InputDecoration(hintText: 'Chapter Title'),
          onChanged: (val) => title = val,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              if (title.isNotEmpty && title != chapter.title) {
                ref.read(manuscriptHierarchyProvider.notifier).renameChapter(chapter.id, title);
              }
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showRenameSceneDialog(BuildContext context, WidgetRef ref, Scene scene) {
    String title = scene.title;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Rename Scene'),
        content: TextField(
          autofocus: true,
          controller: TextEditingController(text: title),
          decoration: const InputDecoration(hintText: 'Scene Title'),
          onChanged: (val) => title = val,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              if (title.isNotEmpty && title != scene.title) {
                ref.read(manuscriptHierarchyProvider.notifier).renameScene(scene.id, title);
              }
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteChapter(BuildContext context, WidgetRef ref, Chapter chapter) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Chapter?'),
        content: Text('Are you sure you want to delete "${chapter.title}"? Any scenes inside it will be moved to unassigned.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              ref.read(manuscriptHierarchyProvider.notifier).deleteChapter(chapter.id);
              Navigator.pop(ctx);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteScene(BuildContext context, WidgetRef ref, Scene scene) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Scene?'),
        content: Text('Are you sure you want to delete "${scene.title}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              ref.read(manuscriptHierarchyProvider.notifier).deleteScene(scene.id);
              Navigator.pop(ctx);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
