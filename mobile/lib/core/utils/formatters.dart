import 'package:intl/intl.dart';

class ZeereFormatters {
  const ZeereFormatters._();

  static String money(Object? raw, String currency) {
    final value = raw is num ? raw.toDouble() : double.tryParse('$raw') ?? 0;
    return currency == 'LBP'
        ? '${NumberFormat('#,##0.##').format(value)} LBP'
        : NumberFormat.currency(symbol: r'$', decimalDigits: 2).format(value);
  }

  static String date(String? raw, {String pattern = 'd MMM y'}) {
    if (raw == null || raw.isEmpty) return '—';
    final parsed = DateTime.tryParse(raw);
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
}
