import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/api/api_client.dart';
import 'core/storage/token_storage.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/domain/user.dart';
import 'features/bookings/data/booking_repository.dart';
import 'features/content/data/content_repository.dart';
import 'features/content/domain/content_models.dart';
import 'features/explore/data/explore_repository.dart';
import 'features/explore/domain/explore_models.dart';

final tokenStorageProvider = Provider<TokenStorage>(
  (Ref ref) => TokenStorage(),
);

final apiClientProvider = Provider<ApiClient>(
  (Ref ref) => ApiClient(
    tokenStorage: ref.watch(tokenStorageProvider),
    onSessionExpired: () => ref.read(sessionProvider.notifier).expire(),
  ),
);

final authRepositoryProvider = Provider<AuthRepository>(
  (Ref ref) => AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(tokenStorageProvider),
  ),
);
final contentRepositoryProvider = Provider<ContentRepository>(
  (Ref ref) => ContentRepository(ref.watch(apiClientProvider)),
);
final exploreRepositoryProvider = Provider<ExploreRepository>(
  (Ref ref) => ExploreRepository(ref.watch(apiClientProvider)),
);
final bookingRepositoryProvider = Provider<BookingRepository>(
  (Ref ref) => BookingRepository(ref.watch(apiClientProvider)),
);

class SessionState {
  const SessionState({this.user, this.isRestoring = true});
  final User? user;
  final bool isRestoring;
  bool get isAuthenticated => user != null;
  SessionState copyWith({
    User? user,
    bool? isRestoring,
    bool clearUser = false,
  }) => SessionState(
    user: clearUser ? null : user ?? this.user,
    isRestoring: isRestoring ?? this.isRestoring,
  );
}

class SessionController extends Notifier<SessionState> {
  @override
  SessionState build() {
    unawaited(restore());
    return const SessionState();
  }

  Future<void> restore() async {
    try {
      final user = await ref.read(authRepositoryProvider).restore();
      state = SessionState(user: user, isRestoring: false);
    } on Object {
      await ref.read(tokenStorageProvider).clear();
      state = const SessionState(isRestoring: false);
    }
  }

  Future<void> login({required String phone, required String password}) async {
    final user = await ref
        .read(authRepositoryProvider)
        .login(phone: phone, password: password);
    state = SessionState(user: user, isRestoring: false);
  }

  Future<void> register({
    required String name,
    required String phone,
    required String password,
    required String confirmation,
  }) async {
    final user = await ref
        .read(authRepositoryProvider)
        .register(
          fullName: name,
          phone: phone,
          password: password,
          confirmation: confirmation,
        );
    state = SessionState(user: user, isRestoring: false);
  }

  Future<void> updateProfile({
    required String name,
    required String phone,
    String? avatarUrl,
    String? filePath,
  }) async {
    final user = await ref.read(authRepositoryProvider).updateProfile(
          fullName: name,
          phone: phone,
          avatarUrl: avatarUrl,
          filePath: filePath,
        );
    state = state.copyWith(user: user);
  }

  Future<void> changePassword({
    required String current,
    required String next,
  }) async {
    await ref
        .read(authRepositoryProvider)
        .changePassword(current: current, next: next);
    state = const SessionState(isRestoring: false);
  }

  Future<void> logout() async {
    try {
      await ref.read(authRepositoryProvider).logout();
    } finally {
      state = const SessionState(isRestoring: false);
    }
  }

  Future<void> deleteAccount() async {
    try {
      await ref.read(authRepositoryProvider).deleteAccount();
    } finally {
      state = const SessionState(isRestoring: false);
    }
  }

  Future<void> expire() async {
    await ref.read(tokenStorageProvider).clear();
    state = const SessionState(isRestoring: false);
  }
}

final sessionProvider = NotifierProvider<SessionController, SessionState>(
  SessionController.new,
);

final homeProvider = FutureProvider<HomeContent>(
  (Ref ref) => ref.watch(contentRepositoryProvider).home(),
);
final storiesProvider = FutureProvider<PageResult<Story>>(
  (Ref ref) => ref.watch(contentRepositoryProvider).stories(),
);
final newsProvider = FutureProvider<PageResult<NewsArticle>>(
  (Ref ref) => ref.watch(contentRepositoryProvider).news(),
);
final eventsProvider = FutureProvider<PageResult<Event>>(
  (Ref ref) => ref.watch(contentRepositoryProvider).events(),
);
final restaurantsProvider = FutureProvider<PageResult<Restaurant>>(
  (Ref ref) => ref.watch(contentRepositoryProvider).restaurants(),
);
final safetyTipsProvider = FutureProvider<PageResult<SafetyTip>>(
  (Ref ref) => ref.watch(contentRepositoryProvider).safetyTips(),
);
final weatherProvider = FutureProvider<PageResult<Weather>>(
  (Ref ref) => ref.watch(contentRepositoryProvider).weather(),
);
final providersProvider = FutureProvider<PageResult<ProviderProfile>>(
  (Ref ref) => ref.watch(exploreRepositoryProvider).providers(),
);

class OfferingFilter {
  const OfferingFilter({
    this.type,
    this.search,
    this.page = 1,
    this.limit = 20,
  });

  final String? type;
  final String? search;
  final int page;
  final int limit;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OfferingFilter &&
          runtimeType == other.runtimeType &&
          type == other.type &&
          search == other.search &&
          page == other.page &&
          limit == other.limit;

  @override
  int get hashCode => Object.hash(type, search, page, limit);
}

final offeringsProvider = FutureProvider.family<PageResult<Offering>, OfferingFilter>(
  (Ref ref, OfferingFilter filter) =>
      ref.watch(exploreRepositoryProvider).offerings(
        type: filter.type,
        search: filter.search,
        page: filter.page,
        limit: filter.limit,
      ),
);
final bookingsProvider = FutureProvider(
  (Ref ref) => ref.watch(bookingRepositoryProvider).bookings(),
);
final providerDetailProvider = FutureProvider.family<ProviderProfile, int>(
  (Ref ref, int id) => ref.watch(exploreRepositoryProvider).provider(id),
);
final offeringDetailProvider = FutureProvider.family<Offering, int>(
  (Ref ref, int id) => ref.watch(exploreRepositoryProvider).offering(id),
);
final bookingDetailProvider = FutureProvider.family(
  (Ref ref, int id) => ref.watch(bookingRepositoryProvider).booking(id),
);

final connectivityProvider = StreamProvider<bool>(
  (Ref ref) => Connectivity().onConnectivityChanged.map(
    (List<ConnectivityResult> results) =>
        !results.contains(ConnectivityResult.none),
  ),
);

class CurrencyController extends Notifier<String> {
  @override
  String build() {
    unawaited(_load());
    return 'USD';
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getString('preferred_currency') == 'LBP' ? 'LBP' : 'USD';
  }

  Future<void> set(String currency) async {
    state = currency;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('preferred_currency', currency);
  }
}

final currencyProvider = NotifierProvider<CurrencyController, String>(
  CurrencyController.new,
);
