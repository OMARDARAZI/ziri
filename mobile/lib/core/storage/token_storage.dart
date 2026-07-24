import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthTokens {
  const AuthTokens({required this.accessToken, required this.refreshToken});

  final String accessToken;
  final String refreshToken;
}

class TokenStorage {
  TokenStorage([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage();

  static const _accessKey = 'zeere_access_token';
  static const _refreshKey = 'zeere_refresh_token';
  final FlutterSecureStorage _storage;

  Future<AuthTokens?> read() async {
    final values = await _storage.readAll();
    final access = values[_accessKey];
    final refresh = values[_refreshKey];
    if (access == null ||
        access.isEmpty ||
        refresh == null ||
        refresh.isEmpty) {
      return null;
    }
    return AuthTokens(accessToken: access, refreshToken: refresh);
  }

  Future<void> write(AuthTokens tokens) => _storage
      .write(key: _accessKey, value: tokens.accessToken)
      .then(
        (_) => _storage.write(key: _refreshKey, value: tokens.refreshToken),
      );

  Future<void> clear() => _storage.deleteAll();
}
