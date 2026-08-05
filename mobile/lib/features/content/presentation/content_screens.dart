import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app_providers.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/image_url.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/domain/user.dart';
import '../../bookings/domain/booking_models.dart';
import '../data/content_repository.dart';
import '../domain/content_models.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final bookingsValue = ref.watch(bookingsProvider);
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final upcomingBooking = bookingsValue.asData?.value.items.cast<Booking?>().firstWhere(
      (Booking? b) {
        if (b == null || (b.status != 'PENDING' && b.status != 'CONFIRMED')) return false;
        if (b.scheduledAt != null && b.scheduledAt!.isNotEmpty) {
          final date = DateTime.tryParse(b.scheduledAt!);
          if (date != null && date.isBefore(todayStart)) return false;
        }
        return true;
      },
      orElse: () => null,
    );

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(homeProvider);
            ref.invalidate(bookingsProvider);
          },
          child: AsyncContent<HomeContent>(
            value: ref.watch(homeProvider),
            onRetry: () {
              ref.invalidate(homeProvider);
              ref.invalidate(bookingsProvider);
            },
            builder: (HomeContent home) => ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 115),
              children: <Widget>[
                // Top Custom Header
                _TopHeader(user: session.user),
                const SizedBox(height: 14),

                // Weather Hero Card
                if (home.weather != null) ...<Widget>[
                  _WeatherHero(weather: home.weather!),
                  const SizedBox(height: 18),
                ],

                // Island Stories Section (Kept outside as circular bubbles row)
                _SectionHeader(
                  title: 'Island Stories',
                ),
                const SizedBox(height: 10),
                _StoriesRow(stories: home.stories),
                const SizedBox(height: 18),

                // Upcoming Reservation Ticket (If exists)
                if (upcomingBooking != null) ...<Widget>[
                  _SectionHeader(
                    title: 'Your Upcoming Booking',
                    onMore: () => context.go('/bookings'),
                  ),
                  const SizedBox(height: 10),
                  _UpcomingTicketCard(booking: upcomingBooking),
                  const SizedBox(height: 18),
                ],

                // Custom Quick Categories Layout
                const _CustomQuickCategoriesLayout(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TopHeader extends StatelessWidget {
  const _TopHeader({required this.user});
  final User? user;

  @override
  Widget build(BuildContext context) {
    final userName = user?.fullName.split(' ').first ?? 'Alex';
    final initial = userName.trim().isNotEmpty ? userName.trim()[0].toUpperCase() : 'U';
    final resolvedAvatar = resolveImageUrl(user?.avatarUrl);

    return Row(
      children: <Widget>[
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF0F5B78),
            border: Border.all(color: const Color(0xFFD6E4EC), width: 1.5),
          ),
          child: ClipOval(
            child: resolvedAvatar != null && resolvedAvatar.isNotEmpty
                ? Image.network(
                    resolvedAvatar,
                    fit: BoxFit.cover,
                    width: 36,
                    height: 36,
                    errorBuilder: (_, __, ___) => Center(
                      child: Text(
                        initial,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  )
                : Center(
                    child: Text(
                      initial,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                  ),
          ),
        ),
      const SizedBox(width: 10),
      Expanded(
        child: Text(
          'Welcome Back, $userName',
          style: const TextStyle(
            color: Color(0xFF1B3A5C),
            fontSize: 16,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.3,
          ),
        ),
      ),
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: IconButton(
            icon: const Icon(Icons.search, size: 18, color: Color(0xFF1B3A5C)),
            onPressed: () => context.go('/explore'),
            padding: EdgeInsets.zero,
          ),
        ),
      ],
    );
  }
}

class _WeatherHero extends StatelessWidget {
  const _WeatherHero({required this.weather});
  final Weather weather;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          boxShadow: const <BoxShadow>[
            BoxShadow(
              color: Color(0x1A0F5B78),
              blurRadius: 14,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Stack(
            children: <Widget>[
              // Background Ziri Image
              Positioned.fill(
                child: Image.asset(
                  'assets/brand/ziri_image.jpeg',
                  fit: BoxFit.cover,
                ),
              ),
              // Dark Gradient Overlay for text contrast
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: <Color>[
                        const Color(0xFF082D42).withValues(alpha: 0.75),
                        const Color(0xFF0F5B78).withValues(alpha: 0.60),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                ),
              ),
              // Weather Card Content
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        const Icon(Icons.location_on_outlined, color: Colors.white, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          weather.location,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      weather.condition,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: <Widget>[
                        Text(
                          '${weather.temperature.toStringAsFixed(0)}°',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 42,
                            fontWeight: FontWeight.w300,
                            height: 1.0,
                          ),
                        ),
                        Row(
                          children: <Widget>[
                            Column(
                              children: <Widget>[
                                const Icon(Icons.water_drop_outlined, color: Colors.white, size: 16),
                                const SizedBox(height: 2),
                                Text(
                                  '${weather.humidity?.toStringAsFixed(0) ?? "60"}%',
                                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                            const SizedBox(width: 16),
                            Column(
                              children: <Widget>[
                                const Icon(Icons.air_outlined, color: Colors.white, size: 16),
                                const SizedBox(height: 2),
                                Text(
                                  '${weather.windSpeed?.toStringAsFixed(0) ?? "11"} km/h',
                                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.onMore});
  final String title;
  final VoidCallback? onMore;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: <Widget>[
      Text(
        title,
        style: const TextStyle(
          color: Color(0xFF1B3A5C),
          fontSize: 14,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.2,
        ),
      ),
      if (onMore != null)
        GestureDetector(
          onTap: onMore,
          child: const Text(
            'View all',
            style: TextStyle(
              color: Color(0xFF2E7D9A),
              fontWeight: FontWeight.w700,
              fontSize: 11,
            ),
          ),
        ),
    ],
  );
}

class _StoriesRow extends StatelessWidget {
  const _StoriesRow({required this.stories});
  final List<Story> stories;

  @override
  Widget build(BuildContext context) {
    final displayList = stories.isNotEmpty
        ? stories
        : const <Story>[
            Story(id: 1, title: 'Sunrise', content: '', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80', storyTime: null),
            Story(id: 2, title: 'Blue Lagoon', content: '', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80', storyTime: null),
            Story(id: 3, title: 'Local Eats', content: '', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80', storyTime: null),
            Story(id: 4, title: 'Old Town', content: '', image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&auto=format&fit=crop&q=80', storyTime: null),
          ];

    return SizedBox(
      height: 88,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: displayList.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (BuildContext context, int index) {
          final item = displayList[index];
          return GestureDetector(
            onTap: () {
              context.push(
                '/story-viewer',
                extra: <String, dynamic>{
                  'stories': displayList,
                  'initialIndex': index,
                },
              );
            },
            child: Column(
              children: <Widget>[
                Container(
                  width: 56,
                  height: 56,
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF0F5B78), width: 1.5),
                  ),
                  child: Container(
                    padding: const EdgeInsets.all(1.5),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: ClipOval(
                      child: NetworkImageBox(
                        image: item.image,
                        width: 48,
                        height: 48,
                        fit: BoxFit.cover,
                        label: item.title,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                SizedBox(
                  width: 60,
                  child: Text(
                    item.title,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF1B3A5C),
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class ContentListScreen extends ConsumerWidget {
  const ContentListScreen({super.key, required this.kind});
  final String kind;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final title = switch (kind) {
      'stories' => 'Stories',
      'news' => 'News',
      'events' => 'Events',
      'restaurants' => 'Restaurants',
      _ => 'Safety tips',
    };
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF8FAFC),
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          title,
          style: const TextStyle(
            color: Color(0xFF1B3A5C),
            fontSize: 16,
            fontWeight: FontWeight.w800,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF1B3A5C), size: 18),
          onPressed: () => context.canPop() ? context.pop() : context.go('/home'),
        ),
      ),
      body: switch (kind) {
        'stories' => _StoryList(
          value: ref.watch(storiesProvider),
          onRefresh: () => ref.invalidate(storiesProvider),
        ),
        'news' => _NewsList(
          value: ref.watch(newsProvider),
          onRefresh: () => ref.invalidate(newsProvider),
        ),
        'events' => _EventList(
          value: ref.watch(eventsProvider),
          onRefresh: () => ref.invalidate(eventsProvider),
        ),
        'restaurants' => _RestaurantList(
          value: ref.watch(restaurantsProvider),
          onRefresh: () => ref.invalidate(restaurantsProvider),
        ),
        _ => _TipList(
          value: ref.watch(safetyTipsProvider),
          onRefresh: () => ref.invalidate(safetyTipsProvider),
        ),
      },
    );
  }
}

class ContentDetailScreen extends ConsumerWidget {
  const ContentDetailScreen({super.key, required this.kind, required this.id});
  final String kind;
  final int id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final future = switch (kind) {
      'stories' =>
        ref
            .watch(contentRepositoryProvider)
            .detail('stories', id, Story.fromJson),
      'news' =>
        ref
            .watch(contentRepositoryProvider)
            .detail('news', id, NewsArticle.fromJson),
      'events' =>
        ref
            .watch(contentRepositoryProvider)
            .detail('events', id, Event.fromJson),
      'restaurants' =>
        ref
            .watch(contentRepositoryProvider)
            .detail('restaurants', id, Restaurant.fromJson),
      _ =>
        ref
            .watch(contentRepositoryProvider)
            .detail('safety-tips', id, SafetyTip.fromJson),
    };

    final pageTitle = switch (kind) {
      'events' => 'Event Details',
      'restaurants' => 'Restaurant & Menu',
      'news' => 'News Article',
      'stories' => 'Island Story',
      _ => 'Safety Tip',
    };

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF8FAFC),
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          pageTitle,
          style: const TextStyle(
            color: Color(0xFF1B3A5C),
            fontSize: 16,
            fontWeight: FontWeight.w800,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF1B3A5C), size: 18),
          onPressed: () => context.canPop() ? context.pop() : context.go('/home'),
        ),
      ),
      body: FutureBuilder<Object>(
        future: future,
        builder: (BuildContext context, AsyncSnapshot<Object> snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return const Center(child: Text('Unable to load this item.'));
          }
          final item = snapshot.data!;
          return _DetailBody(item: item);
        },
      ),
    );
  }
}



class _StoryList extends StatelessWidget {
  const _StoryList({required this.value, required this.onRefresh});
  final AsyncValue<PageResult<Story>> value;
  final VoidCallback onRefresh;
  @override
  Widget build(BuildContext context) => AsyncContent<PageResult<Story>>(
    value: value,
    onRetry: onRefresh,
    builder: (PageResult<Story> r) => RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: r.items.isEmpty
          ? ListView(
              children: const <Widget>[
                SizedBox(
                  height: 260,
                  child: EmptyState(message: 'No stories yet.'),
                ),
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: r.items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (BuildContext c, int i) =>
                  _StoryTile(item: r.items[i]),
            ),
    ),
  );
}

class _NewsList extends StatelessWidget {
  const _NewsList({required this.value, required this.onRefresh});
  final AsyncValue<PageResult<NewsArticle>> value;
  final VoidCallback onRefresh;
  @override
  Widget build(BuildContext context) => AsyncContent<PageResult<NewsArticle>>(
    value: value,
    onRetry: onRefresh,
    builder: (PageResult<NewsArticle> r) => RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: r.items.isEmpty
          ? ListView(
              children: const <Widget>[
                SizedBox(
                  height: 260,
                  child: EmptyState(message: 'No news yet.'),
                ),
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: r.items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (BuildContext c, int i) =>
                  _NewsTile(item: r.items[i]),
            ),
    ),
  );
}

class _EventList extends StatelessWidget {
  const _EventList({required this.value, required this.onRefresh});
  final AsyncValue<PageResult<Event>> value;
  final VoidCallback onRefresh;
  @override
  Widget build(BuildContext context) => AsyncContent<PageResult<Event>>(
    value: value,
    onRetry: onRefresh,
    builder: (PageResult<Event> r) => RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: r.items.isEmpty
          ? ListView(
              children: const <Widget>[
                SizedBox(
                  height: 260,
                  child: EmptyState(message: 'No upcoming events.'),
                ),
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: r.items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (BuildContext c, int i) =>
                  _EventTile(item: r.items[i]),
            ),
    ),
  );
}

class _RestaurantList extends StatelessWidget {
  const _RestaurantList({required this.value, required this.onRefresh});
  final AsyncValue<PageResult<Restaurant>> value;
  final VoidCallback onRefresh;
  @override
  Widget build(BuildContext context) => AsyncContent<PageResult<Restaurant>>(
    value: value,
    onRetry: onRefresh,
    builder: (PageResult<Restaurant> r) => RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: r.items.isEmpty
          ? ListView(
              children: const <Widget>[
                SizedBox(
                  height: 260,
                  child: EmptyState(message: 'No restaurants listed yet.'),
                ),
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: r.items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 16),
              itemBuilder: (BuildContext c, int i) =>
                  _RestaurantTile(item: r.items[i]),
            ),
    ),
  );
}

class _TipList extends StatelessWidget {
  const _TipList({required this.value, required this.onRefresh});
  final AsyncValue<PageResult<SafetyTip>> value;
  final VoidCallback onRefresh;
  @override
  Widget build(BuildContext context) => AsyncContent<PageResult<SafetyTip>>(
    value: value,
    onRetry: onRefresh,
    builder: (PageResult<SafetyTip> r) => RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: r.items.isEmpty
          ? ListView(
              children: const <Widget>[
                SizedBox(
                  height: 260,
                  child: EmptyState(message: 'No safety tips yet.'),
                ),
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: r.items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (BuildContext c, int i) =>
                  _TipTile(item: r.items[i]),
            ),
    ),
  );
}

class _StoryTile extends StatelessWidget {
  const _StoryTile({required this.item});
  final Story item;
  @override
  Widget build(BuildContext context) => Card(
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: () {
        context.push(
          '/story-viewer',
          extra: <String, dynamic>{
            'stories': <Story>[item],
            'initialIndex': 0,
          },
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          NetworkImageBox(
            image: item.image,
            height: 160,
            width: double.infinity,
            label: item.title,
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  item.title,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(ZeereFormatters.relativeTime(item.storyTime)),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _NewsTile extends StatelessWidget {
  const _NewsTile({required this.item});
  final NewsArticle item;

  @override
  Widget build(BuildContext context) {
    final publishedDate = item.publishedAt != null ? ZeereFormatters.date(item.publishedAt) : 'Recent';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFD6E4EC), width: 1.5),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x061B3A5C),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.push('/news/${item.id}'),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                // Left Column: News Metadata, Title & Excerpt
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      // Category Tag & Published Date
                      Row(
                        children: <Widget>[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'NEWS',
                              style: TextStyle(
                                color: Color(0xFFD97706),
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            publishedDate,
                            style: const TextStyle(
                              color: Color(0xFF6B7A88),
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Article Title
                      Text(
                        item.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF1B3A5C),
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          height: 1.25,
                        ),
                      ),
                      if (item.content.isNotEmpty) ...<Widget>[
                        const SizedBox(height: 6),
                        // Content Snippet Excerpt
                        Text(
                          item.content,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF6B7A88),
                            fontSize: 11,
                            height: 1.35,
                          ),
                        ),
                      ],
                      const SizedBox(height: 10),
                      // Read More Link
                      Row(
                        children: const <Widget>[
                          Text(
                            'Read Article',
                            style: TextStyle(
                              color: Color(0xFF0F5B78),
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(
                            Icons.arrow_forward_rounded,
                            size: 13,
                            color: Color(0xFF0F5B78),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Right Side: Rounded Article Thumbnail
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: NetworkImageBox(
                    image: item.image,
                    height: 100,
                    width: 100,
                    label: item.title,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _EventTile extends StatelessWidget {
  const _EventTile({required this.item});
  final Event item;

  @override
  Widget build(BuildContext context) {
    final dateFormatted = item.eventDate != null ? ZeereFormatters.date(item.eventDate) : 'Upcoming';
    final timeStr = [
      if (item.startTime != null && item.startTime!.isNotEmpty) item.startTime,
      if (item.endTime != null && item.endTime!.isNotEmpty) item.endTime,
    ].join(' - ');

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFD6E4EC), width: 1.5),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x0A1B3A5C),
            blurRadius: 14,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.push('/events/${item.id}'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              // Header Image with Date Badge
              Stack(
                children: <Widget>[
                  NetworkImageBox(
                    image: item.image,
                    height: 150,
                    width: double.infinity,
                    label: item.title,
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F5B78),
                        borderRadius: BorderRadius.circular(999),
                        boxShadow: const <BoxShadow>[
                          BoxShadow(
                            color: Color(0x33000000),
                            blurRadius: 6,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        dateFormatted.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 10,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              // Body Content
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      item.title,
                      style: const TextStyle(
                        color: Color(0xFF1B3A5C),
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (item.description.isNotEmpty) ...<Widget>[
                      const SizedBox(height: 6),
                      Text(
                        item.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF6B7A88),
                          fontSize: 12,
                          height: 1.35,
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      children: <Widget>[
                        if (timeStr.isNotEmpty) ...<Widget>[
                          const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFF0F5B78)),
                          const SizedBox(width: 4),
                          Text(
                            timeStr,
                            style: const TextStyle(
                              color: Color(0xFF1B3A5C),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 14),
                        ],
                        if (item.location != null && item.location!.isNotEmpty) ...<Widget>[
                          const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF0F5B78)),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              item.location!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF1B3A5C),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RestaurantTile extends StatelessWidget {
  const _RestaurantTile({required this.item});
  final Restaurant item;

  @override
  Widget build(BuildContext context) {
    final hoursStr = [
      if (item.openingTime != null && item.openingTime!.isNotEmpty) item.openingTime,
      if (item.closingTime != null && item.closingTime!.isNotEmpty) item.closingTime,
    ].join(' - ');

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFD6E4EC), width: 1.5),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x0A1B3A5C),
            blurRadius: 14,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.push('/restaurants/${item.id}'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              // Cover Image Header with Rating & Cuisine Badges
              Stack(
                children: <Widget>[
                  NetworkImageBox(
                    image: item.image,
                    height: 150,
                    width: double.infinity,
                    label: item.name,
                  ),
                  // Cuisine Type Pill
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFC2410C),
                        borderRadius: BorderRadius.circular(999),
                        boxShadow: const <BoxShadow>[
                          BoxShadow(
                            color: Color(0x33000000),
                            blurRadius: 6,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        item.cuisineType.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 10,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  // Rating & Price Pill
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(999),
                        boxShadow: const <BoxShadow>[
                          BoxShadow(
                            color: Color(0x22000000),
                            blurRadius: 6,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: <Widget>[
                          const Icon(Icons.star_rounded, size: 14, color: Color(0xFFF59E0B)),
                          const SizedBox(width: 3),
                          Text(
                            item.rating.toStringAsFixed(1),
                            style: const TextStyle(
                              color: Color(0xFF1B3A5C),
                              fontWeight: FontWeight.w800,
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '• ${item.priceRange}',
                            style: const TextStyle(
                              color: Color(0xFF6B7A88),
                              fontWeight: FontWeight.w600,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              // Body Details
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      item.name,
                      style: const TextStyle(
                        color: Color(0xFF1B3A5C),
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                    if (item.description.isNotEmpty) ...<Widget>[
                      const SizedBox(height: 6),
                      Text(
                        item.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF6B7A88),
                          fontSize: 12,
                          height: 1.35,
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      children: <Widget>[
                        if (hoursStr.isNotEmpty) ...<Widget>[
                          const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFFC2410C)),
                          const SizedBox(width: 4),
                          Text(
                            hoursStr,
                            style: const TextStyle(
                              color: Color(0xFF1B3A5C),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 14),
                        ],
                        if (item.location != null && item.location!.isNotEmpty) ...<Widget>[
                          const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFFC2410C)),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              item.location!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF1B3A5C),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: const <Widget>[
                        Text(
                          'View Menu & Details',
                          style: TextStyle(
                            color: Color(0xFFC2410C),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        SizedBox(width: 4),
                        Icon(
                          Icons.arrow_forward_rounded,
                          size: 13,
                          color: Color(0xFFC2410C),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TipTile extends StatelessWidget {
  const _TipTile({required this.item});
  final SafetyTip item;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Card(
      child: InkWell(
        onTap: () => context.push('/safety-tips/${item.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: <Widget>[
              const Icon(Icons.health_and_safety_outlined),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      item.title,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.content,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    ),
  );
}

class _DetailBody extends StatelessWidget {
  const _DetailBody({required this.item});
  final Object item;

  @override
  Widget build(BuildContext context) {
    final (
      String categoryLabel,
      Color categoryBgColor,
      Color categoryTextColor,
      String title,
      String body,
      String? image,
      String? dateStr,
      String? timeStr,
      String? locationStr,
    ) = switch (item) {
      Event value => (
        'EVENT',
        const Color(0xFFEBF5F8),
        const Color(0xFF0F5B78),
        value.title,
        value.description,
        value.image,
        value.eventDate != null ? ZeereFormatters.date(value.eventDate) : null,
        [
          if (value.startTime != null && value.startTime!.isNotEmpty) ZeereFormatters.time(value.startTime),
          if (value.endTime != null && value.endTime!.isNotEmpty) ZeereFormatters.time(value.endTime),
        ].join(' - '),
        value.location,
      ),
      Restaurant value => (
        'RESTAURANT',
        const Color(0xFFFFEDD5),
        const Color(0xFFC2410C),
        value.name,
        value.description,
        value.image,
        '⭐ ${value.rating.toStringAsFixed(1)} • ${value.priceRange} • ${value.cuisineType}',
        [
          if (value.openingTime != null && value.openingTime!.isNotEmpty) value.openingTime,
          if (value.closingTime != null && value.closingTime!.isNotEmpty) value.closingTime,
        ].join(' - '),
        [
          if (value.location != null && value.location!.isNotEmpty) value.location,
          if (value.phone != null && value.phone!.isNotEmpty) value.phone,
        ].join('  •  '),
      ),
      NewsArticle value => (
        'NEWS',
        const Color(0xFFFEF3C7),
        const Color(0xFFD97706),
        value.title,
        value.content,
        value.image,
        value.publishedAt != null ? ZeereFormatters.date(value.publishedAt) : null,
        null,
        null,
      ),
      Story value => (
        'ISLAND STORY',
        const Color(0xFFF3E8FF),
        const Color(0xFF9333EA),
        value.title,
        value.content,
        value.image,
        ZeereFormatters.relativeTime(value.storyTime),
        null,
        null,
      ),
      SafetyTip value => (
        'SAFETY TIP',
        const Color(0xFFDCFCE7),
        const Color(0xFF16A34A),
        value.title,
        value.content,
        value.image,
        null,
        null,
        null,
      ),
      _ => ('DETAILS', const Color(0xFFE2E8F0), const Color(0xFF475569), 'Details', '', null, null, null, null),
    };

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 60),
      children: <Widget>[
        // Hero Image
        if (image != null) ...<Widget>[
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              boxShadow: const <BoxShadow>[
                BoxShadow(
                  color: Color(0x140F5B78),
                  blurRadius: 16,
                  offset: Offset(0, 6),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: NetworkImageBox(
                image: image,
                height: 230,
                width: double.infinity,
                label: title,
              ),
            ),
          ),
          const SizedBox(height: 18),
        ],

        // Category Badge & Date Row
        Row(
          children: <Widget>[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: categoryBgColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                categoryLabel,
                style: TextStyle(
                  color: categoryTextColor,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            if (dateStr != null && dateStr.isNotEmpty) ...<Widget>[
              const SizedBox(width: 8),
              Icon(
                categoryLabel == 'RESTAURANT' ? Icons.star_rounded : Icons.calendar_today_rounded,
                size: 13,
                color: categoryLabel == 'RESTAURANT' ? const Color(0xFFFFB800) : const Color(0xFF64748B),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  dateStr,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF6B7A88),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 12),

        // Title
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFF1B3A5C),
            fontSize: 22,
            fontWeight: FontWeight.w800,
            height: 1.3,
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 12),

        // Additional Metadata Row (Time / Location)
        if ((timeStr != null && timeStr.isNotEmpty) || (locationStr != null && locationStr.isNotEmpty)) ...<Widget>[
          Row(
            children: <Widget>[
              if (timeStr != null && timeStr.isNotEmpty) ...<Widget>[
                const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFFC2410C)),
                const SizedBox(width: 4),
                Text(
                  timeStr,
                  style: const TextStyle(
                    color: Color(0xFF1B3A5C),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (locationStr != null && locationStr.isNotEmpty) ...<Widget>[
                  const SizedBox(width: 12),
                  const Text('•', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                  const SizedBox(width: 12),
                ],
              ],
              if (locationStr != null && locationStr.isNotEmpty) ...<Widget>[
                const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFFC2410C)),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    locationStr,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF1B3A5C),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
        ],
        const Divider(height: 1, color: Color(0xFFE2E8F0)),
        const SizedBox(height: 16),

        // Article / Description Body
        if (body.isNotEmpty) ...<Widget>[
          const Text(
            'About',
            style: TextStyle(
              color: Color(0xFF1B3A5C),
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            style: const TextStyle(
              color: Color(0xFF475569),
              fontSize: 14,
              height: 1.6,
              fontWeight: FontWeight.w400,
            ),
          ),
        ],

        // Menu Section for Restaurants
        if (item is Restaurant && (item as Restaurant).menuItems.isNotEmpty) ...<Widget>[
          const SizedBox(height: 24),
          Row(
            children: const <Widget>[
              Icon(Icons.restaurant_menu_rounded, color: Color(0xFFC2410C), size: 20),
              SizedBox(width: 8),
              Text(
                'Menu',
                style: TextStyle(
                  color: Color(0xFF1B3A5C),
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._buildMenuSections((item as Restaurant).menuItems),
        ],
      ],
    );
  }

  List<Widget> _buildMenuSections(List<MenuItem> items) {
    final Map<String, List<MenuItem>> categories = <String, List<MenuItem>>{};
    for (final MenuItem item in items) {
      categories.putIfAbsent(item.category, () => <MenuItem>[]).add(item);
    }

    final List<Widget> widgets = <Widget>[];
    for (final MapEntry<String, List<MenuItem>> entry in categories.entries) {
      widgets.add(
        Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 8),
          child: Text(
            entry.key,
            style: const TextStyle(
              color: Color(0xFFC2410C),
              fontSize: 14,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.3,
            ),
          ),
        ),
      );

      for (final MenuItem menuItem in entry.value) {
        widgets.add(
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        menuItem.name,
                        style: const TextStyle(
                          color: Color(0xFF1B3A5C),
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (menuItem.description.isNotEmpty) ...<Widget>[
                        const SizedBox(height: 4),
                        Text(
                          menuItem.description,
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 12,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEBF5F8),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    menuItem.price,
                    style: const TextStyle(
                      color: Color(0xFF0F5B78),
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      }
    }
    return widgets;
  }
}



class _UpcomingTicketCard extends StatelessWidget {
  const _UpcomingTicketCard({required this.booking});
  final Booking booking;

  @override
  Widget build(BuildContext context) {
    final isConfirmed = booking.status == 'CONFIRMED' || booking.status == 'ACTIVE';
    final statusColor = isConfirmed ? const Color(0xFF10B981) : const Color(0xFFF5941F);

    return GestureDetector(
      onTap: () => context.push('/bookings/${booking.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFD6E4EC), width: 1.5),
          boxShadow: const <BoxShadow>[
            BoxShadow(
              color: Color(0x0C1B3A5C),
              blurRadius: 16,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Column(
            children: <Widget>[
              // Top Ticket Bar with gradient header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: <Color>[Color(0xFF0F5B78), Color(0xFF082D42)],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        const Icon(Icons.confirmation_number_outlined, color: Colors.white, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          booking.bookingCode,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 11,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: statusColor, width: 1),
                      ),
                      child: Text(
                        booking.status,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 9,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Main Ticket Content
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    // Provider & Offering Title
                    Text(
                      booking.providerName,
                      style: const TextStyle(
                        color: Color(0xFF6B7A88),
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      booking.offeringTitle,
                      style: const TextStyle(
                        color: Color(0xFF1B3A5C),
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Date, Time, Participants row
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Row(
                            children: <Widget>[
                              const Icon(Icons.calendar_today_outlined, size: 14, color: Color(0xFF0F5B78)),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  ZeereFormatters.dateTime(booking.scheduledAt),
                                  style: const TextStyle(
                                    color: Color(0xFF1B3A5C),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Row(
                          children: <Widget>[
                            const Icon(Icons.group_outlined, size: 14, color: Color(0xFF0F5B78)),
                            const SizedBox(width: 4),
                            Text(
                              '${booking.participantCount} pax',
                              style: const TextStyle(
                                color: Color(0xFF1B3A5C),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Ticket Bottom Bar with QR shortcut prompt
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEBF5F8),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: <Widget>[
                          Row(
                            children: const <Widget>[
                              Icon(Icons.qr_code_2_outlined, size: 16, color: Color(0xFF0F5B78)),
                              SizedBox(width: 6),
                              Text(
                                'Tap to view ticket & QR voucher',
                                style: TextStyle(
                                  color: Color(0xFF0F5B78),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const Icon(Icons.chevron_right, size: 16, color: Color(0xFF0F5B78)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CustomQuickCategoriesLayout extends StatelessWidget {
  const _CustomQuickCategoriesLayout();

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        // Left Column: News Container Card (Tall, height 318px)
        Expanded(
          child: _NewsContainerCard(
            height: 318,
            onTap: () => context.go('/news'),
          ),
        ),
        const SizedBox(width: 12),
        // Right Column: Events, Restaurants, & Safety Tips
        Expanded(
          child: Column(
            children: <Widget>[
              _CategoryCard(
                title: 'Events',
                subtitle: 'View all events',
                icon: Icons.event_available_rounded,
                iconBgColor: const Color(0xFFEBF5F8),
                iconColor: const Color(0xFF0F5B78),
                height: 98,
                onTap: () => context.go('/events'),
              ),
              const SizedBox(height: 12),
              _CategoryCard(
                title: 'Restaurants',
                subtitle: 'Dining & Menus',
                icon: Icons.restaurant_rounded,
                iconBgColor: const Color(0xFFFFEDD5),
                iconColor: const Color(0xFFC2410C),
                height: 98,
                onTap: () => context.go('/restaurants'),
              ),
              const SizedBox(height: 12),
              _CategoryCard(
                title: 'Safety Tips',
                subtitle: 'View safety guide',
                icon: Icons.health_and_safety_rounded,
                iconBgColor: const Color(0xFFDCFCE7),
                iconColor: const Color(0xFF16A34A),
                height: 98,
                onTap: () => context.go('/safety-tips'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _NewsContainerCard extends StatelessWidget {
  const _NewsContainerCard({required this.onTap, this.height = 318});
  final VoidCallback onTap;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          height: height,
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: <Color>[Color(0xFF0F5B78), Color(0xFF1B3A5C)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            boxShadow: const <BoxShadow>[
              BoxShadow(
                color: Color(0x1A0F5B78),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: <Widget>[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.newspaper_rounded, color: Colors.white, size: 22),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 14),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD97706),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'NEWS & UPDATES',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'News',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Latest island updates & announcements.',
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: const <Widget>[
                      Text(
                        'Read News',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 12),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.iconBgColor,
    required this.iconColor,
    required this.height,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color iconBgColor;
  final Color iconColor;
  final double height;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          height: height,
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFD6E4EC), width: 1.5),
            boxShadow: const <BoxShadow>[
              BoxShadow(
                color: Color(0x061B3A5C),
                blurRadius: 8,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: <Widget>[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: iconBgColor,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: iconColor, size: 16),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFF94A3B8), size: 12),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF1B3A5C),
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF6B7A88),
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}


