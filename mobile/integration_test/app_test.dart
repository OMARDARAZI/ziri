import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:zeere/core/widgets/common_widgets.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('an empty remote-data state has a visible retry-safe fallback', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: EmptyState(message: 'No internet connection.')),
      ),
    );
    expect(find.text('No internet connection.'), findsOneWidget);
  });
}
