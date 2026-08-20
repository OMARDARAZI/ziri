import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http_mock_adapter/http_mock_adapter.dart';
import 'package:zeere/app_providers.dart';
import 'package:zeere/core/api/api_client.dart';
import 'package:zeere/core/api/api_exception.dart';
import 'package:zeere/core/storage/token_storage.dart';
import 'package:zeere/core/utils/formatters.dart';
import 'package:zeere/core/utils/validators.dart';
import 'package:zeere/core/widgets/common_widgets.dart';
import 'package:zeere/features/auth/data/auth_repository.dart';
import 'package:zeere/features/auth/domain/user.dart';
import 'package:zeere/features/auth/presentation/auth_screens.dart';
import 'package:zeere/features/bookings/domain/booking_models.dart';
import 'package:zeere/features/content/domain/content_models.dart';
import 'package:zeere/features/profile/presentation/provider_scanner_screen.dart';


class MemoryTokenStorage extends TokenStorage {
  AuthTokens? tokens;

  @override
  Future<AuthTokens?> read() async => tokens;

  @override
  Future<void> write(AuthTokens value) async {
    tokens = value;
  }

  @override
  Future<void> clear() async {
    tokens = null;
  }
}

class FailingAuthRepository extends AuthRepository {
  FailingAuthRepository()
    : super(
        ApiClient(tokenStorage: MemoryTokenStorage(), onSessionExpired: () {}),
        MemoryTokenStorage(),
      );

  @override
  Future<User?> restore() async => null;

  @override
  Future<User> login({required String phone, required String password}) =>
      Future<User>.error(
        const ApiException('Validation failed', statusCode: 422),
      );
}

