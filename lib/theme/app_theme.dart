import 'package:flutter/material.dart';

class AppTheme {
  // Dark Colors
  static const Color darkBg = Color(0xFF141518);
  static const Color darkCard = Color(0xFF1C1E22);
  static const Color darkCardHover = Color(0xFF24272E);
  static const Color darkBorder = Color(0xFF2B2D35);
  static const Color darkSubtext = Color(0xFF8E95A5);

  // Light Colors
  static const Color lightBg = Color(0xFFF4F6F9);
  static const Color lightCard = Colors.white;
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightSubtext = Color(0xFF64748B);

  // Accents
  static const Color accentGreen = Color(0xFF10B981);
  static const Color accentCyan = Color(0xFF06B6D4);
  static const Color accentAmber = Color(0xFFF59E0B);
  static const Color accentFuchsia = Color(0xFFD946EF);
  static const Color accentRose = Color(0xFFF43F5E);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBg,
      cardColor: darkCard,
      colorScheme: const ColorScheme.dark(
        primary: accentCyan,
        secondary: accentGreen,
        surface: darkCard,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkBg,
        elevation: 0,
        centerTitle: false,
      ),
      dividerColor: darkBorder,
      useMaterial3: true,
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: lightBg,
      cardColor: lightCard,
      colorScheme: const ColorScheme.light(
        primary: accentCyan,
        secondary: accentGreen,
        surface: lightCard,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: Colors.black87),
      ),
      dividerColor: lightBorder,
      useMaterial3: true,
    );
  }
}
