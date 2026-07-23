import 'dart:convert';
import 'package:flutter_quill_delta_from_html/flutter_quill_delta_from_html.dart';
import 'package:vsc_quill_delta_to_html/vsc_quill_delta_to_html.dart';
import 'package:flutter_quill/flutter_quill.dart';

class DeltaHtmlConverter {
  static String deltaToHtml(Document document) {
    try {
      final deltaJson = document.toDelta().toJson();
      final converter = QuillDeltaToHtmlConverter(
        List.castFrom(deltaJson), 
        ConverterOptions.forEmail(),
      );
      return converter.convert();
    } catch (e) {
      return '';
    }
  }

  static Document htmlToDelta(String html) {
    if (html.isEmpty) return Document();
    
    // Check if it's ProseMirror JSON instead of HTML
    if (html.trim().startsWith('{') && html.contains('"type"')) {
      // If we receive ProseMirror JSON (fallback for legacy data),
      // we can't easily parse it perfectly to Delta without a full converter.
      // But we can extract text from it.
      final text = _extractPlainTextFromTipTap(html);
      return Document()..insert(0, text);
    }
    
    // Check if it's already a Delta JSON
    if (html.trim().startsWith('[') && html.contains('"insert"')) {
      try {
        final List<dynamic> jsonList = jsonDecode(html);
        return Document.fromJson(jsonList);
      } catch (e) {
        // Fallback
      }
    }

    try {
      final delta = HtmlToDelta().convert(html);
      return Document.fromJson(delta.toJson());
    } catch (e) {
      return Document()..insert(0, html);
    }
  }

  static String _extractPlainTextFromTipTap(String contentStr) {
    if (contentStr.isEmpty) return "";
    try {
      final doc = jsonDecode(contentStr);
      String text = "";
      void traverse(Map<String, dynamic> node) {
        if (node['type'] == 'text') {
          text += (node['text'] ?? '');
        } else if (node['content'] != null) {
          for (final child in node['content']) {
            traverse(child as Map<String, dynamic>);
          }
        }
        if (node['type'] == 'paragraph' || node['type'] == 'heading') {
          text += '\n';
        }
      }
      traverse(doc);
      return text;
    } catch (e) {
      return contentStr;
    }
  }
}
