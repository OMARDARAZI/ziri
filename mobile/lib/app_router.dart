import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'app_providers.dart';
import 'core/widgets/common_widgets.dart';
import 'features/auth/presentation/auth_screens.dart';
import 'features/bookings/presentation/booking_screens.dart';
import 'features/content/domain/content_models.dart';
import 'features/content/presentation/content_screens.dart';
import 'features/content/presentation/story_viewer_screen.dart';
import 'features/explore/presentation/explore_screens.dart';
import 'features/notifications/presentation/notifications_screen.dart';
import 'features/profile/presentation/profile_screens.dart';
import 'features/profile/presentation/provider_scanner_screen.dart';


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
          path.startsWith('/bookings') || path.startsWith('/profile') || path.startsWith('/notifications');
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
      GoRoute(
        path: '/story-viewer',
        builder: (BuildContext context, GoRouterState state) {
          final extra = state.extra as Map<String, dynamic>?;
          final rawStories = extra?['stories'];
          final stories = rawStories is List ? rawStories.whereType<Story>().toList() : const <Story>[];
          final initialIndex = (extra?['initialIndex'] as int?) ?? 0;
          return StoryViewerScreen(stories: stories, initialIndex: initialIndex);
        },
      ),
      ShellRoute(
        builder: (BuildContext context, GoRouterState state, Widget child) =>
            MainShell(location: state.matchedLocation, child: child),
        routes: <RouteBase>[
          GoRoute(
            path: '/home',
            pageBuilder: (BuildContext context, GoRouterState state) =>
                const NoTransitionPage(child: HomeScreen()),
          ),
          GoRoute(
            path: '/explore',
            pageBuilder: (BuildContext context, GoRouterState state) =>
                const NoTransitionPage(child: ExploreScreen()),
          ),
          GoRoute(
            path: '/bookings',
            pageBuilder: (BuildContext context, GoRouterState state) =>
                const NoTransitionPage(child: BookingsScreen()),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (BuildContext context, GoRouterState state) =>
                const NoTransitionPage(child: ProfileScreen()),
          ),
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
        path: '/restaurants',
        builder: (_, _) => const ContentListScreen(kind: 'restaurants'),
      ),
      GoRoute(
        path: '/restaurants/:id',
        builder: (_, GoRouterState s) => _intRoute(
          s,
          (int id) => ContentDetailScreen(kind: 'restaurants', id: id),
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
      GoRoute(
        path: '/notifications',
        builder: (_, _) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/provider/scanner',
        builder: (_, _) => const ProviderScannerScreen(),
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
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: <Widget>[
          // Page Content
          Positioned.fill(
            child: Column(
              children: <Widget>[
                OfflineBanner(isOnline: online),
                Expanded(child: child),
              ],
            ),
          ),
          // Floating Pill Bar Overlaid on Top
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _FloatingNavBar(
              selectedIndex: index,
              onTap: (int value) => context.go(destinations[value]),
            ),
          ),
        ],
      ),
    );
  }
}

class _FloatingNavBar extends StatelessWidget {
  const _FloatingNavBar({
    required this.selectedIndex,
    required this.onTap,
  });

  final int selectedIndex;
  final ValueChanged<int> onTap;

  static const items = <_NavItemData>[
    _NavItemData(
      label: 'Home',
      icon: Icons.home_outlined,
      activeIcon: Icons.home_rounded,
    ),
    _NavItemData(
      label: 'Explore',
      icon: Icons.explore_outlined,
      activeIcon: Icons.explore_rounded,
    ),
    _NavItemData(
      label: 'Bookings',
      icon: Icons.airplane_ticket_outlined,
      activeIcon: Icons.airplane_ticket_rounded,
    ),
    _NavItemData(
      label: 'Profile',
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, bottomPadding > 0 ? bottomPadding : 16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
          boxShadow: const <BoxShadow>[
            BoxShadow(
              color: Color(0x1F0F5B78),
              blurRadius: 28,
              spreadRadius: 0,
              offset: Offset(0, 10),
            ),
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 8,
              spreadRadius: -2,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: List<Widget>.generate(items.length, (int index) {
            final isSelected = selectedIndex == index;
            final item = items[index];
            return Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => onTap(index),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeOutCubic,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: isSelected
                            ? const LinearGradient(
                                colors: <Color>[Color(0xFFE5F4F8), Color(0xFFD4EDF5)],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              )
                            : null,
                        color: isSelected ? null : Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                        border: isSelected
                            ? Border.all(color: const Color(0xFFB5DEEB), width: 1)
                            : Border.all(color: Colors.transparent, width: 1),
                      ),
                      child: AnimatedScale(
                        duration: const Duration(milliseconds: 200),
                        scale: isSelected ? 1.12 : 1.0,
                        child: Icon(
                          isSelected ? item.activeIcon : item.icon,
                          color: isSelected ? const Color(0xFF0F5B78) : const Color(0xFF64748B),
                          size: 22,
                        ),
                      ),
                    ),
                    const SizedBox(height: 3),
                    AnimatedDefaultTextStyle(
                      duration: const Duration(milliseconds: 200),
                      style: TextStyle(
                        color: isSelected ? const Color(0xFF0F5B78) : const Color(0xFF64748B),
                        fontSize: 11.5,
                        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                        letterSpacing: isSelected ? -0.2 : -0.1,
                      ),
                      child: Text(item.label),
                    ),
                    const SizedBox(height: 2),
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: isSelected ? 4 : 0,
                      height: isSelected ? 4 : 0,
                      decoration: const BoxDecoration(
                        color: Color(0xFF0F5B78),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _NavItemData {
  const _NavItemData({
    required this.label,
    required this.icon,
    required this.activeIcon,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
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
