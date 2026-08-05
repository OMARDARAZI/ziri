import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class AppConfig {
  const AppConfig._();

  static const appName = String.fromEnvironment(
    'APP_NAME',
    defaultValue: 'Zeere',
  );
  static const environment = String.fromEnvironment(
    'APP_ENV',
    defaultValue: 'development',
  );

  static String get _defaultHost {
    if (kIsWeb) return 'localhost';
    try {
      if (Platform.isAndroid) return '10.0.2.2';
    } catch (_) {}
    return 'localhost';
  }

  static String get apiBaseUrl {
    const custom = String.fromEnvironment('API_BASE_URL');
    if (custom.isNotEmpty) return custom;
    return 'http://$_defaultHost:3000/api/v1';
  }

  static String get backendOrigin {
    const custom = String.fromEnvironment('BACKEND_ORIGIN');
    if (custom.isNotEmpty) return custom;
    return 'http://$_defaultHost:3000';
  }

  static String get publicQrBaseUrl {
    const custom = String.fromEnvironment('PUBLIC_QR_BASE_URL');
    if (custom.isNotEmpty) return custom;
    return 'http://$_defaultHost:3000/qr';
  }

  static const enableApiLogging = bool.fromEnvironment('ENABLE_API_LOGGING');
}
