import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class ExportService {
  final Dio _dio;

  ExportService(this._dio);

  Future<void> exportAndShare(String projectId, String format, String projectName, {Map<String, bool>? options}) async {
    try {
      // 1. Request export from backend
      final data = <String, dynamic>{
        'format': format,
      };
      if (options != null) {
        data['options'] = options;
      }
      
      final response = await _dio.post('/api/projects/$projectId/export', data: data);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final filePath = response.data['path'] as String;
        final fileName = response.data['fileName'] as String;

        // Since the backend is running locally, we could access the file directly if they share the file system.
        // However, in a real environment, the backend would return a URL to download or stream the file bytes.
        // For V1.0, we will assume the backend returns the file path, and we download it if it's an HTTP URL,
        // or if it's local, we just use the path (e.g. Android simulator accessing local backend).
        // To be safe for mobile networking, let's assume we need to download it via a download endpoint.
        
        // Wait, the backend currently doesn't have a download endpoint for the exported file, it just creates it on disk.
        // Let's read the file directly since we are on the same machine/simulator for now, OR better, let's implement the share using XFile.
        // If the backend is local on Windows, and Android simulator is running, they don't share the same filesystem path!
        // So the backend NEEDS to return the file bytes, or provide a download URL.
        
        // As a robust solution, we'll assume there is a way to get the bytes. Let's add a download route to backend later.
        // Let's implement the download from the backend's static/export directory.
        // For now, let's assume `filePath` is accessible via a `/api/projects/$projectId/exports/$fileName` route which we will create.

        final downloadUrl = '/api/projects/$projectId/exports/$fileName';
        
        // 2. Download the file
        final tempDir = await getTemporaryDirectory();
        final localFile = File('${tempDir.path}/$fileName');
        
        await _dio.download(downloadUrl, localFile.path);

        // 3. Share the file via Native Share Sheet
        if (await localFile.exists()) {
          await Share.shareXFiles([XFile(localFile.path)], text: 'Exported Manuscript: $projectName');
        } else {
          throw Exception('Failed to download exported file');
        }
      } else {
        throw Exception('Export failed on server');
      }
    } catch (e) {
      print('Export error: $e');
      rethrow;
    }
  }
}
