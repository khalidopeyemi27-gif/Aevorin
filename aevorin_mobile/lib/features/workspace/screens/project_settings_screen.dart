import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/workspace_provider.dart';
import '../../auth/providers/auth_provider.dart';

class ProjectSettingsScreen extends ConsumerStatefulWidget {
  const ProjectSettingsScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ProjectSettingsScreen> createState() => _ProjectSettingsScreenState();
}

class _ProjectSettingsScreenState extends ConsumerState<ProjectSettingsScreen> {
  // General
  late TextEditingController _titleController;
  late TextEditingController _authorController;
  late TextEditingController _seriesController;
  late TextEditingController _volumeController;

  // Cover
  late TextEditingController _coverImageController;
  late TextEditingController _accentColorController;

  // Publishing
  late TextEditingController _publisherController;
  late TextEditingController _copyrightController;
  late TextEditingController _languageController;

  // Writing
  late TextEditingController _genreController;
  late TextEditingController _wordCountController;
  
  bool _exportPdf = true;
  bool _exportEpub = true;
  bool _exportDocx = false;

  @override
  void initState() {
    super.initState();
    final project = ref.read(workspaceControllerProvider).project!;
    
    _titleController = TextEditingController(text: project.name);
    _authorController = TextEditingController(text: project.authorName ?? '');
    _seriesController = TextEditingController(text: project.bookSeries ?? '');
    _volumeController = TextEditingController(text: project.volume?.toString() ?? '');
    
    _coverImageController = TextEditingController(text: project.coverImage ?? '');
    _accentColorController = TextEditingController(text: project.accentColor ?? '');
    
    _publisherController = TextEditingController(text: project.publisher ?? '');
    _copyrightController = TextEditingController(text: project.copyright ?? '');
    _languageController = TextEditingController(text: project.language ?? '');
    
    _genreController = TextEditingController(text: project.genre ?? '');
    _wordCountController = TextEditingController(text: project.targetWordCount?.toString() ?? '');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _authorController.dispose();
    _seriesController.dispose();
    _volumeController.dispose();
    
    _coverImageController.dispose();
    _accentColorController.dispose();
    
    _publisherController.dispose();
    _copyrightController.dispose();
    _languageController.dispose();
    
    _genreController.dispose();
    _wordCountController.dispose();
    super.dispose();
  }

  void _saveSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Book Identity saved!')),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(top: 32, bottom: 16),
      child: Row(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 800),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Book Identity',
                          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Configure the global metadata for your book.',
                          style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                    FilledButton.icon(
                      onPressed: _saveSettings,
                      icon: const Icon(Icons.save),
                      label: const Text('Save'),
                    ),
                  ],
                ),
                
                _buildSectionHeader('General', Icons.info_outline),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _titleController,
                        decoration: const InputDecoration(labelText: 'Book Title', border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        controller: _authorController,
                        decoration: const InputDecoration(labelText: 'Author Name', border: OutlineInputBorder()),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _seriesController,
                        decoration: const InputDecoration(labelText: 'Series Name', border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        controller: _volumeController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Volume Number', border: OutlineInputBorder()),
                      ),
                    ),
                  ],
                ),

                _buildSectionHeader('Cover & Theme', Icons.palette_outlined),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 140,
                      height: 210,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Theme.of(context).dividerColor),
                        image: _coverImageController.text.isNotEmpty
                            ? DecorationImage(
                                image: NetworkImage(_coverImageController.text),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: _coverImageController.text.isEmpty
                          ? const Center(child: Icon(Icons.book, size: 48, color: Colors.grey))
                          : null,
                    ),
                    const SizedBox(width: 24),
                    Expanded(
                      child: Column(
                        children: [
                          TextField(
                            controller: _coverImageController,
                            decoration: const InputDecoration(labelText: 'Cover Image URL', border: OutlineInputBorder()),
                            onChanged: (_) => setState(() {}),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: _accentColorController,
                            decoration: const InputDecoration(labelText: 'Accent Color (Hex)', border: OutlineInputBorder(), hintText: '#FF5500'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                _buildSectionHeader('Publishing', Icons.public),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _publisherController,
                        decoration: const InputDecoration(labelText: 'Publisher', border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        controller: _copyrightController,
                        decoration: const InputDecoration(labelText: 'Copyright', border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        controller: _languageController,
                        decoration: const InputDecoration(labelText: 'Language (e.g. en-US)', border: OutlineInputBorder()),
                      ),
                    ),
                  ],
                ),

                _buildSectionHeader('Writing', Icons.edit_note),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _genreController,
                        decoration: const InputDecoration(labelText: 'Genre', border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        controller: _wordCountController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Target Word Count', border: OutlineInputBorder()),
                      ),
                    ),
                  ],
                ),

                _buildSectionHeader('Export Preferences', Icons.file_download_outlined),
                Card(
                  elevation: 0,
                  color: Theme.of(context).colorScheme.surfaceContainerLow,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        CheckboxListTile(
                          title: const Text('PDF Generation'),
                          subtitle: const Text('Include this format when exporting the manuscript.'),
                          value: _exportPdf,
                          onChanged: (v) => setState(() => _exportPdf = v ?? false),
                        ),
                        CheckboxListTile(
                          title: const Text('EPUB Generation'),
                          subtitle: const Text('Include this format when exporting the manuscript.'),
                          value: _exportEpub,
                          onChanged: (v) => setState(() => _exportEpub = v ?? false),
                        ),
                        CheckboxListTile(
                          title: const Text('DOCX Generation'),
                          subtitle: const Text('Include this format when exporting the manuscript.'),
                          value: _exportDocx,
                          onChanged: (v) => setState(() => _exportDocx = v ?? false),
                        ),
                      ],
                    ),
                  ),
                ),
                
                _buildSectionHeader('Account & Session', Icons.account_circle_outlined),
                Card(
                  elevation: 0,
                  color: Theme.of(context).colorScheme.surfaceContainerLow,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: ListTile(
                      leading: const Icon(Icons.logout, color: Colors.redAccent),
                      title: const Text('Sign Out / Exit Sanctuary'),
                      subtitle: const Text('Return to the main login sanctuary or exit offline mode.'),
                      trailing: OutlinedButton(
                        onPressed: () {
                          ref.read(isOfflineModeProvider.notifier).disableOfflineMode();
                          ref.read(authControllerProvider.notifier).signOut();
                        },
                        style: OutlinedButton.styleFrom(foregroundColor: Colors.redAccent),
                        child: const Text('Sign Out'),
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 48),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
