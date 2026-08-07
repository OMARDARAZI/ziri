import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../../../core/utils/validators.dart';
import '../domain/user.dart';

class AuthRepository {
  const AuthRepository(this._api, this._tokens);
  final ApiClient _api;
  final TokenStorage _tokens;

  Future<User> login({required String phone, required String password}) async {
    final envelope = await _api.post(
      '/auth/login',
      data: <String, Object>{
        'phone': Validators.normalizePhone(phone),
        'password': password,
      },
    );
    return _saveSession(asMap(envelope.data));
  }

  Future<User> register({
    required String fullName,
    required String phone,
    required String password,
    required String confirmation,
  }) async {
    final envelope = await _api.post(
      '/auth/register',
      data: <String, Object>{
        'full_name': fullName.trim(),
        'phone': Validators.normalizePhone(phone),
        'password': password,
        'password_confirmation': confirmation,
      },
    );
    return _saveSession(asMap(envelope.data));
  }

  Future<User?> restore() async {
    final tokens = await _tokens.read();
    if (tokens == null) return null;

    if (tokens.isAccessTokenExpired) {
      final refreshed = await _api.refreshAccessToken();
      if (!refreshed) {
        await _tokens.clear();
        return null;
      }
    }

    try {
      final envelope = await _api.get('/auth/me');
      final user = User.fromJson(asMap(asMap(envelope.data)['user']));
      return user.isActive ? user : null;
    } catch (_) {
      await _tokens.clear();
      return null;
    }
  }

  Future<User> updateProfile({
    required String fullName,
    required String phone,
    String? avatarUrl,
    String? filePath,
  }) async {
    dynamic bodyData;
    if (filePath != null && filePath.isNotEmpty) {
      bodyData = FormData.fromMap(<String, dynamic>{
        'full_name': fullName.trim(),
        'phone': Validators.normalizePhone(phone),
        'avatar': await MultipartFile.fromFile(
          filePath,
          filename: filePath.split('/').last,
        ),
      });
    } else {
      final payload = <String, Object>{
        'full_name': fullName.trim(),
        'phone': Validators.normalizePhone(phone),
      };
      if (avatarUrl != null) payload['avatar_url'] = avatarUrl;
      bodyData = payload;
    }
    final envelope = await _api.put('/auth/profile', data: bodyData);
    return User.fromJson(asMap(asMap(envelope.data)['user']));
  }

  Future<User> updateNotificationPreference(bool enabled) async {
    final envelope = await _api.patch(
      '/auth/notifications-preference',
      data: <String, Object>{'notifications_enabled': enabled},
    );
    return User.fromJson(asMap(asMap(envelope.data)['user']));
  }

  Future<void> changePassword({
    required String current,
    required String next,
  }) async {
    await _api.put(
      '/auth/change-password',
      data: <String, Object>{'current_password': current, 'new_password': next},
    );
    await _tokens.clear();
  }

  Future<void> logout() async {
    final tokens = await _tokens.read();
    try {
      if (tokens != null) {
        await _api.post(
          '/auth/logout',
          data: <String, Object>{'refresh_token': tokens.refreshToken},
        );
      }
    } catch (_) {
    } finally {
      await _tokens.clear();
    }
  }

  Future<void> deleteAccount() async {
    final tokens = await _tokens.read();
    try {
      if (tokens != null) {
        await _api.post(
          '/auth/delete-account',
          data: <String, Object>{'refresh_token': tokens.refreshToken},
        );
      }
    } catch (_) {
    } finally {
      await _tokens.clear();
    }
  }

  Future<User> _saveSession(Map<String, dynamic> data) async {
    final tokenMap = asMap(data['tokens']);
    await _tokens.write(
      AuthTokens(
        accessToken: requiredString(tokenMap, 'access_token'),
        refreshToken: requiredString(tokenMap, 'refresh_token'),
      ),
    );
    return User.fromJson(asMap(data['user']));
  }
}
