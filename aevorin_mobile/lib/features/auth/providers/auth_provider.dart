import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/auth_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final authStateProvider = StreamProvider<AuthState>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  return authRepository.authStateChanges;
});

final currentUserProvider = Provider<User?>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.value?.session?.user;
});

class OfflineModeNotifier extends Notifier<bool> {
  @override
  bool build() => false;

  void enableOfflineMode() {
    state = true;
  }

  void disableOfflineMode() {
    state = false;
  }
}

final isOfflineModeProvider = NotifierProvider<OfflineModeNotifier, bool>(() {
  return OfflineModeNotifier();
});

final authControllerProvider = AsyncNotifierProvider<AuthController, void>(() {
  return AuthController();
});

class AuthController extends AsyncNotifier<void> {
  late final AuthRepository _authRepository;

  @override
  FutureOr<void> build() {
    _authRepository = ref.watch(authRepositoryProvider);
  }

  Future<bool> signIn({required String email, required String password}) async {
    state = const AsyncLoading();
    try {
      await _authRepository.signInWithEmail(email: email, password: password);
      state = const AsyncData(null);
      return true;
    } on AuthException catch (e) {
      state = AsyncError(e.message, StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }

  Future<bool> signUp({required String email, required String password}) async {
    state = const AsyncLoading();
    try {
      await _authRepository.signUpWithEmail(email: email, password: password);
      state = const AsyncData(null);
      return true;
    } on AuthException catch (e) {
      state = AsyncError(e.message, StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }

  Future<void> signOut() async {
    state = const AsyncLoading();
    try {
      await _authRepository.signOut();
      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<bool> resetPassword(String email) async {
    state = const AsyncLoading();
    try {
      await _authRepository.resetPassword(email);
      state = const AsyncData(null);
      return true;
    } on AuthException catch (e) {
      state = AsyncError(e.message, StackTrace.current);
      return false;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}
