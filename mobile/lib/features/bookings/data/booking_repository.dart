import '../../../core/api/api_client.dart';
import '../../content/data/content_repository.dart';
import '../domain/booking_models.dart';

class BookingRepository {
  const BookingRepository(this._api);
  final ApiClient _api;

  Future<Booking> create({
    required int offeringId,
    required DateTime scheduledAt,
    required String currency,
    required bool includeCustomer,
    required List<Map<String, String>> participants,
    String? notes,
  }) async {
    final response = await _api.post(
      '/bookings',
      data: <String, Object?>{
        'offering_id': offeringId,
        'scheduled_at': scheduledAt.toUtc().toIso8601String(),
        'currency': currency,
        'include_customer': includeCustomer,
        'participants': participants,
        if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
      },
    );
    return Booking.fromJson(asMap(response.data));
  }

  Future<PageResult<Booking>> bookings({int page = 1}) async {
    final response = await _api.get(
      '/bookings',
      query: <String, Object?>{'page': page, 'limit': 20},
    );
    return PageResult(
      items: asMapList(
        response.data,
      ).map(Booking.fromJson).toList(growable: false),
      pagination: response.pagination,
    );
  }

  Future<Booking> booking(int id) async =>
      Booking.fromJson(asMap((await _api.get('/bookings/$id')).data));

  Future<Booking> cancel(int id) async =>
      Booking.fromJson(asMap((await _api.post('/bookings/$id/cancel')).data));

  Future<ParticipantQr> qr(int bookingId, int participantId) async {
    final data = asMap(
      (await _api.get(
        '/bookings/$bookingId/participants/$participantId/qr',
      )).data,
    );
    return ParticipantQr.fromJson(asMap(data['qr']));
  }

  Future<QrValidationResult> validateQrToken(String token) async {
    final response = await _api.post(
      '/provider/qr/validate',
      data: <String, Object?>{'token': token.trim()},
    );
    return QrValidationResult.fromJson(asMap(response.data));
  }
}

