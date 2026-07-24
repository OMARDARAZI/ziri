import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app_providers.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/common_widgets.dart';
import '../data/content_repository.dart';
import '../domain/content_models.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    appBar: AppBar(title: const Text('Discover Zeere')),
    body: RefreshIndicator(
      onRefresh: () async => ref.invalidate(homeProvider),
      child: AsyncContent<HomeContent>(
        value: ref.watch(homeProvider),
        onRetry: () => ref.invalidate(homeProvider),
        builder: (HomeContent home) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: <Widget>[
            if (home.weather != null) _WeatherHero(weather: home.weather!),
            _SectionHeader(
              title: 'Stories',
              onMore: () => context.go('/stories'),
            ),
            _StoriesRow(stories: home.stories),
            _SectionHeader(
              title: 'Latest news',
              onMore: () => context.go('/news'),
            ),
            _NewsColumn(items: home.news.take(3).toList(growable: false)),
            _SectionHeader(
              title: 'Upcoming events',
              onMore: () => context.go('/events'),
            ),
            _EventsColumn(items: home.events.take(3).toList(growable: false)),
            _SectionHeader(
              title: 'Safety first',
              onMore: () => context.go('/safety-tips'),
            ),
            _TipsColumn(items: home.safetyTips.take(3).toList(growable: false)),
          ],
        ),
      ),
    ),
  );
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
      _ => 'Safety tips',
    };
    return Scaffold(
      appBar: AppBar(title: Text(title)),
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
      _ =>
        ref
            .watch(contentRepositoryProvider)
            .detail('safety-tips', id, SafetyTip.fromJson),
    };
    return Scaffold(
      appBar: AppBar(title: const Text('Details')),
      body: FutureBuilder<Object>(
        future: future,
        builder: (BuildContext context, AsyncSnapshot<Object> snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Unable to load this item.'));
          }
          final item = snapshot.data!;
          return _DetailBody(item: item);
        },
      ),
    );
  }
}

class WeatherScreen extends ConsumerWidget {
  const WeatherScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    appBar: AppBar(title: const Text('Weather')),
    body: RefreshIndicator(
      onRefresh: () async => ref.invalidate(weatherProvider),
      child: AsyncContent<PageResult<Weather>>(
        value: ref.watch(weatherProvider),
        onRetry: () => ref.invalidate(weatherProvider),
        builder: (PageResult<Weather> result) => result.items.isEmpty
            ? const EmptyState(
                message: 'No weather update is available yet.',
                icon: Icons.wb_cloudy_outlined,
              )
            : ListView(
                padding: const EdgeInsets.all(16),
                children: result.items
                    .map((Weather weather) => _WeatherCard(weather: weather))
                    .toList(growable: false),
              ),
      ),
    ),
  );
}

class _WeatherHero extends StatelessWidget {
  const _WeatherHero({required this.weather});
  final Weather weather;
  @override
  Widget build(BuildContext context) => Card(
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: () => context.go('/weather'),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: <Color>[Color(0xFF0B7F83), Color(0xFF16344F)],
          ),
        ),
        child: Row(
          children: <Widget>[
            const Icon(Icons.wb_sunny_outlined, color: Colors.white, size: 44),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    weather.location,
                    style: const TextStyle(color: Colors.white70),
                  ),
                  Text(
                    '${weather.temperature.toStringAsFixed(0)}°',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 38,
                    ),
                  ),
                  Text(
                    weather.condition,
                    style: const TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white),
          ],
        ),
      ),
    ),
  );
}

class _WeatherCard extends StatelessWidget {
  const _WeatherCard({required this.weather});
  final Weather weather;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              const Icon(Icons.wb_sunny_outlined, size: 42),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  weather.location,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              Text(
                '${weather.temperature.toStringAsFixed(0)}°',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            weather.condition,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(weather.description),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: <Widget>[
              Text('Updated ${ZeereFormatters.dateTime(weather.weatherDate)}'),
              if (weather.humidity != null)
                Text('Humidity ${weather.humidity!.toStringAsFixed(0)}%'),
              if (weather.windSpeed != null)
                Text('Wind ${weather.windSpeed} km/h'),
            ],
          ),
        ],
      ),
    ),
  );
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.onMore});
  final String title;
  final VoidCallback onMore;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 26, bottom: 12),
    child: Row(
      children: <Widget>[
        Expanded(
          child: Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        TextButton(onPressed: onMore, child: const Text('View all')),
      ],
    ),
  );
}

