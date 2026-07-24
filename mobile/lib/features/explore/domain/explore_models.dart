class ProviderProfile {
  const ProviderProfile({
    required this.id,
    required this.businessName,
    required this.description,
    required this.logo,
    required this.coverImage,
    required this.phone,
    required this.email,
    required this.address,
    this.offerings = const [],
  });

  factory ProviderProfile.fromJson(Map<String, dynamic> json) =>
      ProviderProfile(
        id: int.tryParse('${json['id']}') ?? 0,
        businessName: '${json['business_name'] ?? ''}',
        description: json['description'] as String?,
        logo: json['logo'] as String?,
        coverImage: json['cover_image'] as String?,
        phone: json['phone'] as String?,
        email: json['email'] as String?,
        address: json['address'] as String?,
        offerings: ((json['offerings'] as List?) ?? const <Object?>[])
            .whereType<Map>()
            .map(
              (Map item) => Offering.fromJson(Map<String, dynamic>.from(item)),
            )
            .toList(growable: false),
      );
  final int id;
  final String businessName;
  final String? description;
  final String? logo;
  final String? coverImage;
  final String? phone;
  final String? email;
  final String? address;
  final List<Offering> offerings;
}

class Offering {
  const Offering({
    required this.id,
    required this.providerId,
    required this.type,
    required this.title,
    required this.description,
    required this.image,
    required this.priceUsd,
    required this.priceLbp,
    required this.durationMinutes,
    required this.capacity,
    required this.location,
    required this.providerName,
  });

  factory Offering.fromJson(Map<String, dynamic> json) => Offering(
    id: int.tryParse('${json['id']}') ?? 0,
    providerId: int.tryParse('${json['provider_id']}') ?? 0,
    type: '${json['type'] ?? 'SERVICE'}',
    title: '${json['title'] ?? ''}',
    description: '${json['description'] ?? ''}',
    image: json['image'] as String?,
    priceUsd: _price(json['price_usd']),
    priceLbp: _price(json['price_lbp']),
    durationMinutes: int.tryParse('${json['duration_minutes']}'),
    capacity: int.tryParse('${json['capacity']}'),
    location: json['location'] as String?,
    providerName: '${json['provider_name'] ?? ''}',
  );
  final int id;
  final int providerId;
  final String type;
  final String title;
  final String description;
  final String? image;
  final double priceUsd;
  final double priceLbp;
  final int? durationMinutes;
  final int? capacity;
  final String? location;
  final String providerName;
}

double _price(Object? value) => double.tryParse('$value') ?? 0;
