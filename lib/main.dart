import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';
import 'services/storage_service.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final isDark = await StorageService.loadThemeMode();
  runApp(PlayTogetherApp(initialIsDark: isDark));
}

class PlayTogetherApp extends StatefulWidget {
  final bool initialIsDark;
  const PlayTogetherApp({super.key, required this.initialIsDark});

  @override
  State<PlayTogetherApp> createState() => _PlayTogetherAppState();
}

class _PlayTogetherAppState extends State<PlayTogetherApp> {
  late bool _isDark;

  @override
  void initState() {
    super.initState();
    _isDark = widget.initialIsDark;
  }

  void _toggleTheme() {
    setState(() {
      _isDark = !_isDark;
    });
    StorageService.saveThemeMode(_isDark);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Play Together Manager',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: _isDark ? ThemeMode.dark : ThemeMode.light,
      home: DashboardScreen(
        isDarkMode: _isDark,
        onToggleTheme: _toggleTheme,
      ),
    );
  }
}
