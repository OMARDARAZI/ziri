import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthTokens {
  const AuthTokens({required this.accessToken, required this.refreshToken});

  final String accessToken;
  final String refreshToken;

  bool get isAccessTokenExpired {
    try {
      final parts = accessToken.split('.');
      if (parts.length != 3) return true;
      final normalized = base64Url.normalize(parts[1]);
      final payloadString = utf8.decode(base64Url.decode(normalized));
      final Map<String, dynamic> payload = jsonDecode(payloadString);
      if (!payload.containsKey('exp')) return false;
      final exp = payload['exp'];
      if (exp is int) {
        final expiryDate = DateTime.fromMillisecondsSinceEpoch(exp * 1000);
        return DateTime.now().isAfter(expiryDate.subtract(const Duration(seconds: 10)));
      }
      return false;
    } catch (_) {
      return true;
    }
  }
}

class TokenStorage {
  TokenStorage([FlutterSecureStorage? storage])
    : _storage = storage ??
          const FlutterSecureStorage(
            aOptions: AndroidOptions(
              resetOnError: true,
            ),
          );

  static const _accessKey = 'zeere_access_token';
  static const _refreshKey = 'zeere_refresh_token';
  final FlutterSecureStorage _storage;

  Future<AuthTokens?> read() async {
    try {
      final values = await _storage.readAll();
      var access = values[_accessKey];
      var refresh = values[_refreshKey];

      if (access == null || access.isEmpty || refresh == null || refresh.isEmpty) {
        final prefs = await SharedPreferences.getInstance();
        access = prefs.getString(_accessKey);
        refresh = prefs.getString(_refreshKey);
      }

      if (access == null || access.isEmpty || refresh == null || refresh.isEmpty) {
        return null;
      }
      return AuthTokens(accessToken: access, refreshToken: refresh);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      final access = prefs.getString(_accessKey);
      final refresh = prefs.getString(_refreshKey);
      if (access == null || access.isEmpty || refresh == null || refresh.isEmpty) {
        return null;
      }
      return AuthTokens(accessToken: access, refreshToken: refresh);
    }
  }

  Future<void> write(AuthTokens tokens) async {
    try {
      await _storage.write(key: _accessKey, value: tokens.accessToken);
      await _storage.write(key: _refreshKey, value: tokens.refreshToken);
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessKey, tokens.accessToken);
    await prefs.setString(_refreshKey, tokens.refreshToken);
  }

  Future<void> clear() async {
    try {
      await _storage.deleteAll();
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessKey);
    await prefs.remove(_refreshKey);
  }
}
