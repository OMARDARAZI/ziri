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
  final _searchController = TextEditingController();
  int _page = 1;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filter = OfferingFilter(type: _type, search: _search, page: _page);
    final results = ref.watch(offeringsProvider(filter));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async => ref.invalidate(offeringsProvider(filter)),
          child: AsyncContent<PageResult<Offering>>(
            value: results,
            onRetry: () => ref.invalidate(offeringsProvider(filter)),
            builder: (PageResult<Offering> result) {
              final items = result.items;
              final pagination = result.pagination;

              return ListView(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 110),
                children: <Widget>[
                  // Top Title Header
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const Text(
                        'Explore Experiences',
                        style: TextStyle(
                          color: Color(0xFF1B3A5C),
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: const <Widget>[
                          Icon(Icons.location_on, size: 13, color: Color(0xFF0F5B78)),
                          SizedBox(width: 3),
                          Text(
                            'Sidon Island, Lebanon',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Interactive Search Input
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: const Color(0xFFCBD5E1), width: 1.2),
                      boxShadow: const <BoxShadow>[
                        BoxShadow(
                          color: Color(0x0C000000),
                          blurRadius: 10,
                          offset: Offset(0, 3),
                        ),
                      ],
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (String val) {
                        setState(() {
                          _search = val;
                          _page = 1;
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'Search services, activities & boat trips…',
                        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                        prefixIcon: const Padding(
                          padding: EdgeInsets.only(left: 14, right: 8),
                          child: Icon(Icons.search_rounded, color: Color(0xFF0F5B78), size: 20),
                        ),
                        prefixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {
                                    _search = '';
                                    _page = 1;
                                  });
                                },
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 13),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Category Filter Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: <Widget>[
                        _FilterChipPill(
                          label: 'All Experiences',
                          icon: Icons.auto_awesome,
                          isSelected: _type == null,
                          onTap: () => setState(() {
                            _type = null;
                            _page = 1;
                          }),
                        ),
                        const SizedBox(width: 8),
                        _FilterChipPill(
                          label: 'Services',
                          icon: Icons.design_services,
                          isSelected: _type == 'SERVICE',
                          onTap: () => setState(() {
                            _type = 'SERVICE';
                            _page = 1;
                          }),
                        ),
                        const SizedBox(width: 8),
                        _FilterChipPill(
                          label: 'Activities',
                          icon: Icons.surfing,
                          isSelected: _type == 'ACTIVITY',
                          onTap: () => setState(() {
                            _type = 'ACTIVITY';
                            _page = 1;
                          }),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Verified Providers Banner Reel
                  const _ProvidersShortcut(),
                  const SizedBox(height: 20),

                  // Section Title
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: <Widget>[
                      Text(
                        _type == 'SERVICE'
                            ? 'Available Services'
                            : (_type == 'ACTIVITY' ? 'Island Activities' : 'Featured Experiences'),
                        style: const TextStyle(
                          color: Color(0xFF1B3A5C),
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        '${items.length} options',
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Offerings Feed
                  if (items.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: EmptyState(message: 'No services or activities found matching your search.'),
                    )
                  else ...<Widget>[
                    ...items.map((Offering item) => OfferingCard(offering: item)),

                    // Pagination Controls
                    if (pagination != null && pagination.pages > 1) ...<Widget>[
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: <Widget>[
                          OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF0F5B78),
                              side: const BorderSide(color: Color(0xFF0F5B78)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onPressed: pagination.page > 1
                                ? () => setState(() => _page = pagination.page - 1)
                                : null,
                            icon: const Icon(Icons.chevron_left, size: 18),
                            label: const Text('Previous', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                          Text(
                            'Page ${pagination.page} of ${pagination.pages}',
                            style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                          OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF0F5B78),
                              side: const BorderSide(color: Color(0xFF0F5B78)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onPressed: pagination.page < pagination.pages
                                ? () => setState(() => _page = pagination.page + 1)
                                : null,
                            icon: const Icon(Icons.chevron_right, size: 18),
                            label: const Text('Next', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ],
                  ],
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _FilterChipPill extends StatelessWidget {
  const _FilterChipPill({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0F5B78) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF0F5B78) : const Color(0xFFE2E8F0),
            width: 1.2,
          ),
          boxShadow: isSelected
              ? const <BoxShadow>[
                  BoxShadow(
                    color: Color(0x200F5B78),
                    blurRadius: 8,
                    offset: Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Row(
          children: <Widget>[
            Icon(
              icon,
              size: 14,
              color: isSelected ? Colors.white : const Color(0xFF64748B),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : const Color(0xFF1B3A5C),
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                fontSize: 12.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProvidersScreen extends ConsumerWidget {
  const ProvidersScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    backgroundColor: const Color(0xFFF8FAFC),
    appBar: AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      title: const Text(
        'Verified Providers',
        style: TextStyle(color: Color(0xFF1B3A5C), fontSize: 18, fontWeight: FontWeight.w800),
      ),
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Color(0xFF1B3A5C)),
        onPressed: () => context.canPop() ? context.pop() : context.go('/explore'),
      ),
    ),
    body: AsyncContent<PageResult<ProviderProfile>>(
      value: ref.watch(providersProvider),
      onRetry: () => ref.invalidate(providersProvider),
      builder: (PageResult<ProviderProfile> result) => RefreshIndicator(
        onRefresh: () async => ref.invalidate(providersProvider),
        child: result.items.isEmpty
            ? ListView(
                children: const <Widget>[
                  SizedBox(
                    height: 260,
                    child: EmptyState(message: 'No providers found.'),
                  ),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: result.items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
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
    backgroundColor: const Color(0xFFF8FAFC),
    appBar: AppBar(
      title: const Text('Provider Details'),
      backgroundColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Color(0xFF1B3A5C)),
        onPressed: () => context.pop(),
      ),
    ),
    body: AsyncContent<ProviderProfile>(
      value: ref.watch(providerDetailProvider(id)),
      onRetry: () => ref.invalidate(providerDetailProvider(id)),
      builder: (ProviderProfile provider) => ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: <Widget>[
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: const Color(0xFFEBF5F8),
                    child: ClipOval(
                      child: NetworkImageBox(
                        image: provider.logo,
                        height: 72,
                        width: 72,
                        label: provider.businessName,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: <Widget>[
                      Text(
                        provider.businessName,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1B3A5C),
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.verified, color: Color(0xFF0F5B78), size: 18),
                    ],
                  ),
                  if (provider.description != null) ...<Widget>[
                    const SizedBox(height: 8),
                    Text(
                      provider.description!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Color(0xFF64748B), height: 1.4),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (provider.phone != null || provider.email != null) ...<Widget>[
            const SizedBox(height: 16),
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: <Widget>[
                  if (provider.phone != null)
                    ListTile(
                      leading: const Icon(Icons.phone_outlined, color: Color(0xFF0F5B78)),
                      title: Text(provider.phone!),
                      onTap: () => _launch('tel:${provider.phone}'),
                    ),
                  if (provider.email != null) ...<Widget>[
                    if (provider.phone != null) const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.email_outlined, color: Color(0xFF0F5B78)),
                      title: Text(provider.email!),
                      onTap: () => _launch('mailto:${provider.email}'),
                    ),
                  ],
                ],
              ),
            ),
          ],
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
    backgroundColor: const Color(0xFFF8FAFC),
    appBar: AppBar(
      title: const Text('Offering Details'),
      backgroundColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Color(0xFF1B3A5C)),
        onPressed: () => context.pop(),
      ),
    ),
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
              item.type == 'ACTIVITY' ? 'Island Activity' : 'Service',
              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F5B78)),
            ),
            backgroundColor: const Color(0xFFEBF5F8),
            side: const BorderSide(color: Color(0xFFBBE0EC)),
          ),
          const SizedBox(height: 8),
          Text(
            item.title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF1B3A5C),
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Provided by ${item.providerName}',
            style: const TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 14),
          Text(
            item.description,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.5, color: const Color(0xFF334155)),
          ),
          const SizedBox(height: 16),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text(
                    'Pricing Details',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1B3A5C)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'USD: ${ZeereFormatters.money(item.priceUsd, 'USD')}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0F5B78)),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'LBP: ${ZeereFormatters.money(item.priceLbp, 'LBP')}',
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          if (item.durationMinutes != null || item.capacity != null || item.location != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Wrap(
                spacing: 14,
                runSpacing: 8,
                children: <Widget>[
                  if (item.durationMinutes != null)
                    Chip(
                      avatar: const Icon(Icons.timer_outlined, size: 16, color: Color(0xFF0F5B78)),
                      label: Text('${item.durationMinutes} minutes'),
                    ),
                  if (item.capacity != null)
                    Chip(
                      avatar: const Icon(Icons.people_outline, size: 16, color: Color(0xFF0F5B78)),
                      label: Text('Capacity: ${item.capacity}'),
                    ),
                  if (item.location != null)
                    Chip(
                      avatar: const Icon(Icons.place_outlined, size: 16, color: Color(0xFF0F5B78)),
                      label: Text(item.location!),
                    ),
                ],
              ),
            ),
          const SizedBox(height: 24),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF0F5B78),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => context.push('/bookings/new/${item.id}'),
            icon: const Icon(Icons.calendar_month_outlined),
            label: const Text('Book This Offering', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ],
      ),
    ),
  );
}

class _ProvidersShortcut extends ConsumerWidget {
  const _ProvidersShortcut();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final providersValue = ref.watch(providersProvider);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x0C0F5B78),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: <Widget>[
              Row(
                children: const <Widget>[
                  Icon(Icons.verified_user_rounded, color: Color(0xFF0F5B78), size: 18),
                  SizedBox(width: 6),
                  Text(
                    'Verified Island Providers',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1B3A5C),
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => context.push('/providers'),
                child: const Text(
                  'View All',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F5B78),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 72,
            child: AsyncContent<PageResult<ProviderProfile>>(
              value: providersValue,
              onRetry: () => ref.invalidate(providersProvider),
              builder: (PageResult<ProviderProfile> result) {
                final list = result.items;
                if (list.isEmpty) return const SizedBox.shrink();
                return ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (BuildContext context, int index) {
                    final item = list[index];
                    return GestureDetector(
                      onTap: () => context.push('/providers/${item.id}'),
                      child: Column(
                        children: <Widget>[
                          Container(
                            padding: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFF0F5B78), width: 1.5),
                            ),
                            child: CircleAvatar(
                              radius: 20,
                              backgroundColor: const Color(0xFFEBF5F8),
                              child: ClipOval(
                                child: NetworkImageBox(
                                  image: item.logo,
                                  height: 40,
                                  width: 40,
                                  label: item.businessName,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          SizedBox(
                            width: 60,
                            child: Text(
                              item.businessName,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF1B3A5C),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class ProviderCard extends StatelessWidget {
  const ProviderCard({super.key, required this.provider});
  final ProviderProfile provider;
  @override
  Widget build(BuildContext context) => Card(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    child: InkWell(
      onTap: () => context.push('/providers/${provider.id}'),
      borderRadius: BorderRadius.circular(16),
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
                  Row(
                    children: <Widget>[
                      Text(
                        provider.businessName,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1B3A5C)),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.verified, color: Color(0xFF0F5B78), size: 14),
                    ],
                  ),
                  if (provider.description != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        provider.description!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                      ),
                    ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFF64748B)),
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
  Widget build(BuildContext context) {
    final isActivity = offering.type == 'ACTIVITY';
    final lbpFormatted = '${(offering.priceLbp / 1000000).toStringAsFixed(1)}M LBP';

    return GestureDetector(
      onTap: () => context.push('/offerings/${offering.id}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
          boxShadow: const <BoxShadow>[
            BoxShadow(
              color: Color(0x0C0F5B78),
              blurRadius: 16,
              spreadRadius: 0,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            // Top Image Area
            Stack(
              children: <Widget>[
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  child: NetworkImageBox(
                    image: offering.image,
                    height: 160,
                    width: double.infinity,
                    label: offering.title,
                  ),
                ),
                // Gradient Overlay
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                      gradient: LinearGradient(
                        colors: <Color>[
                          Colors.transparent,
                          Colors.black.withOpacity(0.4),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ),
                // Top Left Category Badge Pill
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: isActivity ? const Color(0xFF0F5B78) : const Color(0xFF0D7398),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: const <BoxShadow>[
                        BoxShadow(color: Color(0x29000000), blurRadius: 4, offset: Offset(0, 2)),
                      ],
                    ),
                    child: Row(
                      children: <Widget>[
                        Icon(
                          isActivity ? Icons.surfing : Icons.design_services,
                          size: 11,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          isActivity ? 'ACTIVITY' : 'SERVICE',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 9.5,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Top Right Dual Price Badge
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.95),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: const <BoxShadow>[
                        BoxShadow(
                          color: Color(0x20000000),
                          blurRadius: 8,
                          offset: Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Text(
                          ZeereFormatters.money(offering.priceUsd, 'USD'),
                          style: const TextStyle(
                            color: Color(0xFF0F5B78),
                            fontWeight: FontWeight.w900,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          lbpFormatted,
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.w600,
                            fontSize: 9.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Bottom Rating Star Badge
                Positioned(
                  bottom: 10,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: const <Widget>[
                        Icon(Icons.star_rounded, color: Color(0xFFFFC107), size: 14),
                        SizedBox(width: 3),
                        Text(
                          '4.8 (95+ reviews)',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // Card Body Details
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  // Provider Title Row
                  Row(
                    children: <Widget>[
                      const Icon(Icons.verified, color: Color(0xFF0F5B78), size: 14),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          offering.providerName,
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Offering Title
                  Text(
                    offering.title,
                    style: const TextStyle(
                      color: Color(0xFF1B3A5C),
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Metadata Badges
                  Row(
                    children: <Widget>[
                      _InfoBadge(
                        icon: Icons.timer_outlined,
                        label: '${offering.durationMinutes ?? 60} mins',
                      ),
                      const SizedBox(width: 6),
                      _InfoBadge(
                        icon: Icons.place_outlined,
                        label: offering.location ?? 'Sidon',
                      ),
                      const SizedBox(width: 6),
                      _InfoBadge(
                        icon: Icons.people_outline,
                        label: 'Max ${offering.capacity ?? 10}',
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Book CTA Button
                  SizedBox(
                    width: double.infinity,
                    height: 42,
                    child: FilledButton.icon(
                      onPressed: () => context.push('/offerings/${offering.id}'),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF0F5B78),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                      label: const Text(
                        'View Experience & Book',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoBadge extends StatelessWidget {
  const _InfoBadge({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Icon(icon, size: 12, color: const Color(0xFF0F5B78)),
            const SizedBox(width: 3),
            Flexible(
              child: Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF1B3A5C),
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> _launch(String value) async {
  final uri = Uri.parse(value);
  if (await canLaunchUrl(uri)) await launchUrl(uri);
}
