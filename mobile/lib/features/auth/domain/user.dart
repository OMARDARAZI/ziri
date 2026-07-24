class User {
  const User({
    required this.id,
    required this.role,
    required this.fullName,
    required this.phone,
    required this.isActive,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: int.tryParse('${json['id']}') ?? 0,
    role: '${json['role'] ?? ''}',
    fullName: '${json['full_name'] ?? ''}',
    phone: '${json['phone'] ?? ''}',
    isActive: json['is_active'] == true || json['is_active'] == 1,
  );

  final int id;
  final String role;
  final String fullName;
  final String phone;
  final bool isActive;

  Map<String, Object> profilePayload({
    required String fullName,
    required String phone,
  }) => <String, Object>{'full_name': fullName, 'phone': phone};
}
