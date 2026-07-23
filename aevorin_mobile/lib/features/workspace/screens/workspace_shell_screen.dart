import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/workspace_tab.dart';
import '../providers/workspace_provider.dart';
import 'manuscript_shell_screen.dart';
import '../../editor/services/background_sync_service.dart';
import 'export_screen.dart';
import 'global_search_screen.dart';
import 'project_settings_screen.dart';
import '../../worldbuilding/screens/story_room_screen.dart';

class WorkspaceShellScreen extends ConsumerWidget {
  const WorkspaceShellScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workspaceState = ref.watch(workspaceControllerProvider);
    ref.watch(backgroundSyncServiceProvider); // keep alive for offline sync polling

    if (!workspaceState.isLoaded || workspaceState.project == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final project = workspaceState.project!;

    Color? accentColor;
    if (project.accentColor != null && project.accentColor!.isNotEmpty) {
      try {
        final hex = project.accentColor!.replaceAll('#', '');
        accentColor = Color(int.parse('FF$hex', radix: 16));
      } catch (e) {
        // ignore invalid hex
      }
    }

    Widget shell = Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: 'My Library',
          onPressed: () => context.go('/dashboard'),
        ),
        title: Text(project.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              Navigator.of(context).push(MaterialPageRoute(
                builder: (context) => const GlobalSearchScreen(),
              ));
            },
            tooltip: 'Search',
          ),
          IconButton(
            icon: Icon(workspaceState.focusMode ? Icons.fullscreen_exit : Icons.fullscreen),
            onPressed: () {
              ref.read(workspaceControllerProvider.notifier).toggleFocusMode();
            },
            tooltip: 'Toggle Focus Mode',
          )
        ],
      ),
      body: IndexedStack(
        index: workspaceState.activeTab.index,
        children: const [
          // 0: Manuscript (Editor & Scenes)
          ManuscriptShellScreen(),
          
          // 1: Story Room
          StoryRoomScreen(),
          
          // 2: Export
          ExportScreen(),
          
          // 3: Settings
          ProjectSettingsScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: workspaceState.activeTab.index,
        onDestinationSelected: (index) {
          ref.read(workspaceControllerProvider.notifier).setTab(WorkspaceTab.values[index]);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.edit_document),
            label: 'Manuscript',
          ),
          NavigationDestination(
            icon: Icon(Icons.auto_awesome),
            label: 'Story Room',
          ),
          NavigationDestination(
            icon: Icon(Icons.publish),
            label: 'Export',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );

    if (accentColor != null) {
      return Theme(
        data: Theme.of(context).copyWith(
          colorScheme: ColorScheme.fromSeed(
            seedColor: accentColor, 
            brightness: Theme.of(context).brightness
          ),
        ),
        child: shell,
      );
    }

    return shell;
  }
}
