import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/search_repository.dart';
import '../providers/workspace_provider.dart';

class GlobalSearchScreen extends ConsumerStatefulWidget {
  const GlobalSearchScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<GlobalSearchScreen> createState() => _GlobalSearchScreenState();
}

class _GlobalSearchScreenState extends ConsumerState<GlobalSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<SearchResult> _results = [];
  bool _isSearching = false;
  String _lastQuery = "";

  Future<void> _performSearch(String query) async {
    if (query.isEmpty) {
      setState(() {
        _results = [];
        _lastQuery = "";
      });
      return;
    }

    final project = ref.read(workspaceControllerProvider).project;
    if (project == null) return;

    setState(() {
      _isSearching = true;
      _lastQuery = query;
    });

    try {
      final repo = ref.read(searchRepositoryProvider);
      final results = await repo.search(project.id, query);
      if (mounted) {
        setState(() {
          _results = results;
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSearching = false;
        });
      }
    }
  }

  IconData _getIconForType(String type) {
    switch (type.toUpperCase()) {
      case 'CHAPTER': return Icons.book;
      case 'SCENE': return Icons.movie;
      case 'CHARACTER': return Icons.person;
      case 'ITEM': return Icons.category;
      case 'LOCATION':
      case 'WORLD': return Icons.public;
      case 'FACTION': return Icons.shield;
      default: return Icons.article;
    }
  }

  @override
  Widget build(BuildContext context) {
    final manuscriptResults = _results.where((r) => r.type == 'SCENE').toList();
    final worldbuildingResults = _results.where((r) => r.type != 'SCENE').toList();

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Search manuscript, characters, locations...',
            border: InputBorder.none,
          ),
          onSubmitted: _performSearch,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => _performSearch(_searchController.text),
          ),
        ],
      ),
      body: _isSearching
          ? const Center(child: CircularProgressIndicator())
          : _results.isEmpty && _lastQuery.isNotEmpty
              ? const Center(child: Text('No results found.'))
              : CustomScrollView(
                  slivers: [
                    if (manuscriptResults.isNotEmpty) ...[
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: Text('Manuscript', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                        ),
                      ),
                      SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) => _buildResultItem(manuscriptResults[index]),
                          childCount: manuscriptResults.length,
                        ),
                      ),
                    ],
                    if (worldbuildingResults.isNotEmpty) ...[
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: Text('Worldbuilding', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                        ),
                      ),
                      SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) => _buildResultItem(worldbuildingResults[index]),
                          childCount: worldbuildingResults.length,
                        ),
                      ),
                    ],
                  ],
                ),
    );
  }

  Widget _buildResultItem(SearchResult item) {
    return ListTile(
      leading: Icon(_getIconForType(item.type)),
      title: Text(item.title),
      subtitle: Text(
        item.content.replaceAll(RegExp(r'<[^>]*>|&[^;]+;'), ' '),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Text(
        item.type,
        style: const TextStyle(fontSize: 10, color: Colors.grey),
      ),
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Tapped ${item.title}')),
        );
      },
    );
  }
}
