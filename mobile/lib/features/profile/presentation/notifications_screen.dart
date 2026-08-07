import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/widgets/common_widgets.dart';
import '../../../../../core/providers/session_provider.dart';
import '../../../../../core/services/api_exception.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  bool _loading = false;

  Future<void> _toggle(bool value) async {
    setState(() => _loading = true);
    try {
      await ref.read(sessionProvider.notifier).updateNotificationPreference(value);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notification preference updated')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final enabled = ref.watch(sessionProvider).user?.notificationsEnabled ?? false;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Settings'),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1B3A5C)),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          ListTile(
            title: const Text('Enable notifications'),
            trailing: _loading
                ? const CircularProgressIndicator()
                : Switch(
                    value: enabled,
                    onChanged: (v) => _toggle(v),
                  ),
          ),
          const SizedBox(height: 20),
          const Text(
            'You will receive push notifications for important updates.',
            style: TextStyle(fontSize: 14, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}
