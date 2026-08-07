import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app_providers.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/common_widgets.dart';
import '../domain/notification_models.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(userNotificationsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF1B3A5C), size: 18),
          onPressed: () => context.canPop() ? context.pop() : context.go('/home'),
        ),
        title: const Text(
          'Notifications',
          style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF1B3A5C)),
        ),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.done_all, color: Color(0xFF0F5B78)),
            tooltip: 'Mark all as read',
            onPressed: () async {
              await ref.read(notificationRepositoryProvider).markAllAsRead();
              ref.invalidate(userNotificationsProvider);
              ref.invalidate(unreadNotificationCountProvider);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('All notifications marked as read.')),
                );
              }
            },
          ),
        ],
      ),
      body: AsyncContent<NotificationListResult>(
        value: notificationsAsync,
        onRetry: () => ref.invalidate(userNotificationsProvider),
        builder: (NotificationListResult data) {
          if (data.notifications.isEmpty) {
            return const EmptyState(
              message: 'You have no notifications right now.',
              icon: Icons.notifications_none_outlined,
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(userNotificationsProvider);
              ref.invalidate(unreadNotificationCountProvider);
            },
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              itemCount: data.notifications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (BuildContext context, int index) {
                final item = data.notifications[index];
                return _NotificationTile(
                  notification: item,
                  onTap: () async {
                    if (!item.isRead) {
                      await ref
                          .read(notificationRepositoryProvider)
                          .markAsRead(item.id);
                      ref.invalidate(userNotificationsProvider);
                      ref.invalidate(unreadNotificationCountProvider);
                    }
                    if (item.type == 'BOOKING' && item.referenceId != null && context.mounted) {
                      context.push('/bookings/${item.referenceId}');
                    }
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.onTap,
  });

  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color iconColor;

    switch (notification.type.toUpperCase()) {
      case 'BOOKING':
        icon = Icons.confirmation_number_outlined;
        iconColor = const Color(0xFF0F5B78);
        break;
      case 'CHECKIN':
        icon = Icons.qr_code_2;
        iconColor = Colors.green.shade700;
        break;
      default:
        icon = Icons.notifications_active_outlined;
        iconColor = const Color(0xFF2E7D9A);
        break;
    }

    return Card(
      elevation: notification.isRead ? 0.5 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: notification.isRead
              ? const Color(0xFFE2E8F0)
              : const Color(0xFF0F5B78).withOpacity(0.3),
          width: notification.isRead ? 1 : 1.5,
        ),
      ),
      color: notification.isRead ? Colors.white : const Color(0xFFF0F9FF),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: iconColor.withOpacity(0.12),
          ),
          child: Icon(icon, color: iconColor, size: 22),
        ),
        title: Row(
          children: <Widget>[
            Expanded(
              child: Text(
                notification.title,
                style: TextStyle(
                  fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.bold,
                  fontSize: 15,
                  color: const Color(0xFF1B3A5C),
                ),
              ),
            ),
            if (!notification.isRead)
              Container(
                margin: const EdgeInsets.only(left: 6),
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xFF0F5B78),
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                notification.body,
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF475569),
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                ZeereFormatters.relativeTime(notification.createdAt.toIso8601String()),
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF94A3B8),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
