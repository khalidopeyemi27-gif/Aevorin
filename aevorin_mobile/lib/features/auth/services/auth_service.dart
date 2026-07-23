import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  final SupabaseClient _supabase;
  final FlutterSecureStorage _secureStorage;

  AuthService(this._supabase, this._secureStorage);

  Future<AuthResponse> login(String email, String password) async {
    final response = await _supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );

    final session = response.session;
    if (session != null) {
      // Store the JWT for the Dio ApiClient to use
      await _secureStorage.write(key: 'jwt_token', value: session.accessToken);
    }
    return response;
  }

  Future<AuthResponse> signUp(String email, String password) async {
    final response = await _supabase.auth.signUp(
      email: email,
      password: password,
    );
    
    // Note: If email confirmation is enabled, session might be null here
    final session = response.session;
    if (session != null) {
      await _secureStorage.write(key: 'jwt_token', value: session.accessToken);
    }
    return response;
  }

  Future<void> logout() async {
    await _supabase.auth.signOut();
    await _secureStorage.delete(key: 'jwt_token');
  }

  Future<bool> isAuthenticated() async {
    final token = await _secureStorage.read(key: 'jwt_token');
    // Also verify Supabase has an active session
    final session = _supabase.auth.currentSession;
    return token != null && session != null;
  }
}
