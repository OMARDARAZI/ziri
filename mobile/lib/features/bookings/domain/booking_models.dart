class BookingParticipant {
  const BookingParticipant({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.isOwner,
    required this.qr,
  });
  factory BookingParticipant.fromJson(Map<String, dynamic> json) =>
      BookingParticipant(
        id: int.tryParse('${json['id']}') ?? 0,
        fullName: '${json['full_name'] ?? ''}',
        phone: '${json['phone'] ?? ''}',
        isOwner: json['is_owner'] == true || json['is_owner'] == 1,
        qr: json['qr'] is Map
            ? ParticipantQr.fromJson(
                Map<String, dynamic>.from(json['qr'] as Map),
              )
            : null,
      );
  final int id;
  final String fullName;
  final String phone;
  final bool isOwner;
  final ParticipantQr? qr;
}

class ParticipantQr {
  const ParticipantQr({
    required this.id,
    required this.status,
    required this.publicUrl,
    required this.validFrom,
    required this.validUntil,
    required this.usedAt,
    required this.expiredReason,
  });
  factory ParticipantQr.fromJson(Map<String, dynamic> json) => ParticipantQr(
    id: int.tryParse('${json['id']}') ?? 0,
    status: '${json['status'] ?? 'UNKNOWN'}',
    publicUrl: '${json['public_url'] ?? ''}',
    validFrom: json['valid_from'] as String?,
    validUntil: json['valid_until'] as String?,
    usedAt: json['used_at'] as String?,
    expiredReason: json['expired_reason'] as String?,
  );
  final int id;
  final String status;
  final String publicUrl;
  final String? validFrom;
  final String? validUntil;
  final String? usedAt;
  final String? expiredReason;
}

class Booking {
  const Booking({
    required this.id,
    required this.bookingCode,
    required this.offeringId,
    required this.offeringTitle,
    required this.offeringType,
    required this.providerName,
    required this.scheduledAt,
    required this.currency,
    required this.unitPrice,
    required this.participantCount,
    required this.totalAmount,
    required this.status,
    required this.notes,
    required this.participants,
  });
  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
    id: int.tryParse('${json['id']}') ?? 0,
    bookingCode: '${json['booking_code'] ?? ''}',
    offeringId: int.tryParse('${json['offering_id']}') ?? 0,
    offeringTitle: '${json['offering_title'] ?? ''}',
    offeringType: '${json['offering_type'] ?? ''}',
    providerName: '${json['provider_name'] ?? ''}',
    scheduledAt: json['scheduled_at'] as String?,
    currency: '${json['currency'] ?? 'USD'}',
    unitPrice: double.tryParse('${json['unit_price']}') ?? 0,
    participantCount: int.tryParse('${json['participant_count']}') ?? 0,
    totalAmount: double.tryParse('${json['total_amount']}') ?? 0,
    status: '${json['status'] ?? 'UNKNOWN'}',
    notes: json['notes'] as String?,
    participants: ((json['participants'] as List?) ?? const <Object?>[])
        .whereType<Map>()
        .map(
          (Map item) =>
              BookingParticipant.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList(growable: false),
  );
  final int id;
  final String bookingCode;
  final int offeringId;
  final String offeringTitle;
  final String offeringType;
  final String providerName;
  final String? scheduledAt;
  final String currency;
  final double unitPrice;
  final int participantCount;
  final double totalAmount;
  final String status;
  final String? notes;
  final List<BookingParticipant> participants;
}

class QrValidationResult {
  const QrValidationResult({
    required this.participantName,
    required this.participantPhone,
    required this.bookingCode,
    required this.offeringTitle,
    required this.providerName,
    required this.scheduledAt,
    required this.qrStatus,
  });

  factory QrValidationResult.fromJson(Map<String, dynamic> json) {
    final participant = json['participant'] is Map
        ? Map<String, dynamic>.from(json['participant'] as Map)
        : <String, dynamic>{};
    final booking = json['booking'] is Map
        ? Map<String, dynamic>.from(json['booking'] as Map)
        : <String, dynamic>{};

    return QrValidationResult(
      participantName: '${participant['full_name'] ?? ''}',
      participantPhone: '${participant['phone'] ?? ''}',
      bookingCode: '${booking['booking_code'] ?? ''}',
      offeringTitle: '${booking['offering_title'] ?? ''}',
      providerName: '${booking['provider_name'] ?? ''}',
      scheduledAt: booking['scheduled_at'] as String?,
      qrStatus: '${json['qr_status'] ?? 'USED'}',
    );
  }

  final String participantName;
  final String participantPhone;
  final String bookingCode;
  final String offeringTitle;
  final String providerName;
  final String? scheduledAt;
  final String qrStatus;
}

