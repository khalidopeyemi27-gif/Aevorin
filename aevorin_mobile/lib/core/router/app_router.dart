import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/projects/screens/dashboard_screen.dart';
import '../../features/workspace/screens/workspace_shell_screen.dart';
import '../../features/editor/screens/scene_editor_screen.dart';
import '../../features/projects/models/scene.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  final isOfflineMode = ref.watch(isOfflineModeProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoading = authState.isLoading;
      final session = authState.value?.session;
      final isAuthenticated = session != null || isOfflineMode;

      if (isLoading) return null;

      final isGoingToLogin = state.matchedLocation == '/login';
      final isGoingToSplash = state.matchedLocation == '/';

      if (!isAuthenticated) {
        if (!isGoingToLogin) return '/login';
      } else {
        if (isGoingToLogin || isGoingToSplash) return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/project/:name',
        builder: (context, state) {
          return const WorkspaceShellScreen();
        },
      ),
      GoRoute(
        path: '/project/:projectId/scene/:sceneId',
        builder: (context, state) {
          final projectId = state.pathParameters['projectId']!;
          final sceneId = state.pathParameters['sceneId']!;
          final scene = state.extra as Scene;
          return SceneEditorScreen(
            projectId: projectId,
            sceneId: sceneId,
            scene: scene,
          );
        },
      ),
    ],
  );
});
