import 'package:flutter/foundation.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';
import '../config/app_config.dart';

class OneSignalService {
  static bool _initialized = false;

  /// Initialize OneSignal Push Notifications for iOS and Android
  static Future<void> init() async {
    if (_initialized || kIsWeb) return;

    final appId = AppConfig.oneSignalAppId;
    if (appId.isEmpty || appId == 'YOUR_ONESIGNAL_APP_ID' || appId.length < 10) {
      if (kDebugMode) {
        print('OneSignal skipped: No valid OneSignal App ID provided.');
      }
      return;
    }

    try {
      if (kDebugMode) {
        OneSignal.Debug.setLogLevel(OSLogLevel.verbose);
      }

      // Initialize with App ID from AppConfig
      OneSignal.initialize(AppConfig.oneSignalAppId);

      // Prompt for push notification permission (iOS & Android 13+)
      await OneSignal.Notifications.requestPermission(true);

      // Setup click handlers for push notifications
      OneSignal.Notifications.addClickListener((event) {
        if (kDebugMode) {
          print('OneSignal Notification Opened: ${event.notification.title}');
        }
      });

      _initialized = true;
      if (kDebugMode) {
        print('OneSignal successfully initialized.');
      }
    } catch (e) {
      if (kDebugMode) {
        print('OneSignal initialization error: $e');
      }
    }
  }

  /// Associate authenticated user ID with OneSignal external user ID
  static Future<void> loginUser(int userId) async {
    if (kIsWeb) return;
    try {
      await OneSignal.login(userId.toString());
      if (kDebugMode) {
        print('OneSignal logged in user: $userId');
      }
    } catch (e) {
      if (kDebugMode) {
        print('OneSignal login user error: $e');
      }
    }
  }

  /// Clear user mapping upon logout
  static Future<void> logoutUser() async {
    if (kIsWeb) return;
    try {
      await OneSignal.logout();
      if (kDebugMode) {
        print('OneSignal logged out user');
      }
    } catch (e) {
      if (kDebugMode) {
        print('OneSignal logout user error: $e');
      }
    }
  }
}
