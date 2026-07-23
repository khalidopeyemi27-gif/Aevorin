import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:aevorin_mobile/features/auth/screens/login_screen.dart';
import 'package:aevorin_mobile/features/auth/providers/auth_provider.dart';
import 'package:aevorin_mobile/features/auth/repositories/auth_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository mockAuthRepository;

  setUp(() {
    mockAuthRepository = MockAuthRepository();
  });

  Widget createWidgetUnderTest() {
    return ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(mockAuthRepository),
      ],
      child: const MaterialApp(
        home: LoginScreen(),
      ),
    );
  }

  testWidgets('LoginScreen shows validation errors on empty submission', (WidgetTester tester) async {
    await tester.pumpWidget(createWidgetUnderTest());

    // Verify Initial State
    expect(find.text('Sign In'), findsOneWidget);
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);

    // Tap the sign in button without entering data
    await tester.tap(find.widgetWithText(ElevatedButton, 'Sign In'));
    await tester.pump();

    // Verify Validation Errors
    expect(find.text('Please enter an email'), findsOneWidget);
    expect(find.text('Please enter a password'), findsOneWidget);
  });

  testWidgets('LoginScreen calls signIn and shows loading state', (WidgetTester tester) async {
    when(() => mockAuthRepository.signInWithEmail(email: 'test@example.com', password: 'password123'))
        .thenAnswer((_) async => Future.delayed(const Duration(seconds: 1)));

    await tester.pumpWidget(createWidgetUnderTest());

    // Enter text
    await tester.enterText(find.widgetWithText(TextFormField, 'Email'), 'test@example.com');
    await tester.enterText(find.widgetWithText(TextFormField, 'Password'), 'password123');

    // Tap submit
    await tester.tap(find.widgetWithText(ElevatedButton, 'Sign In'));
    await tester.pump();

    // Verify Loading State
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    // Let the Future resolve
    await tester.pumpAndSettle();
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });
}
