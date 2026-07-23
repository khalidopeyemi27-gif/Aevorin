import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../workspace/providers/workspace_provider.dart';
import '../repositories/graph_repository.dart';
import 'entity_detail_screen.dart';

// --- Graph Data Models ---

class GraphNode {
  final String id;
  final String type;
  final String label;
  final int importance;
  Offset position;

  GraphNode({
    required this.id,
    required this.type,
    required this.label,
    required this.importance,
    this.position = Offset.zero,
  });
}

class GraphEdge {
  final String from;
  final String to;
  final String relationship;

  GraphEdge({
    required this.from,
    required this.to,
    required this.relationship,
  });
}

enum LayoutType { radial, tree, hierarchy }

// --- Layout Engine ---

class GraphLayoutEngine {
  static void applyLayout(List<GraphNode> nodes, List<GraphEdge> edges, Size size, LayoutType type) {
    if (nodes.isEmpty) return;

    // A real layout engine would handle this more robustly
    switch (type) {
      case LayoutType.radial:
        _applyRadialLayout(nodes, size);
        break;
      case LayoutType.tree:
        _applyTreeLayout(nodes, edges, size);
        break;
      case LayoutType.hierarchy:
        _applyHierarchyLayout(nodes, edges, size);
        break;
    }
  }

  static void _applyRadialLayout(List<GraphNode> nodes, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    nodes.first.position = center;

    final others = nodes.skip(1).toList();
    if (others.isEmpty) return;

    final radius = 200.0;
    final angleStep = (2 * 3.14159) / others.length;

    for (int i = 0; i < others.length; i++) {
      final angle = i * angleStep;
      others[i].position = Offset(
        center.dx + radius * math.cos(angle),
        center.dy + radius * math.sin(angle),
      );
    }
  }

  static void _applyTreeLayout(List<GraphNode> nodes, List<GraphEdge> edges, Size size) {
    // Basic stub for Tree layout.
    // In V1.1.5, we just spread them horizontally for now.
    for (int i = 0; i < nodes.length; i++) {
      nodes[i].position = Offset(100.0 + (i * 150.0), size.height / 2);
    }
  }

  static void _applyHierarchyLayout(List<GraphNode> nodes, List<GraphEdge> edges, Size size) {
    // Basic stub for Hierarchy layout.
    for (int i = 0; i < nodes.length; i++) {
      nodes[i].position = Offset(size.width / 2, 100.0 + (i * 150.0));
    }
  }
}

// --- Screen ---

class StoryGraphScreen extends ConsumerStatefulWidget {
  const StoryGraphScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<StoryGraphScreen> createState() => _StoryGraphScreenState();
}

class _StoryGraphScreenState extends ConsumerState<StoryGraphScreen> {
  bool _isLoading = true;
  List<GraphNode> _nodes = [];
  List<GraphEdge> _edges = [];
  
  String? _selectedNodeId;
  LayoutType _currentLayout = LayoutType.radial;
  
  final TransformationController _transformController = TransformationController();

  @override
  void initState() {
    super.initState();
    _loadGraphData();
  }
  
  @override
  void dispose() {
    _transformController.dispose();
    super.dispose();
  }

