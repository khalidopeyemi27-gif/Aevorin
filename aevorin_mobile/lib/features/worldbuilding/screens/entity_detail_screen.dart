import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/database/database.dart';
import '../providers/entity_provider.dart';

class EntityDetailScreen extends ConsumerStatefulWidget {
  final String? entityId;
  final String defaultType;

  const EntityDetailScreen({Key? key, this.entityId, required this.defaultType}) : super(key: key);

  @override
  ConsumerState<EntityDetailScreen> createState() => _EntityDetailScreenState();
}

class _EntityDetailScreenState extends ConsumerState<EntityDetailScreen> {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _imagePathController;

  String _currentType = 'CHARACTER';
  String _currentTemplate = 'Default';

  // Template specific controllers
  final Map<String, TextEditingController> _metadataControllers = {};

  bool _isLoading = true;

  final Map<String, List<String>> _templatesForType = {
    'CHARACTER': ['Default', 'Hero', 'Villain', 'Mentor', 'Merchant'],
    'WORLD': ['Default', 'Kingdom', 'Planet', 'Capital City'],
    'ITEM': ['Default', 'Sword', 'Artifact', 'Document'],
    'FACTION': ['Default', 'Guild', 'Cult', 'Government'],
  };

  Timer? _draftTimer;
  final String _draftId = 'entity_draft_';

