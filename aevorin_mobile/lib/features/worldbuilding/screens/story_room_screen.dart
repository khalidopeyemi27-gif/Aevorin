import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/database/database.dart';
import '../providers/entity_provider.dart';
import 'entity_detail_screen.dart';

class StoryRoomScreen extends ConsumerStatefulWidget {
  const StoryRoomScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<StoryRoomScreen> createState() => _StoryRoomScreenState();
}

class _StoryRoomScreenState extends ConsumerState<StoryRoomScreen> {
  String _activeFilter = 'OVERVIEW';

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(entityActionsProvider).fetchAndCache();
    });
  }

  void _openEntityDetail(String? entityId, String defaultType) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (context) => EntityDetailScreen(entityId: entityId, defaultType: defaultType),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final entitiesAsync = ref.watch(entitiesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Story Room'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: ['OVERVIEW', 'CHARACTER', 'WORLD', 'ITEM', 'FACTION', 'EVENT'].map((filter) {
                final isSelected = _activeFilter == filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: Text(filter == 'OVERVIEW' ? 'Dashboard' : filter),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) setState(() => _activeFilter = filter);
                    },
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ),
      body: entitiesAsync.when(
        data: (entities) {
          if (_activeFilter == 'OVERVIEW') {
            return _buildDashboard(entities);
          }

          final filtered = entities.where((e) => e.type == _activeFilter).toList();

          if (filtered.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.auto_awesome, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('No entities found', style: TextStyle(fontSize: 18, color: Colors.grey)),
                  const SizedBox(height: 24),
                  FilledButton.icon(
                    onPressed: () => _openEntityDetail(null, _activeFilter),
                    icon: const Icon(Icons.add),
                    label: const Text('Create New'),
                  )
                ],
              ),
            );
          }

          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 200,
              childAspectRatio: 0.8,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: filtered.length,
            itemBuilder: (context, index) {
              final entity = filtered[index];
              return _EntityCard(
                entity: entity,
                onTap: () => _openEntityDetail(entity.id, entity.type),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
      floatingActionButton: _activeFilter != 'OVERVIEW'
          ? FloatingActionButton(
              onPressed: () => _openEntityDetail(null, _activeFilter),
              tooltip: 'Add Entity',
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Widget _buildDashboard(List<StoryEntity> entities) {
    int charCount = entities.where((e) => e.type == 'CHARACTER').length;
    int worldCount = entities.where((e) => e.type == 'WORLD').length;
    int itemCount = entities.where((e) => e.type == 'ITEM').length;
    int factionCount = entities.where((e) => e.type == 'FACTION').length;
    int eventCount = entities.where((e) => e.type == 'EVENT').length;

    // Sort by updatedAt descending
    final recentEntities = List<StoryEntity>.from(entities)
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    final recent = recentEntities.take(5).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 800),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Universe Overview', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(child: _buildStatCard('Characters', charCount, Icons.person, Colors.blue)),
                  const SizedBox(width: 16),
                  Expanded(child: _buildStatCard('Locations', worldCount, Icons.public, Colors.green)),
                  const SizedBox(width: 16),
                  Expanded(child: _buildStatCard('Items', itemCount, Icons.category, Colors.orange)),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _buildStatCard('Factions', factionCount, Icons.group, Colors.purple)),
                  const SizedBox(width: 16),
                  Expanded(child: _buildStatCard('Events', eventCount, Icons.event, Colors.red)),
                  const SizedBox(width: 16),
                  const Expanded(child: SizedBox()), // empty slot to align
                ],
              ),
              const SizedBox(height: 48),
              
              Text('Recent Activity', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              if (recent.isEmpty)
                const Text('No recent activity.', style: TextStyle(color: Colors.grey))
              else
                ...recent.map((e) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  elevation: 0,
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.5),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                      child: Icon(_getIconForType(e.type), size: 20, color: Theme.of(context).colorScheme.primary),
                    ),
                    title: Text('Updated ${e.title}'),
                    subtitle: Text(e.type),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _openEntityDetail(e.id, e.type),
                  ),
                )),
                
              const SizedBox(height: 48),
              Text('Relationship Density', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              LinearProgressIndicator(
                value: entities.isEmpty ? 0.0 : (entities.length / 50.0).clamp(0.0, 1.0),
                minHeight: 12,
                borderRadius: BorderRadius.circular(6),
              ),
              const SizedBox(height: 8),
              Text(
                entities.isEmpty
                    ? '0 entities • Start by adding characters or locations to build your story network'
                    : '${entities.length} total worldbuilding entities in Local Canon',
                style: const TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, int count, IconData icon, Color color) {
    return Card(
      elevation: 0,
      color: Theme.of(context).colorScheme.surfaceContainerLow,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: color),
                Text(count.toString(), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'CHARACTER': return Icons.person;
      case 'WORLD': return Icons.public;
      case 'ITEM': return Icons.category;
      case 'FACTION': return Icons.group;
      case 'EVENT': return Icons.event;
      default: return Icons.auto_awesome;
    }
  }
}

class _EntityCard extends StatelessWidget {
  final StoryEntity entity;
  final VoidCallback onTap;

  const _EntityCard({Key? key, required this.entity, required this.onTap}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              flex: 3,
              child: Container(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                child: (entity.imagePath != null && entity.imagePath!.isNotEmpty)
                    ? Image.network(entity.imagePath!, fit: BoxFit.cover, errorBuilder: (_,__,___) => _fallbackIcon())
                    : _fallbackIcon(),
              ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      entity.title,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      entity.type,
                      style: TextStyle(fontSize: 10, color: Theme.of(context).colorScheme.primary),
                    ),
                    const SizedBox(height: 4),
                    Expanded(
                      child: Text(
                        entity.description ?? '',
                        style: const TextStyle(fontSize: 11, color: Colors.grey),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _fallbackIcon() {
    IconData icon;
    switch (entity.type) {
      case 'CHARACTER': icon = Icons.person; break;
      case 'WORLD': icon = Icons.public; break;
      case 'ITEM': icon = Icons.category; break;
      case 'FACTION': icon = Icons.group; break;
      case 'EVENT': icon = Icons.event; break;
      default: icon = Icons.auto_awesome;
    }
    return Center(child: Icon(icon, size: 48, color: Colors.grey));
  }
}
