class AppNotification {
  const AppNotification({
    required this.id,
    required this.userId,
    required this.title,
    required this.body,
    required this.type,
    this.referenceId,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: int.tryParse('${json['id']}') ?? 0,
        userId: int.tryParse('${json['user_id']}') ?? 0,
        title: '${json['title'] ?? ''}',
        body: '${json['body'] ?? ''}',
        type: '${json['type'] ?? 'SYSTEM'}',
        referenceId: json['reference_id'] != null
            ? int.tryParse('${json['reference_id']}')
            : null,
        isRead: json['is_read'] == true || json['is_read'] == 1,
        createdAt: DateTime.tryParse('${json['created_at']}') ?? DateTime.now(),
      );

  final int id;
  final int userId;
  final String title;
  final String body;
  final String type;
  final int? referenceId;
  final bool isRead;
  final DateTime createdAt;
}

class NotificationListResult {
  const NotificationListResult({
    required this.notifications,
    required this.unreadCount,
  });

  final List<AppNotification> notifications;
  final int unreadCount;
}
