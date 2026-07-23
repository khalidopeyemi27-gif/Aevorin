import 'package:flutter_test/flutter_test.dart';
import 'package:aevorin_mobile/core/sync/conflict_classifier.dart';

void main() {
  group('ConflictClassifier', () {
    test('SCENE operations are high-value', () {
      expect(
        ConflictClassifier.classify('SCENE', 'UPDATE', '{"html":"Once upon a time..."}'),
        ConflictClass.highValue,
      );
    });

    test('PROJECT operations are low-value', () {
      expect(
        ConflictClassifier.classify('PROJECT', 'UPDATE', '{"accentColor":"#FF0000"}'),
        ConflictClass.lowValue,
      );
    });

    test('ENTITY UPDATE with title change is high-value', () {
      expect(
        ConflictClassifier.classify('ENTITY', 'UPDATE', '{"title":"New Name"}'),
        ConflictClass.highValue,
      );
    });

    test('ENTITY UPDATE with summary change is high-value', () {
      expect(
        ConflictClassifier.classify('ENTITY', 'UPDATE', '{"summary":"She is brave and wise."}'),
        ConflictClass.highValue,
      );
    });

    test('ENTITY UPDATE with only metadata (non-writing) fields is low-value', () {
      expect(
        ConflictClassifier.classify('ENTITY', 'UPDATE', '{"metadata":{"accentColor":"blue"}}'),
        ConflictClass.lowValue,
      );
    });

    test('RELATIONSHIP with notes change is high-value', () {
      expect(
        ConflictClassifier.classify('RELATIONSHIP', 'UPDATE', '{"notes":"They met in battle"}'),
        ConflictClass.highValue,
      );
    });

    test('ENTITY CREATE is high-value', () {
      expect(
        ConflictClassifier.classify('ENTITY', 'CREATE', '{"title":"New Character"}'),
        ConflictClass.highValue,
      );
    });

    test('ENTITY DELETE is high-value', () {
      expect(
        ConflictClassifier.classify('ENTITY', 'DELETE', '{}'),
        ConflictClass.highValue,
      );
    });
  });

  group('ConflictedDraft', () {
    test('can hold both local and server payloads', () {
      final draft = ConflictedDraft(
        resourceType: 'ENTITY',
        resourceId: 'char_001',
        operationId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        localPayload: '{"title":"Alice"}',
        serverPayload: '{"title":"Alice Liddell"}',
        detectedAt: DateTime.now(),
      );

      expect(draft.localPayload, contains('Alice'));
      expect(draft.serverPayload, contains('Liddell'));
    });

    test('server payload is nullable before fetch', () {
      final draft = ConflictedDraft(
        resourceType: 'SCENE',
        resourceId: 'scene_001',
        operationId: '01ARZ3NDEKTSV4RRFFQ69G5FAZ',
        localPayload: '{"html":"<p>Draft</p>"}',
        detectedAt: DateTime.now(),
      );
      expect(draft.serverPayload, isNull);
    });
  });
}
