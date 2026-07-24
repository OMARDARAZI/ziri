class Validators {
  const Validators._();

  static String? required(String? value, {String label = 'This field'}) =>
      value == null || value.trim().isEmpty ? '$label is required' : null;

  static String? phone(String? value) {
    if (required(value, label: 'Phone number') != null) {
      return 'Phone number is required';
    }
    final normalized = value!.trim().replaceAll(RegExp(r'[\s().-]'), '');
    return RegExp(r'^\+?[1-9]\d{6,14}$').hasMatch(normalized)
        ? null
        : 'Enter a valid phone number';
  }

  static String normalizePhone(String value) {
    final normalized = value.trim().replaceAll(RegExp(r'[\s().-]'), '');
    return normalized.startsWith('+') ? normalized : '+$normalized';
  }

  static String? password(String? value) => value == null || value.length < 8
      ? 'Password must be at least 8 characters'
      : null;
}
