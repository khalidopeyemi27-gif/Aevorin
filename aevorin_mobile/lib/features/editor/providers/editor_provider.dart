import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'dart:async';
import 'package:flutter/material.dart' show TextSelection;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_quill/flutter_quill.dart';
import '../repositories/editor_repository.dart';
import '../services/delta_html_converter.dart';
import '../../../core/database/database.dart';

enum EditorStateStatus {
  loading,
  draftFound,
  ready,
  modified,
  saving,
  saved,
  saveFailed,
}

class EditorState {
  final EditorStateStatus status;
  final String? errorMessage;
  final int wordCount;
  final Draft? foundDraft;
  final String? initialContentHtml;

  const EditorState({
    this.status = EditorStateStatus.loading,
    this.errorMessage,
    this.wordCount = 0,
    this.foundDraft,
    this.initialContentHtml,
  });

  EditorState copyWith({
    EditorStateStatus? status,
    String? errorMessage,
    int? wordCount,
    Draft? foundDraft,
    String? initialContentHtml,
  }) {
    return EditorState(
      status: status ?? this.status,
      errorMessage: errorMessage ?? this.errorMessage,
      wordCount: wordCount ?? this.wordCount,
      foundDraft: foundDraft ?? this.foundDraft,
      initialContentHtml: initialContentHtml ?? this.initialContentHtml,
    );
  }
}

final editorProvider = NotifierProvider.autoDispose<EditorNotifier, EditorState>(EditorNotifier.new);

class EditorNotifier extends Notifier<EditorState> {
  EditorRepository get _repository => ref.read(editorRepositoryProvider);
  String? _sceneId;
  
  QuillController? _controller;
  Timer? _localSaveTimer;
  Timer? _apiSaveTimer;
  String? _lastSavedHash;

  @override
  EditorState build() {
    ref.onDispose(() {
      _localSaveTimer?.cancel();
      _apiSaveTimer?.cancel();
      _controller?.dispose();
    });
    
    return const EditorState();
  }

  QuillController get controller => _controller!;

  EditorState _copyWith({
    EditorStateStatus? status,
    String? errorMessage,
    int? wordCount,
    Draft? foundDraft,
    String? initialContentHtml,
  }) {
    return state.copyWith(
      status: status ?? state.status,
      errorMessage: errorMessage ?? state.errorMessage,
      wordCount: wordCount ?? state.wordCount,
      foundDraft: foundDraft ?? state.foundDraft,
      initialContentHtml: initialContentHtml ?? state.initialContentHtml,
    );
  }

  int _countWords(String text) {
    final trimmed = text.trim();
    return trimmed.isEmpty ? 0 : trimmed.split(RegExp(r'\s+')).length;
  }

  Future<void> loadScene(String projectId, String sceneId, String initialContentHtml) async {
    _sceneId = sceneId;

    final localDraft = await _repository.getDraftFromCache(sceneId);

    // If local draft exists, automatically load it so offline edits are preserved!
    if (localDraft != null && localDraft.contentDelta != null) {
      try {
        final deltaJson = jsonDecode(localDraft.contentDelta!);
        _controller = QuillController(
          document: Document.fromJson(deltaJson),
          selection: const TextSelection.collapsed(offset: 0),
        );
        state = _copyWith(
          status: EditorStateStatus.ready,
          wordCount: _countWords(_controller!.document.toPlainText()),
        );
        _controller!.addListener(_onTextChanged);
        return;
      } catch (_) {
        // Fallback to initialContentHtml on parse failure
      }
    }

    _initializeEditorWithHtml(initialContentHtml);
  }

