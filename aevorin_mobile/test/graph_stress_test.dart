import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:aevorin_mobile/features/worldbuilding/screens/story_graph_screen.dart';

void main() {
  group('Graph Stress Tests (Layout Engine)', () {
    
    List<GraphNode> _generateNodes(int count) {
      return List.generate(count, (i) => GraphNode(
        id: 'node_$i',
        type: 'CHARACTER',
        label: 'Node $i',
        importance: 50,
      ));
    }

    test('Sparse Graph Layout (100 nodes, 0 edges)', () {
      final nodes = _generateNodes(100);
      final edges = <GraphEdge>[];
      
      final stopwatch = Stopwatch()..start();
      GraphLayoutEngine.applyLayout(nodes, edges, const Size(1000, 1000), LayoutType.radial);
      stopwatch.stop();
      
      // Basic layout shouldn't take long for 100 nodes
      expect(stopwatch.elapsedMilliseconds, lessThan(50));
      expect(nodes.first.position, isNot(Offset.zero));
    });

    test('Dense Graph Layout (100 nodes, 4950 edges)', () {
      final nodes = _generateNodes(100);
      final edges = <GraphEdge>[];
      
      // Fully connected graph n*(n-1)/2 edges
      for (int i = 0; i < nodes.length; i++) {
        for (int j = i + 1; j < nodes.length; j++) {
          edges.add(GraphEdge(from: nodes[i].id, to: nodes[j].id, relationship: 'related'));
        }
      }
      
      final stopwatch = Stopwatch()..start();
      GraphLayoutEngine.applyLayout(nodes, edges, const Size(1000, 1000), LayoutType.radial);
      stopwatch.stop();
      
      expect(stopwatch.elapsedMilliseconds, lessThan(100));
    });

    test('Hub-and-spoke Graph Layout (100 nodes, 99 edges to 1 hub)', () {
      final nodes = _generateNodes(100);
      final edges = <GraphEdge>[];
      
      for (int i = 1; i < nodes.length; i++) {
        edges.add(GraphEdge(from: nodes[0].id, to: nodes[i].id, relationship: 'follower'));
      }
      
      final stopwatch = Stopwatch()..start();
      GraphLayoutEngine.applyLayout(nodes, edges, const Size(1000, 1000), LayoutType.radial);
      stopwatch.stop();
      
      expect(stopwatch.elapsedMilliseconds, lessThan(50));
    });

    test('Long Chain Graph Layout (100 nodes, 99 sequential edges)', () {
      final nodes = _generateNodes(100);
      final edges = <GraphEdge>[];
      
      for (int i = 0; i < nodes.length - 1; i++) {
        edges.add(GraphEdge(from: nodes[i].id, to: nodes[i+1].id, relationship: 'next'));
      }
      
      final stopwatch = Stopwatch()..start();
      GraphLayoutEngine.applyLayout(nodes, edges, const Size(1000, 1000), LayoutType.tree);
      stopwatch.stop();
      
      expect(stopwatch.elapsedMilliseconds, lessThan(50));
      
      // Ensure tree layout applied horizontally
      expect(nodes[0].position.dx, 100.0);
      expect(nodes[1].position.dx, 250.0);
    });
  });
}
