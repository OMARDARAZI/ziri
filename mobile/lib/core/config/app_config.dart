import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class AppConfig {
  const AppConfig._();

  static const appName = String.fromEnvironment(
    'APP_NAME',
    defaultValue: 'Zeera',
  );
  static const environment = String.fromEnvironment(
    'APP_ENV',
    defaultValue: 'development',
  );

  static String get _defaultHost {
    const customHost = String.fromEnvironment('SERVER_HOST');
    if (customHost.isNotEmpty) return customHost;
    return '54.224.201.177';
  }

  static String get adminUrl {
    const custom = String.fromEnvironment('ADMIN_URL');
    if (custom.isNotEmpty) return custom;
    return 'http://54.224.201.177/admin/login';
  }

  static String get apiBaseUrl {
    const custom = String.fromEnvironment('API_BASE_URL');
    if (custom.isNotEmpty) return custom;
    return 'http://$_defaultHost/api/v1';
  }

  static String get backendOrigin {
    const custom = String.fromEnvironment('BACKEND_ORIGIN');
    if (custom.isNotEmpty) return custom;
    return 'http://$_defaultHost';
  }

  static String get publicQrBaseUrl {
    const custom = String.fromEnvironment('PUBLIC_QR_BASE_URL');
    if (custom.isNotEmpty) return custom;
    return 'http://$_defaultHost/qr';
  }

  static const enableApiLogging = bool.fromEnvironment('ENABLE_API_LOGGING');
}
