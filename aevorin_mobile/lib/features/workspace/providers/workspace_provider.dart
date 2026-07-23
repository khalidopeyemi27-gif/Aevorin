import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/workspace_tab.dart';
import '../../projects/models/project.dart';

enum StoryRoomSection { outline, characters, locations, items, factions, graph }

class WorkspaceState {
  final ProjectData? project;
  final WorkspaceTab activeTab;
  final StoryRoomSection storyRoomSection;
  final bool focusMode;
  final double editorFontSize;
  final bool isLoaded;
  
  // Phase 4 & 5 additions
  final String? selectedProjectId;
  final String? selectedChapterId;
  final String? selectedSceneId;
  final Set<String> expandedChapters;

  WorkspaceState({
    this.project,
    this.activeTab = WorkspaceTab.manuscript,
    this.storyRoomSection = StoryRoomSection.outline,
    this.focusMode = false,
    this.editorFontSize = 16.0,
    this.isLoaded = false,
    this.selectedProjectId,
    this.selectedChapterId,
    this.selectedSceneId,
    this.expandedChapters = const {},
  });

  WorkspaceState copyWith({
    ProjectData? project,
    WorkspaceTab? activeTab,
    StoryRoomSection? storyRoomSection,
    bool? focusMode,
    double? editorFontSize,
    bool? isLoaded,
    String? selectedProjectId,
    String? selectedChapterId,
    String? selectedSceneId,
    Set<String>? expandedChapters,
  }) {
    return WorkspaceState(
      project: project ?? this.project,
      activeTab: activeTab ?? this.activeTab,
      storyRoomSection: storyRoomSection ?? this.storyRoomSection,
      focusMode: focusMode ?? this.focusMode,
      editorFontSize: editorFontSize ?? this.editorFontSize,
      isLoaded: isLoaded ?? this.isLoaded,
      selectedProjectId: selectedProjectId ?? this.selectedProjectId,
      selectedChapterId: selectedChapterId ?? this.selectedChapterId,
      selectedSceneId: selectedSceneId ?? this.selectedSceneId,
      expandedChapters: expandedChapters ?? this.expandedChapters,
    );
  }
}

class WorkspaceController extends Notifier<WorkspaceState> {
  static const String _keyActiveTab = 'ws_active_tab';
  static const String _keyStorySection = 'ws_story_section';
  static const String _keyFocusMode = 'ws_focus_mode';
  static const String _keyFontSize = 'ws_font_size';
  
  static const String _keySelectedProjectId = 'ws_selected_project_id';
  static const String _keySelectedChapterId = 'ws_selected_chapter_id';
  static const String _keySelectedSceneId = 'ws_selected_scene_id';
  static const String _keyExpandedChapters = 'ws_expanded_chapters';

  @override
  WorkspaceState build() {
    _loadPersistedState();
    return WorkspaceState();
  }

  Future<void> _loadPersistedState() async {
    final prefs = await SharedPreferences.getInstance();
    
    final tabIndex = prefs.getInt(_keyActiveTab) ?? 0;
    final sectionIndex = prefs.getInt(_keyStorySection) ?? 0;
    final focusMode = prefs.getBool(_keyFocusMode) ?? false;
    final fontSize = prefs.getDouble(_keyFontSize) ?? 16.0;
    
    final selectedProjectId = prefs.getString(_keySelectedProjectId);
    final selectedChapterId = prefs.getString(_keySelectedChapterId);
    final selectedSceneId = prefs.getString(_keySelectedSceneId);
    final expandedChaptersList = prefs.getStringList(_keyExpandedChapters) ?? [];

    state = state.copyWith(
      activeTab: WorkspaceTab.values[tabIndex],
      storyRoomSection: StoryRoomSection.values[sectionIndex],
      focusMode: focusMode,
      editorFontSize: fontSize,
      selectedProjectId: selectedProjectId,
      selectedChapterId: selectedChapterId,
      selectedSceneId: selectedSceneId,
      expandedChapters: expandedChaptersList.toSet(),
      isLoaded: true,
    );
  }

  void setProject(ProjectData project) async {
    state = state.copyWith(project: project, selectedProjectId: project.id);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keySelectedProjectId, project.id);
  }

  Future<void> setTab(WorkspaceTab tab) async {
    state = state.copyWith(activeTab: tab);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyActiveTab, tab.index);
  }

  Future<void> setStoryRoomSection(StoryRoomSection section) async {
    state = state.copyWith(storyRoomSection: section);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyStorySection, section.index);
  }

  Future<void> toggleFocusMode() async {
    final newValue = !state.focusMode;
    state = state.copyWith(focusMode: newValue);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyFocusMode, newValue);
  }

  Future<void> setEditorFontSize(double size) async {
    state = state.copyWith(editorFontSize: size);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble(_keyFontSize, size);
  }

  Future<void> selectChapter(String? chapterId) async {
    state = state.copyWith(selectedChapterId: chapterId);
    final prefs = await SharedPreferences.getInstance();
    if (chapterId != null) {
      await prefs.setString(_keySelectedChapterId, chapterId);
    } else {
      await prefs.remove(_keySelectedChapterId);
    }
  }

  Future<void> selectScene(String? sceneId) async {
    state = state.copyWith(selectedSceneId: sceneId);
    final prefs = await SharedPreferences.getInstance();
    if (sceneId != null) {
      await prefs.setString(_keySelectedSceneId, sceneId);
    } else {
      await prefs.remove(_keySelectedSceneId);
    }
  }

  Future<void> toggleChapterExpansion(String chapterId) async {
    final newExpanded = Set<String>.from(state.expandedChapters);
    if (newExpanded.contains(chapterId)) {
      newExpanded.remove(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    
    state = state.copyWith(expandedChapters: newExpanded);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_keyExpandedChapters, newExpanded.toList());
  }
}

final workspaceControllerProvider = NotifierProvider<WorkspaceController, WorkspaceState>(() {
  return WorkspaceController();
});
