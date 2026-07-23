import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../services/export_service.dart';
import '../providers/workspace_provider.dart';
import '../../../core/constants/api_constants.dart';

final exportServiceProvider = Provider((ref) => ExportService(Dio(BaseOptions(baseUrl: ApiConstants.baseUrl))));

class ExportScreen extends ConsumerStatefulWidget {
  const ExportScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ExportScreen> createState() => _ExportScreenState();
}

class _ExportScreenState extends ConsumerState<ExportScreen> {
  bool _isExporting = false;
  String _selectedFormat = 'pdf';
  
  bool _includeCharacters = false;
  bool _includeLocations = false;
  bool _includeRelationships = false;

  Future<void> _handleExport() async {
    final project = ref.read(workspaceControllerProvider).project;
    if (project == null) return;

    setState(() {
      _isExporting = true;
    });

    try {
      final exportService = ref.read(exportServiceProvider);
      await exportService.exportAndShare(
        project.id, 
        _selectedFormat, 
        project.name,
        options: {
          'includeCharacterGlossary': _includeCharacters,
          'includeLocationGazetteer': _includeLocations,
          'includeRelationshipMap': _includeRelationships,
        }
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Export shared successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to export: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isExporting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        child: Card(
          margin: const EdgeInsets.all(32),
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.import_contacts, size: 64, color: Colors.blue),
                const SizedBox(height: 24),
                const Text(
                  'Export Manuscript',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Generate a print-ready document and share it.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'pdf', label: Text('PDF')),
                    ButtonSegment(value: 'docx', label: Text('DOCX')),
                    ButtonSegment(value: 'epub', label: Text('EPUB')),
                  ],
                  selected: {_selectedFormat},
                  onSelectionChanged: (Set<String> newSelection) {
                    setState(() {
                      _selectedFormat = newSelection.first;
                    });
                  },
                ),
                const SizedBox(height: 32),
                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Appendices', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 8),
                CheckboxListTile(
                  title: const Text('Character Glossary'),
                  value: _includeCharacters,
                  onChanged: (val) => setState(() => _includeCharacters = val ?? false),
                  controlAffinity: ListTileControlAffinity.leading,
                ),
                CheckboxListTile(
                  title: const Text('Location Gazetteer'),
                  value: _includeLocations,
                  onChanged: (val) => setState(() => _includeLocations = val ?? false),
                  controlAffinity: ListTileControlAffinity.leading,
                ),
                CheckboxListTile(
                  title: const Text('Relationship Map'),
                  value: _includeRelationships,
                  onChanged: (val) => setState(() => _includeRelationships = val ?? false),
                  controlAffinity: ListTileControlAffinity.leading,
                ),
                const SizedBox(height: 32),
                ElevatedButton.icon(
                  onPressed: _isExporting ? null : _handleExport,
                  icon: _isExporting 
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.share),
                  label: Text(_isExporting ? 'Generating...' : 'Compile & Share'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
