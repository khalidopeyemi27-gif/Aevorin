import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_exception.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  ApiClient._internal() {
    final baseUrl = dotenv.env['API_BASE_URL'] ?? 'https://aevorin.onrender.com';
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    ));
    _setupInterceptors();
  }

  void _setupInterceptors() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Retrieve JWT from secure storage
          final token = await _secureStorage.read(key: 'jwt_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          String message = 'An unexpected error occurred.';
          
          if (e.type == DioExceptionType.connectionTimeout || 
              e.type == DioExceptionType.receiveTimeout || 
              e.type == DioExceptionType.sendTimeout) {
            message = 'Connection timeout. Check your internet connection.';
          } else if (e.type == DioExceptionType.connectionError) {
            message = 'Unable to connect to the server.';
          } else if (e.response != null) {
            // Backend returned a specific error
            final data = e.response?.data;
            if (data is Map<String, dynamic> && data['error'] != null) {
              message = data['error'];
            } else {
              message = 'Server error: ${e.response?.statusCode}';
            }
          }

          final customException = ApiException(message, statusCode: e.response?.statusCode);
          return handler.reject(
            DioException(
              requestOptions: e.requestOptions,
              error: customException,
              type: e.type,
              response: e.response,
            )
          );
        },
      ),
    );
  }
}
