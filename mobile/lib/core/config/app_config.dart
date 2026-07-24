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
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );
  static const backendOrigin = String.fromEnvironment(
    'BACKEND_ORIGIN',
    defaultValue: 'http://10.0.2.2:3000',
  );
  static const publicQrBaseUrl = String.fromEnvironment(
    'PUBLIC_QR_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/qr',
  );
  static const enableApiLogging = bool.fromEnvironment('ENABLE_API_LOGGING');
}
