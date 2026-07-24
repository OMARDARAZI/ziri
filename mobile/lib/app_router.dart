import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'app_providers.dart';
import 'core/widgets/common_widgets.dart';
import 'features/auth/presentation/auth_screens.dart';
import 'features/bookings/presentation/booking_screens.dart';
import 'features/content/presentation/content_screens.dart';
import 'features/explore/presentation/explore_screens.dart';
import 'features/profile/presentation/profile_screens.dart';

final routerProvider = Provider<GoRouter>((Ref ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen<SessionState>(sessionProvider, (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refresh,
    redirect: (BuildContext context, GoRouterState state) {
      final session = ref.read(sessionProvider);
      final path = state.matchedLocation;
      if (session.isRestoring) return path == '/splash' ? null : '/splash';
      if (path == '/splash') {
        return session.isAuthenticated ? '/home' : '/login';
      }
      const public = <String>{'/login', '/register'};
      final protected =
          path.startsWith('/bookings') || path.startsWith('/profile');
      if (!session.isAuthenticated && protected) {
        return '/login?from=${Uri.encodeComponent(state.uri.toString())}';
      }
      if (session.isAuthenticated && public.contains(path)) {
        final from = state.uri.queryParameters['from'];
        return from != null && from.startsWith('/') && !from.startsWith('//')
            ? from
            : '/home';
      }
      return null;
    },
    routes: <RouteBase>[
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      ShellRoute(
        builder: (BuildContext context, GoRouterState state, Widget child) =>
            MainShell(location: state.matchedLocation, child: child),
        routes: <RouteBase>[
          GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
          GoRoute(path: '/explore', builder: (_, _) => const ExploreScreen()),
          GoRoute(path: '/bookings', builder: (_, _) => const BookingsScreen()),
          GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
        ],
      ),
      GoRoute(
        path: '/stories',
        builder: (_, _) => const ContentListScreen(kind: 'stories'),
      ),
      GoRoute(
        path: '/stories/:id',
        builder: (_, GoRouterState s) => _intRoute(
          s,
          (int id) => ContentDetailScreen(kind: 'stories', id: id),
        ),
      ),
      GoRoute(
        path: '/news',
        builder: (_, _) => const ContentListScreen(kind: 'news'),
      ),
      GoRoute(
        path: '/news/:id',
        builder: (_, GoRouterState s) =>
            _intRoute(s, (int id) => ContentDetailScreen(kind: 'news', id: id)),
      ),
      GoRoute(
        path: '/events',
        builder: (_, _) => const ContentListScreen(kind: 'events'),
      ),
      GoRoute(
        path: '/events/:id',
        builder: (_, GoRouterState s) => _intRoute(
          s,
          (int id) => ContentDetailScreen(kind: 'events', id: id),
        ),
      ),
      GoRoute(
        path: '/safety-tips',
        builder: (_, _) => const ContentListScreen(kind: 'safety-tips'),
      ),
      GoRoute(
        path: '/safety-tips/:id',
        builder: (_, GoRouterState s) => _intRoute(
          s,
          (int id) => ContentDetailScreen(kind: 'safety-tips', id: id),
        ),
      ),
      GoRoute(path: '/weather', builder: (_, _) => const WeatherScreen()),
      GoRoute(path: '/providers', builder: (_, _) => const ProvidersScreen()),
      GoRoute(
        path: '/providers/:id',
        builder: (_, GoRouterState s) =>
            _intRoute(s, (int id) => ProviderDetailScreen(id: id)),
      ),
      GoRoute(
        path: '/offerings/:id',
        builder: (_, GoRouterState s) =>
            _intRoute(s, (int id) => OfferingDetailScreen(id: id)),
      ),
      GoRoute(
        path: '/bookings/new/:id',
        builder: (_, GoRouterState s) =>
            _intRoute(s, (int id) => BookingFormScreen(offeringId: id)),
      ),
      GoRoute(
        path: '/bookings/:id',
        builder: (_, GoRouterState s) =>
            _intRoute(s, (int id) => BookingDetailScreen(id: id)),
      ),
      GoRoute(
        path: '/bookings/:bookingId/participants/:participantId/qr',
        builder: (_, GoRouterState s) {
          final booking = int.tryParse(s.pathParameters['bookingId'] ?? '');
          final participant = int.tryParse(
            s.pathParameters['participantId'] ?? '',
          );
          return booking == null || participant == null
              ? const NotFoundScreen()
              : QrScreen(bookingId: booking, participantId: participant);
        },
      ),
      GoRoute(
        path: '/profile/edit',
        builder: (_, _) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/profile/change-password',
        builder: (_, _) => const ChangePasswordScreen(),
      ),
    ],
    errorBuilder: (_, _) => const NotFoundScreen(),
  );
});

Widget _intRoute(GoRouterState state, Widget Function(int value) builder) {
  final value = int.tryParse(state.pathParameters['id'] ?? '');
  return value == null ? const NotFoundScreen() : builder(value);
}

class MainShell extends ConsumerWidget {
  const MainShell({super.key, required this.location, required this.child});
  final String location;
  final Widget child;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final online = ref.watch(connectivityProvider).asData?.value ?? true;
    final index = location.startsWith('/explore')
        ? 1
        : location.startsWith('/bookings')
        ? 2
        : location.startsWith('/profile')
        ? 3
        : 0;
    const destinations = <String>['/home', '/explore', '/bookings', '/profile'];
    return Scaffold(
      body: Column(
        children: <Widget>[
          OfflineBanner(isOnline: online),
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (int value) => context.go(destinations[value]),
        destinations: const <NavigationDestination>[
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore),
            label: 'Explore',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month),
            label: 'Bookings',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class NotFoundScreen extends StatelessWidget {
  const NotFoundScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Not found')),
    body: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(Icons.travel_explore_outlined, size: 48),
          const SizedBox(height: 12),
          const Text('We could not find that page.'),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () => context.go('/home'),
            child: const Text('Go home'),
          ),
        ],
      ),
    ),
  );
}
