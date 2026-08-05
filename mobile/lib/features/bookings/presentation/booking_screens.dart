import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app_providers.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../content/data/content_repository.dart';
import '../domain/booking_models.dart';

class BookingsScreen extends ConsumerStatefulWidget {
  const BookingsScreen({super.key});
  @override
  ConsumerState<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends ConsumerState<BookingsScreen> {
  String _filter = 'ALL';

  @override
  Widget build(BuildContext context) {
    final bookingsValue = ref.watch(bookingsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFFAF9FC),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async => ref.invalidate(bookingsProvider),
          child: AsyncContent<PageResult<Booking>>(
            value: bookingsValue,
            onRetry: () => ref.invalidate(bookingsProvider),
            builder: (PageResult<Booking> result) {
              final now = DateTime.now();
              final todayStart = DateTime(now.year, now.month, now.day);
              final items = _filter == 'ALL'
                  ? result.items
                  : result.items.where((Booking booking) {
                      final scheduledDate = booking.scheduledAt != null && booking.scheduledAt!.isNotEmpty
                          ? DateTime.tryParse(booking.scheduledAt!)
                          : null;
                      final isDatePast = scheduledDate != null && scheduledDate.isBefore(todayStart);

                      if (_filter == 'PENDING') {
                        // "Current" tab: Pending or Confirmed bookings on today or future dates
                        if (booking.status == 'CANCELLED' || isDatePast) return false;
                        return booking.status == 'PENDING' || booking.status == 'CONFIRMED';
                      }
                      if (_filter == 'COMPLETED') {
                        // "Past" tab: Completed bookings OR past scheduled dates
                        if (booking.status == 'CANCELLED') return false;
                        return booking.status == 'COMPLETED' || isDatePast;
                      }
                      return booking.status == _filter;
                    }).toList(growable: false);

              return ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
                children: <Widget>[
                  // Page Title & Subtitle Block
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const <Widget>[
                      Text(
                        'My Bookings',
                        style: TextStyle(
                          color: Color(0xFF002444),
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.5,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Manage your upcoming and past island adventures.',
                        style: TextStyle(
                          color: Color(0xFF43474E),
                          fontSize: 13,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Filter Tabs Scrollable Row
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: <Map<String, String>>[
                        {'key': 'ALL', 'label': 'All'},
                        {'key': 'PENDING', 'label': 'Current'},
                        {'key': 'COMPLETED', 'label': 'Past'},
                        {'key': 'CANCELLED', 'label': 'Cancelled'},
                      ].map((item) {
                        final isSelected = _filter == item['key'];
                        return Padding(
                          padding: const EdgeInsets.only(right: 10),
                          child: GestureDetector(
                            onTap: () => setState(() => _filter = item['key']!),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFFE5F4F8) : Colors.white,
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(
                                  color: isSelected ? const Color(0xFF056683) : const Color(0xFFC3C6CF),
                                  width: 1,
                                ),
                              ),
                              child: Text(
                                item['label']!,
                                style: TextStyle(
                                  color: isSelected ? const Color(0xFF056683) : const Color(0xFF43474E),
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Bookings Cards List
                  if (items.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 30),
                      child: EmptyState(
                        message: 'No bookings found in this section.',
                        icon: Icons.calendar_month_outlined,
                      ),
                    )
                  else
                    ...List.generate(items.length, (int index) {
                      return BookingCard(
                        booking: items[index],
                        isPrimary: index == 0,
                      );
                    }),
                  const _BookNewActivityCard(),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class BookingFormScreen extends ConsumerStatefulWidget {
  const BookingFormScreen({super.key, required this.offeringId});
  final int offeringId;
  @override
  ConsumerState<BookingFormScreen> createState() => _BookingFormScreenState();
}

class _BookingFormScreenState extends ConsumerState<BookingFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _notes = TextEditingController();
  final List<_GuestFields> _guests = <_GuestFields>[];
  bool _includeCustomer = true;
  bool _loading = false;
  DateTime? _scheduledAt;
  late String _currency;

  @override
  void initState() {
    super.initState();
    _currency = ref.read(currencyProvider);
  }

  @override
  void dispose() {
    _notes.dispose();
    for (final guest in _guests) {
      guest.dispose();
    }
    super.dispose();
  }

  Future<void> _dateTime() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      firstDate: now,
      lastDate: now.add(const Duration(days: 730)),
      initialDate: _scheduledAt ?? now,
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_scheduledAt ?? now),
    );
    if (time == null || !mounted) return;
    setState(
      () => _scheduledAt = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      ),
    );
  }

  Future<void> _submit() async {
    final formsValid = _formKey.currentState!.validate();
    if (_scheduledAt == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Choose a scheduled date and time.')),
      );
      return;
    }
    if (!_includeCustomer && _guests.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Add at least one participant or include yourself.'),
        ),
      );
      return;
    }
    if (!formsValid) return;
    setState(() => _loading = true);
    try {
      final booking = await ref
          .read(bookingRepositoryProvider)
          .create(
            offeringId: widget.offeringId,
            scheduledAt: _scheduledAt!,
            currency: _currency,
            includeCustomer: _includeCustomer,
            participants: _guests
                .map(
                  (item) => <String, String>{
                    'full_name': item.name.text.trim(),
                    'phone': Validators.normalizePhone(item.phone.text),
                  },
                )
                .toList(growable: false),
            notes: _notes.text,
          );
      ref.invalidate(bookingsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking created successfully.')),
        );
        context.go('/bookings/${booking.id}');
      }
    } on Object catch (error) {
      if (mounted) {
        final message = error is ApiException
            ? error.message
            : 'Failed to create booking. Please try again.';
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('New booking'),
      leading: IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: () => context.canPop() ? context.pop() : context.go('/bookings'),
      ),
    ),
    body: Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          Text(
            'Booking details',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              onTap: _dateTime,
              leading: const Icon(Icons.event_outlined),
              title: const Text('Scheduled date and time'),
              subtitle: Text(
                _scheduledAt == null
                    ? 'Choose when you would like to book'
                    : ZeereFormatters.dateTime(_scheduledAt!.toIso8601String()),
              ),
              trailing: const Icon(Icons.chevron_right),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Payment currency',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          SegmentedButton<String>(
            segments: const <ButtonSegment<String>>[
              ButtonSegment(value: 'USD', label: Text('USD')),
              ButtonSegment(value: 'LBP', label: Text('LBP')),
            ],
            selected: <String>{_currency},
            onSelectionChanged: (Set<String> selected) {
              setState(() => _currency = selected.first);
              ref.read(currencyProvider.notifier).set(_currency);
            },
          ),
          const SizedBox(height: 24),
          Text('Participants', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: const Text('Include me'),
            subtitle: const Text(
              'Zeera will add your account details as a participant.',
            ),
            value: _includeCustomer,
            onChanged: (bool value) => setState(() => _includeCustomer = value),
          ),
          ..._guests.asMap().entries.map(
            (MapEntry<int, _GuestFields> entry) => _GuestEditor(
              index: entry.key,
              fields: entry.value,
              onRemove: () {
                setState(() {
                  final guest = _guests.removeAt(entry.key);
                  guest.dispose();
                });
              },
            ),
          ),
          OutlinedButton.icon(
            onPressed: () => setState(() => _guests.add(_GuestFields())),
            icon: const Icon(Icons.person_add_alt_1_outlined),
            label: const Text('Add another person'),
          ),
          const SizedBox(height: 24),
          TextFormField(
            controller: _notes,
            minLines: 2,
            maxLines: 5,
            maxLength: 2000,
            decoration: const InputDecoration(
              labelText: 'Notes (optional)',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Text('Confirm booking'),
          ),
        ],
      ),
    ),
  );
}

class BookingDetailScreen extends ConsumerWidget {
  const BookingDetailScreen({super.key, required this.id});
  final int id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFFAF9FC),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFAF9FC),
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text(
          'Booking Details',
          style: TextStyle(
            color: Color(0xFF002444),
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF002444), size: 18),
          onPressed: () => context.canPop() ? context.pop() : context.go('/bookings'),
        ),
      ),
      body: AsyncContent<Booking>(
        value: ref.watch(bookingDetailProvider(id)),
        onRetry: () => ref.invalidate(bookingDetailProvider(id)),
        builder: (Booking booking) {
          final isConfirmed = booking.status == 'CONFIRMED' || booking.status == 'ACTIVE';
          final statusColor = isConfirmed ? const Color(0xFF10B981) : const Color(0xFFF5941F);
          final participant = booking.participants.isNotEmpty ? booking.participants.first : null;
          final qrData = participant?.qr?.publicUrl.isNotEmpty == true
              ? participant!.qr!.publicUrl
              : (participant?.qr != null ? 'https://zeere.test/qr/${participant!.qr!.id}' : 'ZR-${booking.bookingCode}');

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
            children: <Widget>[
              // Top Bento Card (Reference & Service Provider)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFD6E4EC), width: 1.5),
                  boxShadow: const <BoxShadow>[
                    BoxShadow(
                      color: Color(0x0A1B3A5C),
                      blurRadius: 20,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    // Reference & Status Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            const Text(
                              'REFERENCE',
                              style: TextStyle(
                                color: Color(0xFF73777F),
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.6,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              booking.bookingCode,
                              style: const TextStyle(
                                color: Color(0xFF002444),
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.2,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            booking.status,
                            style: TextStyle(
                              color: statusColor,
                              fontWeight: FontWeight.w800,
                              fontSize: 10,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Offering Title
                    Text(
                      booking.offeringTitle,
                      style: const TextStyle(
                        color: Color(0xFF002444),
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),

                    // Location Row
                    Row(
                      children: <Widget>[
                        const Icon(Icons.location_on_outlined, size: 16, color: Color(0xFF43474E)),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            booking.providerName,
                            style: const TextStyle(
                              color: Color(0xFF43474E),
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    const Divider(color: Color(0xFFEEEDF1), height: 1, thickness: 1),
                    const SizedBox(height: 16),

                    // Provider Avatar & Call / Email Actions Row
                    Row(
                      children: <Widget>[
                        Container(
                          width: 44,
                          height: 44,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Color(0xFF96DEFF),
                          ),
                          child: Center(
                            child: Text(
                              booking.providerName.isNotEmpty ? booking.providerName[0].toUpperCase() : 'P',
                              style: const TextStyle(
                                color: Color(0xFF003B65),
                                fontWeight: FontWeight.w800,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                booking.providerName,
                                style: const TextStyle(
                                  color: Color(0xFF002444),
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 1),
                              const Text(
                                'Service Provider',
                                style: TextStyle(
                                  color: Color(0xFF6B7A88),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Call button
                        Container(
                          width: 36,
                          height: 36,
                          margin: const EdgeInsets.only(right: 8),
                          decoration: const BoxDecoration(
                            color: Color(0xFFBCE9FF),
                            shape: BoxShape.circle,
                          ),
                          child: IconButton(
                            padding: EdgeInsets.zero,
                            icon: const Icon(Icons.call_outlined, color: Color(0xFF056683), size: 18),
                            onPressed: () => _launch('tel:+96170000002'),
                          ),
                        ),
                        // Email button
                        Container(
                          width: 36,
                          height: 36,
                          decoration: const BoxDecoration(
                            color: Color(0xFFBCE9FF),
                            shape: BoxShape.circle,
                          ),
                          child: IconButton(
                            padding: EdgeInsets.zero,
                            icon: const Icon(Icons.mail_outline, color: Color(0xFF056683), size: 18),
                            onPressed: () => _launch('mailto:support@zeera.lb'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Middle Bento Card (Entry Voucher Ticket & QR Code)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFF96DEFF).withValues(alpha: 0.8), width: 1.5),
                  boxShadow: const <BoxShadow>[
                    BoxShadow(
                      color: Color(0x0A1B3A5C),
                      blurRadius: 20,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  children: <Widget>[
                    const Text(
                      'ENTRY VOUCHER',
                      style: TextStyle(
                        color: Color(0xFF73777F),
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.6,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      participant?.fullName ?? session.user?.fullName ?? 'Alex Johnson',
                      style: const TextStyle(
                        color: Color(0xFF002444),
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // QR Card Box
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFE3E2E5), width: 1),
                      ),
                      child: QrImageView(
                        data: qrData,
                        version: QrVersions.auto,
                        size: 160,
                        backgroundColor: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Validity Period Container
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF4F3F6),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        children: <Widget>[
                          const Text(
                            'VALIDITY PERIOD',
                            style: TextStyle(
                              color: Color(0xFF73777F),
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.6,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            ZeereFormatters.date(booking.scheduledAt),
                            style: const TextStyle(
                              color: Color(0xFF002444),
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            '06:00 AM — 10:00 AM',
                            style: TextStyle(
                              color: Color(0xFF1A1C1E),
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Action Buttons
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: FilledButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Sharing QR voucher...')),
                          );
                        },
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF002444),
                          shape: const StadiumBorder(),
                          elevation: 0,
                        ),
                        icon: const Icon(Icons.share_outlined, color: Colors.white, size: 18),
                        label: const Text(
                          'Share QR Voucher',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Downloading QR voucher...')),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF056683),
                          side: const BorderSide(color: Color(0xFF056683), width: 1.5),
                          shape: const StadiumBorder(),
                        ),
                        icon: const Icon(Icons.download_outlined, size: 18),
                        label: const Text(
                          'Download QR',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Cancel Reservation Button
              if (booking.status == 'PENDING' || booking.status == 'CONFIRMED')
                Center(
                  child: TextButton.icon(
                    onPressed: () => _confirmCancel(context, ref, booking),
                    icon: const Icon(Icons.cancel_outlined, color: Color(0xFFBA1A1A), size: 18),
                    label: const Text(
                      'Cancel Reservation',
                      style: TextStyle(
                        color: Color(0xFFBA1A1A),
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: 8),

              // Cancellation Policy Footnote
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  'Cancellations made less than 24 hours before the event are subject to a 50% convenience fee.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF73777F),
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          );
        },
      ),
    );
  }

  Future<void> _launch(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _confirmCancel(
    BuildContext context,
    WidgetRef ref,
    Booking booking,
  ) async {
    final shouldCancel = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) => AlertDialog(
        title: const Text('Cancel this booking?'),
        content: const Text(
          'This action cannot be undone. Associated QR codes will no longer be valid.',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep booking'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Cancel booking'),
          ),
        ],
      ),
    );
    if (shouldCancel != true) return;
    try {
      await ref.read(bookingRepositoryProvider).cancel(booking.id);
      ref.invalidate(bookingDetailProvider(id));
      ref.invalidate(bookingsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Booking cancelled.')));
      }
    } on Object catch (error) {
      if (context.mounted) {
        final message = error is ApiException ? error.message : 'Failed to cancel booking.';
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
      }
    }
  }
}

class QrScreen extends ConsumerWidget {
  const QrScreen({
    super.key,
    required this.bookingId,
    required this.participantId,
  });
  final int bookingId;
  final int participantId;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final future = ref
        .watch(bookingRepositoryProvider)
        .qr(bookingId, participantId);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Participant QR code'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.canPop() ? context.pop() : context.go('/bookings'),
        ),
      ),
      body: FutureBuilder<ParticipantQr>(
        future: future,
        builder: (BuildContext context, AsyncSnapshot<ParticipantQr> snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData) {
            return const EmptyState(
              message: 'No QR code is available for this participant.',
              icon: Icons.qr_code_2_outlined,
            );
          }
          final qr = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.all(24),
            children: <Widget>[
              Center(
                child: QrImageView(
                  data: qr.publicUrl,
                  version: QrVersions.auto,
                  size: 240,
                ),
              ),
              const SizedBox(height: 20),
              Center(
                child: _StatusBadge(status: qr.status),
              ),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  'Valid: ${ZeereFormatters.dateTime(qr.validFrom)} - ${ZeereFormatters.dateTime(qr.validUntil)}',
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => _open(qr.publicUrl),
                icon: const Icon(Icons.open_in_browser_outlined),
                label: const Text('Open public QR page'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class BookingCard extends ConsumerWidget {
  const BookingCard({super.key, required this.booking, this.isPrimary = false});
  final Booking booking;
  final bool isPrimary;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isConfirmed = booking.status == 'CONFIRMED' || booking.status == 'ACTIVE';
    final dotColor = isConfirmed ? const Color(0xFF10B981) : const Color(0xFFF5941F);

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFD6E4EC), width: 1.5),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x0A1B3A5C),
            blurRadius: 20,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => context.push('/bookings/${booking.id}'),
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              // Image with floating status badge
              Stack(
                children: <Widget>[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: NetworkImageBox(
                      image: null,
                      height: 155,
                      width: double.infinity,
                      label: booking.offeringTitle,
                    ),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(999),
                        boxShadow: const <BoxShadow>[
                          BoxShadow(
                            color: Color(0x1A000000),
                            blurRadius: 6,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: <Widget>[
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: dotColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            booking.status,
                            style: const TextStyle(
                              color: Color(0xFF1A1C1E),
                              fontWeight: FontWeight.w800,
                              fontSize: 10,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Offering Title
              Text(
                booking.offeringTitle,
                style: const TextStyle(
                  color: Color(0xFF002444),
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 3),

              // Provider Subtitle
              Text(
                booking.providerName,
                style: const TextStyle(
                  color: Color(0xFF056683),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),

              // Divider Line
              const Divider(color: Color(0xFFEEEDF1), height: 1, thickness: 1),
              const SizedBox(height: 12),

              // Date & Time Row
              Row(
                children: <Widget>[
                  const Icon(Icons.calendar_today_outlined, size: 16, color: Color(0xFF43474E)),
                  const SizedBox(width: 8),
                  Text(
                    ZeereFormatters.dateTime(booking.scheduledAt),
                    style: const TextStyle(
                      color: Color(0xFF1A1C1E),
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Participants & Price Row
              Row(
                children: <Widget>[
                  const Icon(Icons.group_outlined, size: 16, color: Color(0xFF43474E)),
                  const SizedBox(width: 8),
                  Text(
                    '${booking.participantCount} participant${booking.participantCount == 1 ? '' : 's'} · ${ZeereFormatters.money(booking.totalAmount, booking.currency)}',
                    style: const TextStyle(
                      color: Color(0xFF1A1C1E),
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Action Button
              SizedBox(
                width: double.infinity,
                height: 42,
                child: isPrimary
                    ? FilledButton(
                        onPressed: () => context.push('/bookings/${booking.id}'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF002444),
                          shape: const StadiumBorder(),
                          elevation: 0,
                        ),
                        child: const Text(
                          'View Details',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      )
                    : TextButton(
                        onPressed: () => context.push('/bookings/${booking.id}'),
                        child: const Text(
                          'View Details',
                          style: TextStyle(
                            color: Color(0xFF056683),
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookNewActivityCard extends StatelessWidget {
  const _BookNewActivityCard();

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go('/explore'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 30),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
        decoration: BoxDecoration(
          color: const Color(0xFFFAF9FC),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: const Color(0xFF96DEFF).withValues(alpha: 0.6),
            width: 1.5,
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          children: <Widget>[
            Container(
              width: 52,
              height: 52,
              decoration: const BoxDecoration(
                color: Color(0xFF96DEFF),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.add,
                color: Color(0xFF00637F),
                size: 26,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Book New Activity',
              style: TextStyle(
                color: Color(0xFF002444),
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Ready for your next island adventure? Explore curated experiences.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF43474E),
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
  final String status;
  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'ACTIVE' || 'CONFIRMED' => Colors.green,
      'PENDING' => Colors.orange,
      'USED' || 'COMPLETED' => Colors.blue,
      'CANCELLED' => Theme.of(context).colorScheme.error,
      _ => Colors.grey,
    };
    return Semantics(
      label: 'Status: $status',
      child: Chip(
        label: Text(status),
        side: BorderSide.none,
        backgroundColor: color.withValues(alpha: .14),
        labelStyle: TextStyle(color: color, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _GuestFields {
  final name = TextEditingController();
  final phone = TextEditingController();
  void dispose() {
    name.dispose();
    phone.dispose();
  }
}

class _GuestEditor extends StatelessWidget {
  const _GuestEditor({
    required this.index,
    required this.fields,
    required this.onRemove,
  });
  final int index;
  final _GuestFields fields;
  final VoidCallback onRemove;
  @override
  Widget build(BuildContext context) => Card(
    margin: const EdgeInsets.only(bottom: 12),
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        children: <Widget>[
          Row(
            children: <Widget>[
              Text(
                'Participant ${index + 1}',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const Spacer(),
              IconButton(
                onPressed: onRemove,
                icon: const Icon(Icons.delete_outline),
                tooltip: 'Remove participant',
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: fields.name,
            textCapitalization: TextCapitalization.words,
            validator: (String? value) =>
                Validators.required(value, label: 'Full name'),
            decoration: const InputDecoration(labelText: 'Full name'),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: fields.phone,
            keyboardType: TextInputType.phone,
            validator: Validators.phone,
            decoration: const InputDecoration(labelText: 'Phone number'),
          ),
        ],
      ),
    ),
  );
}

Future<void> _open(String link) async {
  final uri = Uri.tryParse(link);
  if (uri != null && await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
