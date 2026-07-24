import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_router.dart';
import 'core/theme/app_theme.dart';

class ZeereApp extends ConsumerWidget {
  const ZeereApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => MaterialApp.router(
    title: 'Zeere',
    debugShowCheckedModeBanner: false,
    theme: ZeereTheme.light,
    routerConfig: ref.watch(routerProvider),
  );
}
