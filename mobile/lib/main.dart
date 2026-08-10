import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/services/onesignal_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  unawaited(OneSignalService.init());
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );
  runZonedGuarded(
    () => runApp(const ProviderScope(child: ZeereApp())),
    (Object _, StackTrace _) {},
  );
}
