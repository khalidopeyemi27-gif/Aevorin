import 'package:flutter/material.dart';

class AevorinTheme {
  // Main Colors
  static const Color mainBackground = Color(0xFF0F172A);
  static const Color sidebar = Color(0xFF111827);
  static const Color cards = Color(0xFF1E293B);
  static const Color borders = Color(0xFF334155);

  // Text
  static const Color primaryText = Color(0xFFF8FAFC);
  static const Color secondaryText = Color(0xFFCBD5E1);

  // Accents & States
  static const Color primaryAccent = Color(0xFF3B82F6);
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: mainBackground,
      primaryColor: primaryAccent,
      colorScheme: const ColorScheme.dark(
        primary: primaryAccent,
        secondary: primaryAccent,
        surface: cards,
        error: error,
        onPrimary: primaryText,
        onSecondary: primaryText,
        onSurface: primaryText,
        onError: primaryText,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: sidebar,
        elevation: 0,
        iconTheme: IconThemeData(color: primaryText),
        titleTextStyle: TextStyle(
          color: primaryText,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: cards,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: borders, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: borders,
        thickness: 1,
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: primaryText),
        displayMedium: TextStyle(color: primaryText),
        displaySmall: TextStyle(color: primaryText),
        headlineLarge: TextStyle(color: primaryText),
        headlineMedium: TextStyle(color: primaryText),
        headlineSmall: TextStyle(color: primaryText),
        titleLarge: TextStyle(color: primaryText),
        titleMedium: TextStyle(color: primaryText),
        titleSmall: TextStyle(color: primaryText),
        bodyLarge: TextStyle(color: primaryText),
        bodyMedium: TextStyle(color: primaryText),
        bodySmall: TextStyle(color: secondaryText),
        labelLarge: TextStyle(color: primaryText),
        labelMedium: TextStyle(color: secondaryText),
        labelSmall: TextStyle(color: secondaryText),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: sidebar,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: borders),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: borders),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryAccent),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: error),
        ),
        hintStyle: const TextStyle(color: secondaryText),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryAccent,
          foregroundColor: primaryText,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: primaryAccent,
        foregroundColor: primaryText,
      ),
    );
  }
}
