import '../config/app_config.dart';

String? resolveImageUrl(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  final value = raw.trim();
  if (Uri.tryParse(value)?.hasScheme ?? false) return value;
  final base = AppConfig.backendOrigin.replaceFirst(RegExp(r'/$'), '');
  return '$base/${value.replaceFirst(RegExp(r'^/+'), '')}';
}
