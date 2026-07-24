import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app_providers.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../content/data/content_repository.dart';
import '../domain/explore_models.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});
  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  String? _type;
  String _search = '';
  @override
  Widget build(BuildContext context) {
    final results = ref.watch(offeringsProvider(_type));
    return Scaffold(
      appBar: AppBar(title: const Text('Explore')),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: TextField(
              onChanged: (String value) =>
                  setState(() => _search = value.trim().toLowerCase()),
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Search services and activities',
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SegmentedButton<String?>(
              segments: const <ButtonSegment<String?>>[
                ButtonSegment(value: null, label: Text('All')),
                ButtonSegment(value: 'SERVICE', label: Text('Services')),
                ButtonSegment(value: 'ACTIVITY', label: Text('Activities')),
              ],
              selected: <String?>{_type},
              onSelectionChanged: (Set<String?> values) =>
                  setState(() => _type = values.first),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: AsyncContent<PageResult<Offering>>(
              value: results,
              onRetry: () => ref.invalidate(offeringsProvider(_type)),
              builder: (PageResult<Offering> result) {
                final items = result.items
                    .where(
                      (Offering item) =>
                          item.title.toLowerCase().contains(_search) ||
                          item.providerName.toLowerCase().contains(_search),
                    )
                    .toList(growable: false);
                return RefreshIndicator(
                  onRefresh: () async =>
                      ref.invalidate(offeringsProvider(_type)),
                  child: items.isEmpty
                      ? ListView(
                          children: <Widget>[
                            SizedBox(
                              height: 260,
                              child: EmptyState(message: 'No offerings found.'),
                            ),
                          ],
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: items.length + 1,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 12),
                          itemBuilder: (BuildContext context, int index) =>
                              index == 0
                              ? _ProvidersShortcut()
                              : OfferingCard(offering: items[index - 1]),
                        ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class ProvidersScreen extends ConsumerWidget {
  const ProvidersScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    appBar: AppBar(title: const Text('Providers')),
    body: AsyncContent<PageResult<ProviderProfile>>(
      value: ref.watch(providersProvider),
      onRetry: () => ref.invalidate(providersProvider),
      builder: (PageResult<ProviderProfile> result) => RefreshIndicator(
        onRefresh: () async => ref.invalidate(providersProvider),
        child: result.items.isEmpty
            ? ListView(
                children: <Widget>[
                  SizedBox(
                    height: 260,
                    child: EmptyState(message: 'No providers found.'),
                  ),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: result.items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (BuildContext context, int index) =>
                    ProviderCard(provider: result.items[index]),
              ),
      ),
    ),
  );
}

class ProviderDetailScreen extends ConsumerWidget {
  const ProviderDetailScreen({super.key, required this.id});
  final int id;
  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    appBar: AppBar(title: const Text('Provider')),
    body: AsyncContent<ProviderProfile>(
      value: ref.watch(providerDetailProvider(id)),
      onRetry: () => ref.invalidate(providerDetailProvider(id)),
      builder: (ProviderProfile provider) => ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: NetworkImageBox(
              image: provider.coverImage,
              height: 190,
              width: double.infinity,
              label: provider.businessName,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: <Widget>[
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: NetworkImageBox(
                  image: provider.logo,
                  height: 62,
                  width: 62,
                  label: '${provider.businessName} logo',
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  provider.businessName,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          if (provider.description != null)
            Padding(
              padding: const EdgeInsets.only(top: 14),
              child: Text(
                provider.description!,
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(height: 1.5),
              ),
            ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              if (provider.phone != null)
                OutlinedButton.icon(
                  onPressed: () => _launch('tel:${provider.phone}'),
                  icon: const Icon(Icons.call_outlined),
                  label: const Text('Call'),
                ),
              if (provider.email != null)
                OutlinedButton.icon(
                  onPressed: () => _launch('mailto:${provider.email}'),
                  icon: const Icon(Icons.mail_outline),
                  label: const Text('Email'),
                ),
            ],
          ),
          if (provider.address != null)
            Padding(
              padding: const EdgeInsets.only(top: 14),
              child: Row(
                children: <Widget>[
                  const Icon(Icons.location_on_outlined),
                  const SizedBox(width: 8),
                  Expanded(child: Text(provider.address!)),
                ],
              ),
            ),
          const SizedBox(height: 24),
          Text('Offerings', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          if (provider.offerings.isEmpty)
            const Text('No active offerings are available.'),
          ...provider.offerings.map(
            (Offering offering) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: OfferingCard(offering: offering),
            ),
          ),
        ],
      ),
    ),
  );
}

class OfferingDetailScreen extends ConsumerWidget {
  const OfferingDetailScreen({super.key, required this.id});
  final int id;
  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    appBar: AppBar(title: const Text('Offering')),
    body: AsyncContent<Offering>(
      value: ref.watch(offeringDetailProvider(id)),
      onRetry: () => ref.invalidate(offeringDetailProvider(id)),
      builder: (Offering item) => ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: NetworkImageBox(
              image: item.image,
              height: 230,
              width: double.infinity,
              label: item.title,
            ),
          ),
          const SizedBox(height: 18),
          Chip(
            label: Text(
              item.type == 'ACTIVITY' ? 'Island activity' : 'Service',
            ),
          ),
          const SizedBox(height: 8),
          Text(
            item.title,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          Text(item.providerName, style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 14),
          Text(
            item.description,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.5),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    'Prices',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text('USD: ${ZeereFormatters.money(item.priceUsd, 'USD')}'),
                  Text('LBP: ${ZeereFormatters.money(item.priceLbp, 'LBP')}'),
                ],
              ),
            ),
          ),
          if (item.durationMinutes != null ||
              item.capacity != null ||
              item.location != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Wrap(
                spacing: 14,
                runSpacing: 8,
                children: <Widget>[
                  if (item.durationMinutes != null)
                    Text('${item.durationMinutes} minutes'),
                  if (item.capacity != null) Text('Capacity ${item.capacity}'),
                  if (item.location != null) Text(item.location!),
                ],
              ),
            ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => context.go('/bookings/new/${item.id}'),
            icon: const Icon(Icons.calendar_month_outlined),
            label: const Text('Book this offering'),
          ),
        ],
      ),
    ),
  );
}

