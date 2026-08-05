import 'package:intl/intl.dart';

class ZeereFormatters {
  const ZeereFormatters._();

  static String money(Object? raw, String currency) {
    final value = raw is num ? raw.toDouble() : double.tryParse('$raw') ?? 0;
    return currency == 'LBP'
        ? '${NumberFormat('#,##0.##').format(value)} LBP'
        : NumberFormat.currency(symbol: r'$', decimalDigits: 2).format(value);
  }

  static String date(String? raw, {String pattern = 'MMMM d, yyyy'}) {
    if (raw == null || raw.isEmpty) return '—';
    final sanitized = raw.replaceFirst(' ', 'T');
    final parsed = DateTime.tryParse(sanitized) ?? DateTime.tryParse(raw);
    return parsed == null ? raw : DateFormat(pattern).format(parsed);
  }

  static String time(String? raw) {
    if (raw == null || raw.isEmpty) return '—';
    final parsed = DateTime.tryParse(raw);
    if (parsed != null) return DateFormat('h:mm a').format(parsed);
    final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(raw);
    if (match == null) return raw;
    final hour = int.parse(match.group(1)!);
    final minute = int.parse(match.group(2)!);
    return DateFormat('h:mm a').format(DateTime(2000, 1, 1, hour, minute));
  }

  static String dateTime(String? raw) => date(raw, pattern: 'd MMM y, h:mm a');

  static String relativeTime(String? raw) {
    if (raw == null || raw.isEmpty) return '1 hour ago';
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return raw;

    final now = DateTime.now();
    final difference = now.difference(parsed);

    if (difference.inSeconds < 45) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      final mins = difference.inMinutes;
      return '$mins ${mins == 1 ? 'min' : 'mins'} ago';
    } else if (difference.inHours < 24) {
      final hours = difference.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inDays < 30) {
      final days = difference.inDays;
      return '$days ${days == 1 ? 'day' : 'days'} ago';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else {
      final years = (difference.inDays / 365).floor();
      return '$years ${years == 1 ? 'year' : 'years'} ago';
    }
  }
}
