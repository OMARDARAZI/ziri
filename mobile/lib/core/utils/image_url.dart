import '../config/app_config.dart';

bool isVideoUrl(String? raw) {
  if (raw == null || raw.trim().isEmpty) return false;
  final lower = raw.trim().toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.mkv');
}

String? resolveImageUrl(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  final value = raw.trim();
  if (value.endsWith('.svg') || value == '/images/placeholder.svg') {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80';
  }
  if (Uri.tryParse(value)?.hasScheme ?? false) {
    final parsed = Uri.parse(value);
    final path = parsed.path.replaceFirst(RegExp(r'^/+'), '');
    if (path.startsWith('uploads/')) {
      return '${AppConfig.backendOrigin}/api/v1/$path';
    }
    return value.replaceFirst(RegExp(r'https?://(localhost|10\.0\.2\.2|127\.0\.0\.1)(:\d+)?'), AppConfig.backendOrigin);
  }
  final base = AppConfig.backendOrigin.replaceFirst(RegExp(r'/$'), '');
  final cleanPath = value.replaceFirst(RegExp(r'^/+'), '');
  if (cleanPath.startsWith('uploads/')) {
    return '$base/api/v1/$cleanPath';
  }
  return '$base/$cleanPath';
}