class _ProvidersShortcut extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Card(
    child: ListTile(
      onTap: () => context.go('/providers'),
      leading: const Icon(Icons.storefront_outlined),
      title: const Text('Browse providers'),
      subtitle: const Text('View businesses offering Zeere experiences'),
      trailing: const Icon(Icons.chevron_right),
    ),
  );
}

class ProviderCard extends StatelessWidget {
  const ProviderCard({super.key, required this.provider});
  final ProviderProfile provider;
  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      onTap: () => context.go('/providers/${provider.id}'),
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: <Widget>[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: NetworkImageBox(
                image: provider.logo,
                height: 58,
                width: 58,
                label: provider.businessName,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    provider.businessName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  if (provider.description != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        provider.description!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right),
          ],
        ),
      ),
    ),
  );
}

class OfferingCard extends StatelessWidget {
  const OfferingCard({super.key, required this.offering});
  final Offering offering;

  @override
  Widget build(BuildContext context) => Card(
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: () => context.go('/offerings/${offering.id}'),
      child: Row(
        children: <Widget>[
          NetworkImageBox(
            image: offering.image,
            height: 130,
            width: 120,
            label: offering.title,
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    offering.type == 'ACTIVITY' ? 'ACTIVITY' : 'SERVICE',
                    style: Theme.of(
                      context,
                    ).textTheme.labelSmall?.copyWith(letterSpacing: 1.2),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    offering.title,
                    style: Theme.of(context).textTheme.titleMedium,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    offering.providerName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 7),
                  Text(
                    '${ZeereFormatters.money(offering.priceUsd, 'USD')} - ${ZeereFormatters.money(offering.priceLbp, 'LBP')}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

Future<void> _launch(String value) async {
  final uri = Uri.parse(value);
  if (await canLaunchUrl(uri)) await launchUrl(uri);
}