  @override
  void initState() {
    super.initState();
    _currentType = widget.defaultType;
    _currentTemplate = 'Default';
    _initControllers();
    _loadEntityData();

    _draftTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _saveDraftLocally();
    });
  }

  void _initControllers() {
    _titleController = TextEditingController();
    _descriptionController = TextEditingController();
    _imagePathController = TextEditingController();
  }

  TextEditingController _getMetaController(String key) {
    if (!_metadataControllers.containsKey(key)) {
      _metadataControllers[key] = TextEditingController();
    }
    return _metadataControllers[key]!;
  }

  Future<void> _saveDraftLocally() async {
    if (_isLoading) return;

    final metadata = <String, dynamic>{
      'templateId': _currentTemplate,
      'imagePath': _imagePathController.text,
      'imageSource': 'LOCAL',
    };
    _metadataControllers.forEach((key, controller) {
      metadata[key] = controller.text;
    });

    final draftState = {
      'type': _currentType,
      'title': _titleController.text,
      'description': _descriptionController.text,
      'metadata': metadata,
    };

    final db = ref.read(databaseProvider);
    await db.saveDraft(
      sceneId: _draftId + (widget.entityId ?? 'new'),
      contentDelta: jsonEncode(draftState),
      contentHash: '', // Not strictly needed for this draft
      wordCount: 0,
      syncState: DraftSyncState.pending,
    );
  }

  Future<void> _loadEntityData() async {
    final db = ref.read(databaseProvider);
    final draft = await db.getDraft(_draftId + (widget.entityId ?? 'new'));

    if (draft != null && draft.contentDelta != null && draft.contentDelta!.isNotEmpty) {
      final restore = await _promptRestoreDraft();
      if (restore) {
        _applyDraftState(draft.contentDelta!);
        setState(() => _isLoading = false);
        return;
      } else {
        // Discard draft
        await (db.delete(db.drafts)..where((t) => t.sceneId.equals(_draftId + (widget.entityId ?? 'new')))).go();
      }
    }

    if (widget.entityId == null) {
      setState(() => _isLoading = false);
      return;
    }

    final entitiesAsync = ref.read(entitiesProvider);
    final entities = entitiesAsync.asData?.value ?? [];
    try {
      final entity = entities.firstWhere((e) => e.id == widget.entityId);
      _titleController.text = entity.title;
      _descriptionController.text = entity.description ?? '';
      _imagePathController.text = entity.imagePath ?? '';
      _currentType = entity.type;
      _currentTemplate = entity.templateId ?? 'Default';

      if (entity.metadataJson != null && entity.metadataJson!.isNotEmpty) {
        final meta = jsonDecode(entity.metadataJson!) as Map<String, dynamic>;
        meta.forEach((key, value) {
          if (value is String) {
            _getMetaController(key).text = value;
          }
        });
      }
    } catch (e) {
      print('Entity not found in cache: $e');
    }
    setState(() => _isLoading = false);
  }

  Future<bool> _promptRestoreDraft() async {
    return await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Unsaved Draft Found'),
        content: const Text('You have an unsaved draft for this entity. Would you like to restore it?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Discard'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Restore'),
          ),
        ],
      ),
    ) ?? false;
  }

  void _applyDraftState(String jsonStr) {
    try {
      final data = jsonDecode(jsonStr) as Map<String, dynamic>;
      _currentType = data['type'] ?? _currentType;
      _titleController.text = data['title'] ?? '';
      _descriptionController.text = data['description'] ?? '';
      
      final meta = data['metadata'] as Map<String, dynamic>?;
      if (meta != null) {
        _currentTemplate = meta['templateId'] ?? 'Default';
        _imagePathController.text = meta['imagePath'] ?? '';
        meta.forEach((key, value) {
          if (value is String && key != 'templateId' && key != 'imagePath' && key != 'imageSource') {
            _getMetaController(key).text = value;
          }
        });
      }
    } catch (e) {
      print('Failed to apply draft state: $e');
    }
  }

  @override
  void dispose() {
    _draftTimer?.cancel();
    _saveDraftLocally();
    _titleController.dispose();
    _descriptionController.dispose();
    _imagePathController.dispose();
    for (var controller in _metadataControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _saveEntity() async {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name / Title is required')));
      return;
    }

    final entitiesAsync = ref.read(entitiesProvider);
    final entities = entitiesAsync.asData?.value ?? [];
    final isDuplicate = entities.any((e) => 
      e.id != widget.entityId && 
      e.type == _currentType && 
      e.title.toLowerCase() == _titleController.text.trim().toLowerCase()
    );

    if (isDuplicate) {
      final bool? proceed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Duplicate Name'),
          content: Text('An entity named "${_titleController.text.trim()}" already exists as a $_currentType. Do you want to continue saving?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Save Anyway'),
            ),
          ],
        ),
      );
      if (proceed != true) return;
    }

    final actions = ref.read(entityActionsProvider);
    
    final metadata = <String, dynamic>{
      'templateId': _currentTemplate,
      'imagePath': _imagePathController.text,
      'imageSource': 'LOCAL',
    };
    
    _metadataControllers.forEach((key, controller) {
      metadata[key] = controller.text;
    });

    try {
      if (widget.entityId == null) {
        await actions.createEntity(
          _currentType, 
          _titleController.text.trim(), 
          _descriptionController.text.trim(), 
          metadata
        );
      } else {
        await actions.updateEntity(widget.entityId!, {
          'title': _titleController.text.trim(),
          'summary': _descriptionController.text.trim(),
          'metadata': metadata,
        });
      }
      if (mounted) Navigator.of(context).pop();
      // Clear draft on success
      final db = ref.read(databaseProvider);
      await (db.delete(db.drafts)..where((t) => t.sceneId.equals(_draftId + (widget.entityId ?? 'new')))).go();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error saving: $e')));
    }
  }

  Future<void> _confirmDelete() async {
    if (widget.entityId == null) return;
    
    // In a real app we'd fetch the exact count from Drift here. 
    // For now we'll mock the dialog to demonstrate the cascade warning.
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete "${_titleController.text}"?'),
        content: const Text(
          'This will also remove:\n\n'
          '• All connected relationships\n'
          '• Graph connections\n\n'
          'This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await ref.read(entityActionsProvider).deleteEntity(widget.entityId!);
        if (mounted) {
          Navigator.of(context).pop(); // Go back to Story Room
        }
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error deleting: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.entityId == null ? 'New $_currentType' : 'Edit $_currentType'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Personality'),
              Tab(text: 'Story'),
              Tab(text: 'Connections'),
            ],
          ),
          actions: [
            if (widget.entityId != null)
              IconButton(
                icon: const Icon(Icons.delete, color: Colors.redAccent),
                onPressed: _confirmDelete,
                tooltip: 'Delete Entity',
              ),
            TextButton(
              onPressed: _saveEntity,
              child: const Text('Save'),
            )
          ],
        ),
        body: TabBarView(
          children: [
            _buildOverviewTab(),
            _buildPersonalityTab(),
            _buildStoryTab(),
            _buildConnectionsTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 800),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(16),
                      image: _imagePathController.text.isNotEmpty
                          ? DecorationImage(image: NetworkImage(_imagePathController.text), fit: BoxFit.cover)
                          : null,
                    ),
                    child: _imagePathController.text.isEmpty
                        ? const Center(child: Icon(Icons.image, size: 48, color: Colors.grey))
                        : null,
                  ),
                  const SizedBox(width: 24),
                  Expanded(
                    child: Column(
                      children: [
                        TextField(
                          controller: _titleController,
                          decoration: const InputDecoration(labelText: 'Name / Title', border: OutlineInputBorder()),
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: _currentType,
                                decoration: const InputDecoration(labelText: 'Entity Type', border: OutlineInputBorder()),
                                items: _templatesForType.keys.map((String value) {
                                  return DropdownMenuItem<String>(value: value, child: Text(value));
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() {
                                      _currentType = val;
                                      _currentTemplate = _templatesForType[val]!.first;
                                    });
                                  }
                                },
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: _currentTemplate,
                                decoration: const InputDecoration(labelText: 'Template', border: OutlineInputBorder()),
                                items: (_templatesForType[_currentType] ?? ['Default']).map((String value) {
                                  return DropdownMenuItem<String>(value: value, child: Text(value));
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _currentTemplate = val);
                                },
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Short Description', border: OutlineInputBorder()),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _imagePathController,
                decoration: const InputDecoration(labelText: 'Image URL/Path', border: OutlineInputBorder()),
                onChanged: (_) => setState((){}),
              ),
              const Divider(height: 64),
              Text('Identity', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Theme.of(context).colorScheme.primary)),
              const SizedBox(height: 16),
              if (_currentType == 'CHARACTER') ...[
                Row(
                  children: [
                    Expanded(child: TextField(controller: _getMetaController('role'), decoration: const InputDecoration(labelText: 'Role (e.g. Protagonist)', border: OutlineInputBorder()))),
                    const SizedBox(width: 16),
                    Expanded(child: TextField(controller: _getMetaController('age'), decoration: const InputDecoration(labelText: 'Age', border: OutlineInputBorder()))),
                    const SizedBox(width: 16),
                    Expanded(child: TextField(controller: _getMetaController('species'), decoration: const InputDecoration(labelText: 'Species', border: OutlineInputBorder()))),
                  ],
                ),
              ] else if (_currentType == 'WORLD') ...[
                Row(
                  children: [
                    Expanded(child: TextField(controller: _getMetaController('climate'), decoration: const InputDecoration(labelText: 'Climate', border: OutlineInputBorder()))),
                    const SizedBox(width: 16),
                    Expanded(child: TextField(controller: _getMetaController('culture'), decoration: const InputDecoration(labelText: 'Culture', border: OutlineInputBorder()))),
                  ],
                ),
              ] else if (_currentType == 'ITEM') ...[
                Row(
                  children: [
                    Expanded(child: TextField(controller: _getMetaController('origin'), decoration: const InputDecoration(labelText: 'Origin', border: OutlineInputBorder()))),
                    const SizedBox(width: 16),
                    Expanded(child: TextField(controller: _getMetaController('creator'), decoration: const InputDecoration(labelText: 'Creator', border: OutlineInputBorder()))),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(controller: _getMetaController('powers'), decoration: const InputDecoration(labelText: 'Powers / Abilities', border: OutlineInputBorder()), maxLines: 2),
              ]
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPersonalityTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 800),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Personality', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Theme.of(context).colorScheme.primary)),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: TextField(controller: _getMetaController('traits'), decoration: const InputDecoration(labelText: 'Traits', border: OutlineInputBorder()))),
                  const SizedBox(width: 16),
                  Expanded(child: TextField(controller: _getMetaController('strengths'), decoration: const InputDecoration(labelText: 'Strengths', border: OutlineInputBorder()))),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: TextField(controller: _getMetaController('weaknesses'), decoration: const InputDecoration(labelText: 'Weaknesses', border: OutlineInputBorder()))),
                  const SizedBox(width: 16),
                  Expanded(child: TextField(controller: _getMetaController('motivation'), decoration: const InputDecoration(labelText: 'Motivation', border: OutlineInputBorder()))),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: TextField(controller: _getMetaController('fear'), decoration: const InputDecoration(labelText: 'Fear', border: OutlineInputBorder()))),
                  const SizedBox(width: 16),
                  Expanded(child: TextField(controller: _getMetaController('secret'), decoration: const InputDecoration(labelText: 'Secret', border: OutlineInputBorder()))),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStoryTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 800),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Story Arc', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Theme.of(context).colorScheme.primary)),
              const SizedBox(height: 16),
              TextField(controller: _getMetaController('firstAppearance'), decoration: const InputDecoration(labelText: 'First Appearance', border: OutlineInputBorder())),
              const SizedBox(height: 16),
              TextField(controller: _getMetaController('characterArc'), decoration: const InputDecoration(labelText: 'Story Arc', border: OutlineInputBorder()), maxLines: 3),
              const Divider(height: 64),
              Text('AI Consistency Engine', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.purple)),
              const SizedBox(height: 8),
              const Text('These fields help the AI understand how this entity behaves.', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 16),
              TextField(controller: _getMetaController('voiceStyle'), decoration: const InputDecoration(labelText: 'Voice & Speaking Style', border: OutlineInputBorder()), maxLines: 2),
              const SizedBox(height: 16),
              TextField(controller: _getMetaController('behaviorRules'), decoration: const InputDecoration(labelText: 'Behavior Rules / Forbidden Actions', border: OutlineInputBorder()), maxLines: 3),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildConnectionsTab() {
    // We will build a more complex connection manager in a separate widget if it grows, 
    // but for now, show grouped relationships.
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 800),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Connections', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Theme.of(context).colorScheme.primary)),
                  FilledButton.icon(
                    onPressed: () {
                      // Show add connection dialog
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add Connection coming soon')));
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Add Connection'),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              
              _buildConnectionGroup('Primary Relationships', [
                _mockConnection('Arwen', 'Lovers', 90, 'bidirectional', 'They love each other.'),
                _mockConnection('Gandalf', 'Mentor', 80, 'forward', 'Gandalf guides him.'),
              ]),
              
              const SizedBox(height: 24),
              _buildConnectionGroup('Secondary', [
                _mockConnection('Legolas', 'Ally', 60, 'bidirectional', ''),
                _mockConnection('Gimli', 'Ally', 60, 'bidirectional', ''),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildConnectionGroup(String title, List<Widget> connections) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey)),
        const SizedBox(height: 12),
        ...connections,
      ],
    );
  }

  Widget _mockConnection(String name, String relation, int strength, String direction, String notes) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.5),
      child: ListTile(
        leading: CircleAvatar(child: Text(name[0])),
        title: Text(name),
        subtitle: Text('$relation • Strength: $strength% ${notes.isNotEmpty ? '• $notes' : ''}'),
        trailing: Icon(
          direction == 'bidirectional' ? Icons.sync : Icons.arrow_forward,
          size: 16,
        ),
      ),
    );
  }
}
