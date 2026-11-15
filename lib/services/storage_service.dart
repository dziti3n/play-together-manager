import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/account.dart';

class StorageService {
  static const String _keyAccounts = 'play_together_accounts_v1';
  static const String _keyTheme = 'play_together_theme_mode';

  static List<Account> getInitialAccounts() {
    return [
      Account(
        id: 'acc-1',
        username: 'tunafishbonmg88',
        password: 'password123',
        characterName: 'Tunafish_01',
        roleId: 'KAIA3SM48R',
        status: 'active',
        note: 'Acc chính farm trái cây và làm nhiệm vụ',
        stars: 7,
        gameBucks: 5,
        gems: 339,
        goldBars: 0,
        boxes: 644,
        tickets: 0,
        eventPoints: 0,
        fruits: [
          FruitItem(id: 'f-1', name: 'Cà rốt', icon: '🥕', quantity: 120),
          FruitItem(id: 'f-2', name: 'Cà chua', icon: '🍅', quantity: 50),
          FruitItem(id: 'f-3', name: 'Táo đỏ', icon: '🍎', quantity: 15),
          FruitItem(id: 'f-4', name: 'Ngô (Bắp)', icon: '🌽', quantity: 30),
          FruitItem(id: 'f-5', name: 'Dâu tây', icon: '🍓', quantity: 20),
        ],
        updatedAt: DateTime.now(),
      ),
      Account(
        id: 'acc-2',
        username: 'tunafishboyby94',
        password: 'password456',
        characterName: 'Tunafish_Boy',
        roleId: 'KAIA3SM4BK',
        status: 'active',
        note: 'Acc clone cày hộp quà và lúa mì',
        stars: 7,
        gameBucks: 519,
        gems: 451,
        goldBars: 0,
        boxes: 1120,
        tickets: 0,
        eventPoints: 0,
        fruits: [
          FruitItem(id: 'f-1', name: 'Cà rốt', icon: '🥕', quantity: 45),
          FruitItem(id: 'f-6', name: 'Lúa mì', icon: '🌾', quantity: 180),
          FruitItem(id: 'f-7', name: 'Bắp cải', icon: '🥬', quantity: 60),
        ],
        updatedAt: DateTime.now(),
      ),
    ];
  }

  static Future<List<Account>> loadAccounts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? jsonStr = prefs.getString(_keyAccounts);
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final List<dynamic> decoded = json.decode(jsonStr);
        return decoded.map((item) => Account.fromMap(item as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      // ignore and fallback
    }
    return getInitialAccounts();
  }

  static Future<bool> saveAccounts(List<Account> accounts) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final List<Map<String, dynamic>> mapped = accounts.map((a) => a.toMap()).toList();
      return await prefs.setString(_keyAccounts, json.encode(mapped));
    } catch (e) {
      return false;
    }
  }

  static Future<bool> loadThemeMode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(_keyTheme) ?? true; // Default dark mode
    } catch (e) {
      return true;
    }
  }

  static Future<void> saveThemeMode(bool isDark) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_keyTheme, isDark);
    } catch (e) {
      // ignore
    }
  }

  static String exportToJson(List<Account> accounts) {
    final List<Map<String, dynamic>> mapped = accounts.map((a) => a.toMap()).toList();
    return const JsonEncoder.withIndent('  ').convert(mapped);
  }

  static List<Account>? importFromJson(String jsonStr) {
    try {
      final decoded = json.decode(jsonStr);
      if (decoded is List) {
        return decoded.map((item) => Account.fromMap(item as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      return null;
    }
    return null;
  }
}
