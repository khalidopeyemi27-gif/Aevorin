import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Securely stores the Supabase session tokens (Access + Refresh)
/// using the native Keystore (Android) and Keychain (iOS).
class SecureLocalStorage extends LocalStorage {
  final FlutterSecureStorage _storage;
  static const String _sessionKey = 'supabase_session';

  SecureLocalStorage() : _storage = const FlutterSecureStorage();

  @override
  Future<void> initialize() async {}

  @override
  Future<bool> hasAccessToken() async {
    return await _storage.containsKey(key: _sessionKey);
  }

  @override
  Future<String?> accessToken() async {
    return await _storage.read(key: _sessionKey);
  }

  @override
  Future<void> persistSession(String persistSessionString) async {
    await _storage.write(key: _sessionKey, value: persistSessionString);
  }

  @override
  Future<void> removePersistedSession() async {
    await _storage.delete(key: _sessionKey);
  }
}
