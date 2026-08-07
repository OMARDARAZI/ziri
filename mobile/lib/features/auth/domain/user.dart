class User {
  const User({
    required this.id,
    required this.role,
    required this.fullName,
    required this.phone,
    required this.isActive,
    this.notificationsEnabled = true,
    this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: int.tryParse('${json['id']}') ?? 0,
    role: '${json['role'] ?? ''}',
    fullName: '${json['full_name'] ?? ''}',
    phone: '${json['phone'] ?? ''}',
    isActive: json['is_active'] == true || json['is_active'] == 1,
    notificationsEnabled: json['notifications_enabled'] == null ||
        json['notifications_enabled'] == true ||
        json['notifications_enabled'] == 1,
    avatarUrl: json['avatar_url'] as String?,
  );

  final int id;
  final String role;
  final String fullName;
  final String phone;
  final bool isActive;
  final bool notificationsEnabled;
  final String? avatarUrl;

  Map<String, Object> profilePayload({
    required String fullName,
    required String phone,
    String? avatarUrl,
  }) {
    final map = <String, Object>{'full_name': fullName, 'phone': phone};
    if (avatarUrl != null) map['avatar_url'] = avatarUrl;
    return map;
  }
}