class _StoriesRow extends StatelessWidget {
  const _StoriesRow({required this.stories});
  final List<Story> stories;
  @override
  Widget build(BuildContext context) => stories.isEmpty
      ? const Padding(
          padding: EdgeInsets.symmetric(vertical: 10),
          child: Text('No stories right now.'),
        )
      : SizedBox(
          height: 174,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: stories.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (BuildContext context, int index) {
              final item = stories[index];
              return SizedBox(
                width: 128,
                child: Card(
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: () => context.go('/stories/${item.id}'),
                    child: Stack(
                      fit: StackFit.expand,
                      children: <Widget>[
                        NetworkImageBox(image: item.image, label: item.title),
                        const DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: <Color>[
                                Colors.transparent,
                                Colors.black87,
                              ],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: <Widget>[
                              Text(
                                item.title,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                ZeereFormatters.time(item.storyTime),
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 11,
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
            },
          ),
        );
}

class _NewsColumn extends StatelessWidget {
  const _NewsColumn({required this.items});
  final List<NewsArticle> items;
  @override
  Widget build(BuildContext context) => items.isEmpty
      ? const Text('No news right now.')
      : Column(
          children: items
              .map((NewsArticle item) => _NewsTile(item: item))
              .toList(growable: false),
        );
}

class _EventsColumn extends StatelessWidget {
  const _EventsColumn({required this.items});
  final List<Event> items;
  @override
  Widget build(BuildContext context) => items.isEmpty
      ? const Text('No upcoming events.')
      : Column(
          children: items
              .map((Event item) => _EventTile(item: item))
              .toList(growable: false),
        );
}

class _TipsColumn extends StatelessWidget {
  const _TipsColumn({required this.items});
  final List<SafetyTip> items;
  @override
  Widget build(BuildContext context) => items.isEmpty
      ? const Text('No safety tips right now.')
      : Column(
          children: items
              .map((SafetyTip item) => _TipTile(item: item))
              .toList(growable: false),
        );
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
              children: <Widget>[
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
              children: <Widget>[
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
              children: <Widget>[
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
              children: <Widget>[
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
      onTap: () => context.go('/stories/${item.id}'),
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
                Text(ZeereFormatters.time(item.storyTime)),
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
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.go('/news/${item.id}'),
        child: Row(
          children: <Widget>[
            NetworkImageBox(
              image: item.image,
              height: 108,
              width: 120,
              label: item.title,
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      ZeereFormatters.date(item.publishedAt),
                      style: Theme.of(context).textTheme.bodySmall,
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
            ),
          ],
        ),
      ),
    ),
  );
}

class _EventTile extends StatelessWidget {
  const _EventTile({required this.item});
  final Event item;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.go('/events/${item.id}'),
        child: Row(
          children: <Widget>[
            NetworkImageBox(
              image: item.image,
              height: 104,
              width: 104,
              label: item.title,
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      item.title,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 6),
                    Text(ZeereFormatters.date(item.eventDate)),
                    if (item.location != null)
                      Text(
                        item.location!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _TipTile extends StatelessWidget {
  const _TipTile({required this.item});
  final SafetyTip item;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Card(
      child: InkWell(
        onTap: () => context.go('/safety-tips/${item.id}'),
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
      String title,
      String body,
      String? image,
      List<String> details,
    ) = switch (item) {
      Story value => (
        value.title,
        value.content,
        value.image,
        <String>['Story time: ${ZeereFormatters.time(value.storyTime)}'],
      ),
      NewsArticle value => (
        value.title,
        value.content,
        value.image,
        <String>[ZeereFormatters.date(value.publishedAt)],
      ),
      Event value => (
        value.title,
        value.description,
        value.image,
        <String>[
          ZeereFormatters.date(value.eventDate),
          if (value.startTime != null) ZeereFormatters.time(value.startTime),
          if (value.endTime != null)
            'to ${ZeereFormatters.time(value.endTime)}',
          if (value.location != null) value.location!,
        ],
      ),
      SafetyTip value => (
        value.title,
        value.content,
        value.image,
        const <String>[],
      ),
      _ => ('Details', '', null, const <String>[]),
    };
    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        if (image != null)
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: NetworkImageBox(
              image: image,
              height: 230,
              width: double.infinity,
              label: title,
            ),
          ),
        const SizedBox(height: 20),
        Text(
          title,
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: details
              .map((String detail) => Chip(label: Text(detail)))
              .toList(growable: false),
        ),
        const SizedBox(height: 12),
        Text(
          body,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.55),
        ),
      ],
    );
  }
}