  Future<void> _loadGraphData() async {
    final projectId = ref.read(workspaceControllerProvider).project?.id;
    if (projectId == null) return;

    try {
      final repo = ref.read(graphRepositoryProvider);
      final data = await repo.fetchGraphData(projectId);
      
      final rawNodes = data['nodes'] as List? ?? [];
      final rawEdges = data['edges'] as List? ?? [];

      _nodes = rawNodes.map((n) => GraphNode(
        id: n['id'].toString(),
        type: n['entity_type'] ?? 'unknown',
        label: n['name'] ?? 'Untitled',
        importance: n['importance'] ?? 50,
      )).toList();

      _edges = rawEdges.map((e) => GraphEdge(
        from: e['source_id'].toString(),
        to: e['target_id'].toString(),
        relationship: e['edge_type'] ?? 'related_to',
      )).toList();

      if (_nodes.isNotEmpty) {
        _nodes.sort((a, b) => b.importance.compareTo(a.importance));
      }

    } catch (e) {
      print('Graph Error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _handleTap(Offset localPosition) {
    GraphNode? tappedNode;
    
    // Find tapped node (simple hit test, radius 24)
    for (final node in _nodes) {
      final radius = node.importance > 70 ? 24.0 : 16.0;
      final distance = (node.position - localPosition).distance;
      if (distance <= radius) {
        tappedNode = node;
        break;
      }
    }
    
    setState(() {
      _selectedNodeId = tappedNode?.id;
    });
  }
  
  void _centerOnNode(GraphNode node, Size viewportSize) {
    // Calculate translation to bring node to center
    final dx = (viewportSize.width / 2) - node.position.dx;
    final dy = (viewportSize.height / 2) - node.position.dy;
    
    _transformController.value = Matrix4.identity()..translate(dx, dy);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Knowledge Graph'),
        actions: [
          PopupMenuButton<LayoutType>(
            icon: const Icon(Icons.layers),
            onSelected: (type) => setState(() => _currentLayout = type),
            itemBuilder: (context) => [
              const PopupMenuItem(value: LayoutType.radial, child: Text('Radial Layout')),
              const PopupMenuItem(value: LayoutType.hierarchy, child: Text('Hierarchy Layout')),
              const PopupMenuItem(value: LayoutType.tree, child: Text('Tree Layout')),
            ],
          )
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final size = Size(constraints.maxWidth, constraints.maxHeight);
          
          if (_nodes.isNotEmpty) {
            GraphLayoutEngine.applyLayout(_nodes, _edges, size, _currentLayout);
          }

          final selectedNode = _nodes.cast<GraphNode?>().firstWhere(
            (n) => n?.id == _selectedNodeId, orElse: () => null
          );

          return Stack(
            children: [
              InteractiveViewer(
                transformationController: _transformController,
                constrained: false,
                boundaryMargin: const EdgeInsets.all(1000),
                minScale: 0.1,
                maxScale: 2.0,
                child: GestureDetector(
                  onTapUp: (details) => _handleTap(details.localPosition),
                  child: SizedBox(
                    width: size.width,
                    height: size.height,
                    child: CustomPaint(
                      painter: GraphRenderer(
                        nodes: _nodes, 
                        edges: _edges,
                        selectedNodeId: _selectedNodeId,
                      ),
                      size: size,
                    ),
                  ),
                ),
              ),
              
              // Preview Card Overlays
              if (selectedNode != null)
                Positioned(
                  top: 24,
                  right: 24,
                  child: _buildPreviewCard(selectedNode, size),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildPreviewCard(GraphNode node, Size viewportSize) {
    final neighborCount = _edges.where((e) => e.from == node.id || e.to == node.id).length;
    
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: 300,
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                  radius: 24,
                  child: Text(node.label[0], style: const TextStyle(fontSize: 20)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(node.label, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Text(node.type, style: TextStyle(color: Theme.of(context).colorScheme.primary, fontSize: 12)),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => setState(() => _selectedNodeId = null),
                )
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildStatColumn('Connections', neighborCount.toString()),
                _buildStatColumn('Importance', '${node.importance}'),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                OutlinedButton(
                  onPressed: () {
                    Navigator.of(context).push(MaterialPageRoute(
                      builder: (context) => EntityDetailScreen(entityId: node.id, defaultType: node.type),
                    ));
                  },
                  child: const Text('Edit'),
                ),
                OutlinedButton(
                  onPressed: () => _centerOnNode(node, viewportSize),
                  child: const Text('Center'),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
  
  Widget _buildStatColumn(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }
}

// --- Renderer ---

class GraphRenderer extends CustomPainter {
  final List<GraphNode> nodes;
  final List<GraphEdge> edges;
  final String? selectedNodeId;

  GraphRenderer({required this.nodes, required this.edges, this.selectedNodeId});

  @override
  void paint(Canvas canvas, Size size) {
    final textPainter = TextPainter(textDirection: TextDirection.ltr);
    
    // Find neighbors of selected node
    final Set<String> activeNodes = {};
    if (selectedNodeId != null) {
      activeNodes.add(selectedNodeId!);
      for (final edge in edges) {
        if (edge.from == selectedNodeId) activeNodes.add(edge.to);
        if (edge.to == selectedNodeId) activeNodes.add(edge.from);
      }
    }

    // Draw edges
    for (final edge in edges) {
      final fromNode = nodes.cast<GraphNode?>().firstWhere((n) => n?.id == edge.from, orElse: () => null);
      final toNode = nodes.cast<GraphNode?>().firstWhere((n) => n?.id == edge.to, orElse: () => null);

      if (fromNode != null && toNode != null) {
        bool isActiveEdge = selectedNodeId == null || (activeNodes.contains(fromNode.id) && activeNodes.contains(toNode.id));
        
        final edgePaint = Paint()
          ..color = Colors.grey.withOpacity(isActiveEdge ? 0.6 : 0.1)
          ..strokeWidth = isActiveEdge ? 2.0 : 1.0;
          
        canvas.drawLine(fromNode.position, toNode.position, edgePaint);
      }
    }

    // Draw nodes
    for (final node in nodes) {
      final radius = node.importance > 70 ? 24.0 : 16.0;
      bool isActive = selectedNodeId == null || activeNodes.contains(node.id);
      
      final nodePaint = Paint()
        ..color = _getColorForType(node.type).withOpacity(isActive ? 1.0 : 0.2);
      
      canvas.drawCircle(node.position, radius, nodePaint);
      
      // Draw Stroke for selected node
      if (node.id == selectedNodeId) {
        final strokePaint = Paint()
          ..color = Colors.white
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3;
        canvas.drawCircle(node.position, radius + 4, strokePaint);
      }

      if (isActive) {
        textPainter.text = TextSpan(
          text: node.label,
          style: const TextStyle(color: Colors.white, fontSize: 12, backgroundColor: Colors.black54),
        );
        textPainter.layout();
        textPainter.paint(
          canvas, 
          Offset(node.position.dx - textPainter.width / 2, node.position.dy + radius + 4)
        );
      }
    }
  }

  Color _getColorForType(String type) {
    switch (type.toLowerCase()) {
      case 'character': return Colors.amber;
      case 'chapter': return Colors.blue;
      case 'world': return Colors.green;
      case 'item': return Colors.orange;
      case 'faction': return Colors.purple;
      case 'event': return Colors.red;
      default: return Colors.grey;
    }
  }

  @override
  bool shouldRepaint(covariant GraphRenderer oldDelegate) {
    return oldDelegate.selectedNodeId != selectedNodeId;
  }
}
