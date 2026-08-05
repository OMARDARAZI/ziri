import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ZeereTheme {
  const ZeereTheme._();

  // Primary Palette (User Specified)
  static const primaryNavy = Color(0xFF1B3A5C);        // Deep Navy (#1B3A5C) - Headers, nav bar, primary buttons
  static const primaryLight = Color(0xFF2E7D9A);       // Teal Blue (#2E7D9A) - Links, active states, icons
  static const secondary = Color(0xFF3B7FBF);          // Medium Blue (#3B7FBF) - Secondary buttons, charts
  static const accent = Color(0xFFF4C430);             // Golden Yellow (#F4C430) - Highlights, badges, CTAs
  static const accentWarm = Color(0xFFF5941F);         // Orange (#F5941F) - Alerts, notifications, warm CTAs
  static const coralRed = Color(0xFFE8483C);           // Coral Red (#E8483C) - Errors, destructive actions, alerts
  static const background = Color(0xFFF4F6F9);         // Off-white Bento page background (#F4F6F9)
  static const surface = Color(0xFFFFFFFF);            // White (#FFFFFF) - Cards, panels
  static const textPrimary = Color(0xFF1B3A5C);        // Dark Navy (#1B3A5C) - Body text, headings
  static const textDark = Color(0xFF1A1A1A);           // Dark Navy / Black (#1A1A1A)
  static const textMuted = Color(0xFF6B7A88);          // Slate Gray (#6B7A88) - Secondary text, captions
  static const border = Color(0xFFD6E4EC);             // Light Blue-Gray (#D6E4EC) - Dividers, input borders

  // Aliases for backward compatibility
  static const navy = primaryNavy;
  static const ocean = primaryLight;
  static const teal = primaryLight;
  static const turquoise = secondary;
  static const aqua = Color(0xFFEBF5F8);
  static const sand = background;
  static const coral = coralRed;
  static const muted = textMuted;

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(
      seedColor: primaryNavy,
      brightness: Brightness.light,
      primary: primaryNavy,
      onPrimary: Colors.white,
      secondary: primaryLight,
      onSecondary: Colors.white,
      tertiary: accent,
      surface: surface,
      onSurface: textPrimary,
      error: coralRed,
      onError: Colors.white,
      outline: border,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFFF8FAFC),
        foregroundColor: Color(0xFF1B3A5C),
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: Color(0xFF1B3A5C)),
        titleTextStyle: TextStyle(
          color: Color(0xFF1B3A5C),
          fontSize: 18,
          fontWeight: FontWeight.w800,
        ),
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
          statusBarBrightness: Brightness.light,
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
          side: const BorderSide(color: border, width: 1.5),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        labelStyle: const TextStyle(color: textMuted, fontWeight: FontWeight.w500),
        hintStyle: const TextStyle(color: textMuted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: const BorderSide(color: border, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: const BorderSide(color: border, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: const BorderSide(color: primaryLight, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 16,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primaryNavy,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryNavy,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryNavy,
          side: const BorderSide(color: border, width: 1.5),
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: primaryLight,
        unselectedItemColor: textMuted,
        elevation: 8,
      ),
      dividerTheme: const DividerThemeData(
        color: border,
        thickness: 1.5,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: primaryNavy,
        contentTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}
