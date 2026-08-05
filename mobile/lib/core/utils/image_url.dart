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
    return value.replaceFirst(RegExp(r'https?://(localhost|10\.0\.2\.2|127\.0\.0\.1):3000'), AppConfig.backendOrigin);
  }
  final base = AppConfig.backendOrigin.replaceFirst(RegExp(r'/$'), '');
  return '$base/${value.replaceFirst(RegExp(r'^/+'), '')}';
}
