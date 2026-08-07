import '../../../core/api/api_client.dart';
import '../domain/notification_models.dart';

class NotificationRepository {
  const NotificationRepository(this._api);
  final ApiClient _api;

  Future<NotificationListResult> getNotifications({int page = 1, int limit = 20}) async {
    final envelope = await _api.get(
      '/notifications',
      query: <String, Object?>{'page': page, 'limit': limit},
    );
    final map = asMap(envelope.data);
    final rawList = asMapList(map['notifications']);
    final notifications = rawList
        .map((item) => AppNotification.fromJson(item))
        .toList();
    final unreadCount = int.tryParse('${map['unread_count']}') ?? 0;
    return NotificationListResult(
      notifications: notifications,
      unreadCount: unreadCount,
    );
  }

  Future<int> getUnreadCount() async {
    final envelope = await _api.get('/notifications/unread-count');
    final map = asMap(envelope.data);
    return int.tryParse('${map['unread_count']}') ?? 0;
  }

  Future<void> markAsRead(int notificationId) async {
    await _api.patch('/notifications/$notificationId/read');
  }

  Future<void> markAllAsRead() async {
    await _api.patch('/notifications/read-all');
  }
}
