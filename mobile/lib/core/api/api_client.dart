import 'dart:async';
import 'dart:io' show HttpClient;

import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

import '../config/app_config.dart';
import '../storage/token_storage.dart';
import 'api_exception.dart';
import 'api_models.dart';

typedef SessionExpiredCallback = FutureOr<void> Function();

class ApiClient {
  ApiClient({
    required TokenStorage tokenStorage,
    required SessionExpiredCallback onSessionExpired,
    Dio? dio,
  }) : _tokenStorage = tokenStorage,
       _onSessionExpired = onSessionExpired,
       _dio =
           dio ??
           Dio(
             BaseOptions(
               baseUrl: AppConfig.apiBaseUrl,
               connectTimeout: const Duration(seconds: 15),
               receiveTimeout: const Duration(seconds: 20),
               headers: const <String, Object>{'Accept': 'application/json'},
             ),
           ) {
    _configureDio(_dio);
    _dio.interceptors.add(_AuthenticationInterceptor(this));
  }

  static void _configureDio(Dio dio) {
    if (!kIsWeb && dio.httpClientAdapter is IOHttpClientAdapter) {
      (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
        final client = HttpClient();
        client.badCertificateCallback = (cert, host, port) => true;
        return client;
      };
    }
  }

  final Dio _dio;
  final TokenStorage _tokenStorage;
  final SessionExpiredCallback _onSessionExpired;
  Future<bool>? _refreshing;

  Dio get dio => _dio;

  Future<ApiEnvelope> get(String path, {Map<String, Object?>? query}) =>
      _request(() => _dio.get<Object?>(path, queryParameters: query));

  Future<ApiEnvelope> post(String path, {Object? data}) =>
      _request(() => _dio.post<Object?>(path, data: data));

  Future<ApiEnvelope> put(String path, {Object? data}) =>
      _request(() => _dio.put<Object?>(path, data: data));

  Future<ApiEnvelope> patch(String path, {Object? data, Map<String, Object?>? query}) =>
      _request(() => _dio.patch<Object?>(path, data: data, queryParameters: query));

  Future<ApiEnvelope> _request(
    Future<Response<Object?>> Function() call,
  ) async {
    try {
      final response = await call();
      return _decode(response);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  ApiEnvelope _decode(Response<Object?> response) {
    final body = response.data;
    if (body is! Map) {
      throw const ApiException('The server returned an unexpected response.');
    }
    final envelope = ApiEnvelope.fromJson(Map<String, dynamic>.from(body));
    if (!envelope.success) {
      throw ApiException(
        envelope.message,
        statusCode: response.statusCode,
        code: envelope.code,
      );
    }
    return envelope;
  }

  ApiException _mapError(DioException error) {
    final response = error.response;
    final data = response?.data;
    if (data is Map) {
      final body = Map<String, dynamic>.from(data);
      final errors = (body['errors'] as List? ?? const <Object?>[])
          .whereType<Map>()
          .map(
            (Map item) => FieldError(
              field: '${item['field'] ?? ''}',
              message:
                  '${item['message'] ?? body['message'] ?? 'Invalid value'}',
            ),
          )
          .toList(growable: false);
      return ApiException(
        '${body['message'] ?? 'Something went wrong. Please try again.'}',
        statusCode: response?.statusCode,
        code: body['code'] as String?,
        fieldErrors: errors,
      );
    }
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return const ApiException(
        'Unable to reach Zeera. Check your connection and try again.',
      );
    }
    return const ApiException('Something went wrong. Please try again.');
  }

  Future<bool> refreshAccessToken() =>
      _refreshing ??= _refresh().whenComplete(() {
        _refreshing = null;
      });

  Future<bool> _refresh() async {
    final tokens = await _tokenStorage.read();
    if (tokens == null) return false;
    try {
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 20),
        ),
      );
      _configureDio(refreshDio);
      final response = await refreshDio.post<Object?>(
        '/auth/refresh',
        data: <String, Object>{'refresh_token': tokens.refreshToken},
      );
      final envelope = _decode(response);
      final data = asMap(envelope.data);
      final tokenMap = asMap(data['tokens']);
      await _tokenStorage.write(
        AuthTokens(
          accessToken: requiredString(tokenMap, 'access_token'),
          refreshToken: requiredString(tokenMap, 'refresh_token'),
        ),
      );
      return true;
    } on Object {
      await _tokenStorage.clear();
      await _onSessionExpired();
      return false;
    }
  }
}

class _AuthenticationInterceptor extends QueuedInterceptor {
  _AuthenticationInterceptor(this._client);

  final ApiClient _client;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (!options.path.endsWith('/auth/login') &&
        !options.path.endsWith('/auth/register') &&
        !options.path.endsWith('/auth/refresh')) {
      final tokens = await _client._tokenStorage.read();
      if (tokens != null) {
        options.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    final request = error.requestOptions;
    final retrying = request.extra['zeere_retried'] == true;
    final isUnauthorized = error.response?.statusCode == 401;
    final canRefresh =
        !request.path.endsWith('/auth/refresh') &&
        !request.path.endsWith('/auth/login') &&
        !request.path.endsWith('/auth/register');
    if (!isUnauthorized || retrying || !canRefresh) return handler.next(error);

    if (!await _client.refreshAccessToken()) return handler.next(error);
    final tokens = await _client._tokenStorage.read();
    if (tokens == null) return handler.next(error);
    request.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
    request.extra['zeere_retried'] = true;
    try {
      final response = await _client.dio.fetch<Object?>(request);
      handler.resolve(response);
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }
}

Map<String, dynamic> asMap(Object? value) =>
    value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};

List<Map<String, dynamic>> asMapList(Object? value) =>
    (value as List? ?? const <Object?>[])
        .whereType<Map>()
        .map((Map item) => Map<String, dynamic>.from(item))
        .toList(growable: false);

String requiredString(Map<String, dynamic> map, String key) {
  final value = map[key];
  if (value is String && value.isNotEmpty) return value;
  throw const ApiException(
    'The server returned incomplete authentication data.',
  );
}