void main() {
  group('Validators', () {
    test('normalizes phone numbers for backend submission', () {
      expect(Validators.normalizePhone('70 123 456'), '+96170123456');
      expect(Validators.phone('+961 70 123 456'), isNull);
    });

    test('requires confirmed passwords and participant fields', () {
      expect(Validators.password('short'), isNotNull);
      expect(Validators.required(''), isNotNull);
      expect(Validators.required('Zeere'), isNull);
    });
  });

  group('Backend model parsing', () {
    test('parses home sections and preserves story time strings', () {
      final home = HomeContent.fromJson(<String, dynamic>{
        'stories': <Map<String, Object>>[
          <String, Object>{
            'id': 1,
            'title': 'Morning',
            'content': 'Details',
            'image': '/upload/a.jpg',
            'story_time': '08:30:00',
          },
        ],
        'news': <Object>[],
        'events': <Object>[],
        'safety_tips': <Object>[],
        'weather': null,
      });
      expect(home.stories.single.storyTime, '08:30:00');
      expect(ZeereFormatters.time(home.stories.single.storyTime), isNotEmpty);
    });

    test('parses numeric prices returned by MySQL as strings', () {
      final booking = Booking.fromJson(<String, dynamic>{
        'id': 5,
        'booking_code': 'ZR-2026-ABC',
        'offering_id': 3,
        'offering_title': 'Island tour',
        'offering_type': 'ACTIVITY',
        'provider_name': 'Zeere Tours',
        'scheduled_at': '2026-08-02T10:00:00.000Z',
        'currency': 'LBP',
        'unit_price': '1500000.00',
        'participant_count': 2,
        'total_amount': '3000000.00',
        'status': 'PENDING',
      });
      expect(booking.totalAmount, 3000000);
      expect(
        ZeereFormatters.money(booking.totalAmount, 'LBP'),
        contains('LBP'),
      );
    });
  });

  group('API failures', () {
    test(
      'preserves validation codes and never expires a session for a 422',
      () async {
        final dio = Dio(BaseOptions(baseUrl: 'https://zeere.test'));
        final adapter = DioAdapter(dio: dio);
        var expired = false;
        final client = ApiClient(
          tokenStorage: MemoryTokenStorage(),
          onSessionExpired: () => expired = true,
          dio: dio,
        );
        adapter.onPost(
          '/auth/login',
          (request) => request.reply(422, <String, dynamic>{
            'success': false,
            'message': 'Validation failed',
            'code': 'VALIDATION_ERROR',
          }),
        );
        await expectLater(
          client.post('/auth/login'),
          throwsA(
            isA<ApiException>().having(
              (ApiException error) => error.code,
              'code',
              'VALIDATION_ERROR',
            ),
          ),
        );
        expect(expired, isFalse);
      },
    );

    test(
      'keeps tokens and session state on an unexpected server error',
      () async {
        final dio = Dio(BaseOptions(baseUrl: 'https://zeere.test'));
        final adapter = DioAdapter(dio: dio);
        var expired = false;
        final storage = MemoryTokenStorage()
          ..tokens = const AuthTokens(
            accessToken: 'access',
            refreshToken: 'refresh',
          );
        final client = ApiClient(
          tokenStorage: storage,
          onSessionExpired: () => expired = true,
          dio: dio,
        );
        adapter.onGet(
          '/bookings',
          (request) => request.reply(500, <String, dynamic>{
            'success': false,
            'message': 'Unexpected failure',
            'code': 'INTERNAL_ERROR',
          }),
        );
        await expectLater(
          client.get('/bookings'),
          throwsA(
            isA<ApiException>().having(
              (ApiException error) => error.statusCode,
              'status',
              500,
            ),
          ),
        );
        expect(expired, isFalse);
        expect((await storage.read())?.accessToken, 'access');
      },
    );
  });

  testWidgets('preserves login form values after a server validation failure', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(FailingAuthRepository()),
        ],
        child: const MaterialApp(home: LoginScreen()),
      ),
    );
    final fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), '+961 70 123 456');
    await tester.enterText(fields.at(1), 'Password123!');

    await tester.tap(find.text('Log in'));
    await tester.pumpAndSettle();

    expect(find.text('Validation failed'), findsOneWidget);
    expect(
      tester.widget<TextFormField>(fields.at(0)).controller?.text,
      '+961 70 123 456',
    );
    expect(
      tester.widget<TextFormField>(fields.at(1)).controller?.text,
      'Password123!',
    );
  });

  testWidgets('empty state remains accessible and descriptive', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: EmptyState(message: 'No bookings yet.')),
      ),
    );
    expect(find.text('No bookings yet.'), findsOneWidget);
    expect(find.byIcon(Icons.inbox_outlined), findsOneWidget);
  });

  testWidgets('renders offline banner when offline without assertion error', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: OfflineBanner(isOnline: false)),
      ),
    );
    expect(
      find.text(
        'You appear to be offline. Visible information is still available.',
      ),
      findsOneWidget,
    );
  });

  test('parses provider role and qr validation result', () {
    final user = User.fromJson(<String, dynamic>{
      'id': 10,
      'role': 'PROVIDER',
      'full_name': 'Sea Breeze Team',
      'phone': '+96170000002',
      'is_active': true,
    });
    expect(user.role, 'PROVIDER');

    final result = QrValidationResult.fromJson(<String, dynamic>{
      'participant': <String, dynamic>{
        'full_name': 'John Doe',
        'phone': '+96170111222',
      },
      'booking': <String, dynamic>{
        'booking_code': 'ZR-2026-TEST',
        'offering_title': 'Jet Ski Safari',
        'provider_name': 'Sea Breeze Water Sports',
        'scheduled_at': '2026-08-10T10:00:00.000Z',
      },
      'qr_status': 'USED',
    });
    expect(result.participantName, 'John Doe');
    expect(result.bookingCode, 'ZR-2026-TEST');
    expect(result.qrStatus, 'USED');
  });

  testWidgets('renders provider scanner screen input field and validate button', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: ProviderScannerScreen(),
        ),
      ),
    );
    expect(find.text('Provider QR Scanner'), findsOneWidget);
    expect(find.text('Validate Reservation'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
    expect(find.text('Validate QR Code'), findsOneWidget);
  });

  testWidgets('renders Forgot password button on LoginScreen', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: LoginScreen(),
        ),
      ),
    );
    expect(find.text('Forgot password?'), findsOneWidget);
  });

  testWidgets('renders ForgotPasswordScreen with phone input and submit button', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: ForgotPasswordScreen(),
        ),
      ),
    );
    expect(find.text('Forgot password'), findsOneWidget);
    expect(find.text('Send verification code'), findsOneWidget);
    expect(find.byType(TextFormField), findsOneWidget);
  });
}


