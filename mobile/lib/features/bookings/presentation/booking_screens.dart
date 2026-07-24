import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
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
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('My bookings')),
    body: Column(
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.all(16),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SegmentedButton<String>(
              segments: const <ButtonSegment<String>>[
                ButtonSegment(value: 'ALL', label: Text('All')),
                ButtonSegment(value: 'PENDING', label: Text('Current')),
                ButtonSegment(value: 'COMPLETED', label: Text('Past')),
                ButtonSegment(value: 'CANCELLED', label: Text('Cancelled')),
              ],
              selected: <String>{_filter},
              onSelectionChanged: (Set<String> value) =>
                  setState(() => _filter = value.first),
            ),
          ),
        ),
        Expanded(
          child: AsyncContent<PageResult<Booking>>(
            value: ref.watch(bookingsProvider),
            onRetry: () => ref.invalidate(bookingsProvider),
            builder: (PageResult<Booking> result) {
              final items = _filter == 'ALL'
                  ? result.items
                  : result.items
                        .where(
                          (Booking booking) => _filter == 'PENDING'
                              ? booking.status == 'PENDING' ||
                                    booking.status == 'CONFIRMED'
                              : booking.status == _filter,
                        )
                        .toList(growable: false);
              return RefreshIndicator(
                onRefresh: () async => ref.invalidate(bookingsProvider),
                child: items.isEmpty
                    ? ListView(
                        children: <Widget>[
                          SizedBox(
                            height: 260,
                            child: EmptyState(
                              message: 'No bookings in this section.',
                              icon: Icons.calendar_month_outlined,
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
                        itemCount: items.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (BuildContext context, int index) =>
                            BookingCard(booking: items[index]),
                      ),
              );
            },
          ),
        ),
      ],
    ),
  );
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
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('New booking')),
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
              'Zeere will add your account details as a participant.',
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
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    appBar: AppBar(title: const Text('Booking details')),
    body: AsyncContent<Booking>(
      value: ref.watch(bookingDetailProvider(id)),
      onRetry: () => ref.invalidate(bookingDetailProvider(id)),
      builder: (Booking booking) => ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: Text(
                          booking.offeringTitle,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ),
                      _StatusBadge(status: booking.status),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(booking.providerName),
                  const SizedBox(height: 14),
                  Text('Reference: ${booking.bookingCode}'),
                  Text(
                    'Scheduled: ${ZeereFormatters.dateTime(booking.scheduledAt)}',
                  ),
                  Text(
                    '${booking.participantCount} participant${booking.participantCount == 1 ? '' : 's'} - ${ZeereFormatters.money(booking.totalAmount, booking.currency)}',
                  ),
                ],
              ),
            ),
          ),
          if (booking.notes != null && booking.notes!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(booking.notes!),
                ),
              ),
            ),
          const SizedBox(height: 20),
          Text(
            'Participant QR codes',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          ...booking.participants.map(
            (BookingParticipant participant) => Card(
              child: ListTile(
                onTap: participant.qr == null
                    ? null
                    : () => context.go(
                        '/bookings/${booking.id}/participants/${participant.id}/qr',
                      ),
                leading: const Icon(Icons.qr_code_2_outlined),
                title: Text(participant.fullName),
                subtitle: Text(
                  participant.isOwner ? 'Account holder' : participant.phone,
                ),
                trailing: participant.qr == null
                    ? const Text('Unavailable')
                    : _StatusBadge(status: participant.qr!.status),
              ),
            ),
          ),
          if (booking.status == 'PENDING' || booking.status == 'CONFIRMED')
            Padding(
              padding: const EdgeInsets.only(top: 20),
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Theme.of(context).colorScheme.error,
                ),
                onPressed: () => _confirmCancel(context, ref, booking),
                icon: const Icon(Icons.cancel_outlined),
                label: const Text('Cancel booking'),
              ),
            ),
        ],
      ),
    ),
  );

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
          FilledButton(
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
    } on ApiException catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
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
      appBar: AppBar(title: const Text('Participant QR code')),
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
                  size: 250,
                  semanticsLabel: 'Participant QR code',
                ),
              ),
              const SizedBox(height: 24),
              Center(child: _StatusBadge(status: qr.status)),
              const SizedBox(height: 16),
              Text(
                'This code is issued and validated by Zeere. Its status is ${qr.status.toLowerCase()}.',
                textAlign: TextAlign.center,
              ),
              if (qr.validFrom != null || qr.validUntil != null)
                Padding(
                  padding: const EdgeInsets.only(top: 14),
                  child: Text(
                    'Valid ${ZeereFormatters.dateTime(qr.validFrom)} to ${ZeereFormatters.dateTime(qr.validUntil)}',
                    textAlign: TextAlign.center,
                  ),
                ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () => _share(qr.publicUrl),
                icon: const Icon(Icons.ios_share_outlined),
                label: const Text('Share QR link'),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
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

class BookingCard extends StatelessWidget {
  const BookingCard({super.key, required this.booking});
  final Booking booking;
  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      onTap: () => context.go('/bookings/${booking.id}'),
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    booking.offeringTitle,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                _StatusBadge(status: booking.status),
              ],
            ),
            const SizedBox(height: 5),
            Text(booking.providerName),
            const SizedBox(height: 8),
            Text(ZeereFormatters.dateTime(booking.scheduledAt)),
            const SizedBox(height: 4),
            Text(
              '${booking.participantCount} participant${booking.participantCount == 1 ? '' : 's'} · ${ZeereFormatters.money(booking.totalAmount, booking.currency)}',
            ),
          ],
        ),
      ),
    ),
  );
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

Future<void> _share(String link) => SharePlus.instance.share(
  ShareParams(text: link, subject: 'My Zeere QR link'),
);
Future<void> _open(String link) async {
  final uri = Uri.tryParse(link);
  if (uri != null && await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