  void restoreDraft() {
    if (state.foundDraft == null) return;
    
    try {
      final rawDelta = state.foundDraft!.contentDelta;
      if (rawDelta == null) return;
      final deltaJson = jsonDecode(rawDelta);
      _controller = QuillController(
        document: Document.fromJson(deltaJson),
        selection: const TextSelection.collapsed(offset: 0),
      );
      state = _copyWith(
        status: EditorStateStatus.ready,
        wordCount: _countWords(_controller!.document.toPlainText()),
        foundDraft: null,
      );
      _controller!.addListener(_onTextChanged);
      // Immediately set as modified so it syncs up the restored draft
      _onTextChanged();
    } catch (e) {
      // Fallback
      discardDraft();
    }
  }

  void discardDraft() {
    if (state.initialContentHtml == null) return;
    _initializeEditorWithHtml(state.initialContentHtml!);
  }

  void _initializeEditorWithHtml(String html) {
    final doc = DeltaHtmlConverter.htmlToDelta(html);
    _controller = QuillController(
      document: doc,
      selection: const TextSelection.collapsed(offset: 0),
    );
    state = _copyWith(
      status: EditorStateStatus.ready,
      wordCount: _countWords(doc.toPlainText()),
      foundDraft: null,
    );
    _controller!.addListener(_onTextChanged);
  }

  void _onTextChanged() {
    if (_controller == null) return;

    state = _copyWith(
      status: EditorStateStatus.modified,
      wordCount: _countWords(_controller!.document.toPlainText()),
    );

    _localSaveTimer?.cancel();
    _localSaveTimer = Timer(const Duration(milliseconds: 500), () {
      if (state.status == EditorStateStatus.modified) {
        _saveToLocalCache();
      }
    });

    _apiSaveTimer?.cancel();
    _apiSaveTimer = Timer(const Duration(seconds: 2), () {
      // Only sync if dirty flag is still on
      if (state.status == EditorStateStatus.modified || state.status == EditorStateStatus.saved) {
        _syncToBackend(null); 
      }
    });
  }

  Future<void> _saveToLocalCache() async {
    if (_controller == null || _sceneId == null) return;
    
    try {
      state = _copyWith(status: EditorStateStatus.saving);
      
      // Fast serialization, NO HTML conversion
      final deltaJson = jsonEncode(_controller!.document.toDelta().toJson());
      final contentHash = sha256.convert(utf8.encode(deltaJson)).toString();
      
      if (_lastSavedHash == contentHash) {
        return; // Skip save if hash matches
      }
      
      await _repository.saveDraftToCache(_sceneId!, deltaJson, contentHash, state.wordCount);
      _lastSavedHash = contentHash;
      
      // We don't mark as 'saved' here because the backend sync hasn't happened.
      // We keep it as modified so the API timer knows to sync.
      // state = _copyWith(status: EditorStateStatus.saved);
    } catch (e) {
      state = _copyWith(
        status: EditorStateStatus.saveFailed,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> _syncToBackend(String? projectId) async {
    if (_controller == null || _sceneId == null) return;
    // Real app would fetch projectId from somewhere if null, but keeping simple for now
    
    try {
      state = _copyWith(status: EditorStateStatus.saving);
      
      // Expensive conversion only happens once every 2 seconds on save
      final html = DeltaHtmlConverter.deltaToHtml(_controller!.document);
      
      await _repository.syncToBackend(projectId ?? "default_project", _sceneId!, html, state.wordCount);
      
      state = _copyWith(status: EditorStateStatus.saved);
    } catch (e) {
      // Fallback: Add to SyncQueue on network failure
      final payload = jsonEncode({
        'sceneId': _sceneId,
        'html': DeltaHtmlConverter.deltaToHtml(_controller!.document),
        'timestamp': DateTime.now().toIso8601String(),
        'wordCount': state.wordCount,
      });
      await _repository.enqueueSync(_sceneId!, payload);

      state = _copyWith(
        status: EditorStateStatus.saved,
      );
    }
  }

  Future<void> forceSave(String projectId) async {
    _localSaveTimer?.cancel();
    _apiSaveTimer?.cancel();
    await _saveToLocalCache();
    await _syncToBackend(projectId);
  }
}
