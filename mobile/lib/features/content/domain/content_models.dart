class Story {
  const Story({
    required this.id,
    required this.title,
    required this.content,
    required this.image,
    required this.storyTime,
  });

  factory Story.fromJson(Map<String, dynamic> json) => Story(
    id: int.tryParse('${json['id']}') ?? 0,
    title: '${json['title'] ?? ''}',
    content: '${json['content'] ?? ''}',
    image: json['image'] as String?,
    storyTime: json['story_time'] as String?,
  );
  final int id;
  final String title;
  final String content;
  final String? image;
  final String? storyTime;
}

class NewsArticle {
  const NewsArticle({
    required this.id,
    required this.title,
    required this.content,
    required this.image,
    required this.publishedAt,
  });

  factory NewsArticle.fromJson(Map<String, dynamic> json) => NewsArticle(
    id: int.tryParse('${json['id']}') ?? 0,
    title: '${json['title'] ?? ''}',
    content: '${json['content'] ?? ''}',
    image: json['image'] as String?,
    publishedAt: json['published_at'] as String?,
  );
  final int id;
  final String title;
  final String content;
  final String? image;
  final String? publishedAt;
}

class Event {
  const Event({
    required this.id,
    required this.title,
    required this.description,
    required this.image,
    required this.eventDate,
    required this.startTime,
    required this.endTime,
    required this.location,
  });

  factory Event.fromJson(Map<String, dynamic> json) => Event(
    id: int.tryParse('${json['id']}') ?? 0,
    title: '${json['title'] ?? ''}',
    description: '${json['description'] ?? ''}',
    image: json['image'] as String?,
    eventDate: json['event_date'] as String?,
    startTime: json['start_time'] as String?,
    endTime: json['end_time'] as String?,
    location: json['location'] as String?,
  );
  final int id;
  final String title;
  final String description;
  final String? image;
  final String? eventDate;
  final String? startTime;
  final String? endTime;
  final String? location;
}

class MenuItem {
  const MenuItem({
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    this.image,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) => MenuItem(
    name: '${json['name'] ?? ''}',
    description: '${json['description'] ?? ''}',
    price: '${json['price'] ?? ''}',
    category: '${json['category'] ?? 'Menu'}',
    image: json['image'] as String?,
  );

  final String name;
  final String description;
  final String price;
  final String category;
  final String? image;
}

class Restaurant {
  const Restaurant({
    required this.id,
    required this.name,
    required this.description,
    required this.cuisineType,
    required this.image,
    required this.openingTime,
    required this.closingTime,
    required this.location,
    required this.phone,
    required this.rating,
    required this.priceRange,
    required this.menuItems,
  });

  factory Restaurant.fromJson(Map<String, dynamic> json) {
    List<MenuItem> items = <MenuItem>[];
    if (json['menu_items'] != null) {
      if (json['menu_items'] is List) {
        items = (json['menu_items'] as List)
            .whereType<Map>()
            .map((Map e) => MenuItem.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }
    }

    return Restaurant(
      id: int.tryParse('${json['id']}') ?? 0,
      name: '${json['name'] ?? ''}',
      description: '${json['description'] ?? ''}',
      cuisineType: '${json['cuisine_type'] ?? ''}',
      image: json['image'] as String?,
      openingTime: json['opening_time'] as String?,
      closingTime: json['closing_time'] as String?,
      location: json['location'] as String?,
      phone: json['phone'] as String?,
      rating: double.tryParse('${json['rating']}') ?? 4.8,
      priceRange: '${json['price_range'] ?? '\$\$'}',
      menuItems: items,
    );
  }

  final int id;
  final String name;
  final String description;
  final String cuisineType;
  final String? image;
  final String? openingTime;
  final String? closingTime;
  final String? location;
  final String? phone;
  final double rating;
  final String priceRange;
  final List<MenuItem> menuItems;
}

class SafetyTip {
  const SafetyTip({
    required this.id,
    required this.title,
    required this.content,
    required this.image,
  });

  factory SafetyTip.fromJson(Map<String, dynamic> json) => SafetyTip(
    id: int.tryParse('${json['id']}') ?? 0,
    title: '${json['title'] ?? ''}',
    content: '${json['content'] ?? ''}',
    image: json['image'] as String?,
  );
  final int id;
  final String title;
  final String content;
  final String? image;
}

class Weather {
  const Weather({
    required this.location,
    required this.temperature,
    required this.condition,
    required this.description,
    required this.weatherDate,
    required this.humidity,
    required this.windSpeed,
    required this.icon,
  });

  factory Weather.fromJson(Map<String, dynamic> json) => Weather(
    location: '${json['location'] ?? ''}',
    temperature: _number(json['temperature']),
    condition: '${json['condition'] ?? ''}',
    description: '${json['description'] ?? ''}',
    weatherDate: json['weather_date'] as String?,
    humidity: _numberOrNull(json['humidity']),
    windSpeed: _numberOrNull(json['wind_speed']),
    icon: json['icon'] as String?,
  );
  final String location;
  final double temperature;
  final String condition;
  final String description;
  final String? weatherDate;
  final double? humidity;
  final double? windSpeed;
  final String? icon;
}

class HomeContent {
  const HomeContent({
    required this.stories,
    required this.news,
    required this.events,
    required this.safetyTips,
    required this.weather,
  });

  factory HomeContent.fromJson(Map<String, dynamic> json) => HomeContent(
    stories: ((json['stories'] as List?) ?? const <Object?>[])
        .whereType<Map>()
        .map((Map e) => Story.fromJson(Map<String, dynamic>.from(e)))
        .toList(growable: false),
    news: ((json['news'] as List?) ?? const <Object?>[])
        .whereType<Map>()
        .map((Map e) => NewsArticle.fromJson(Map<String, dynamic>.from(e)))
        .toList(growable: false),
    events: ((json['events'] as List?) ?? const <Object?>[])
        .whereType<Map>()
        .map((Map e) => Event.fromJson(Map<String, dynamic>.from(e)))
        .toList(growable: false),
    safetyTips: ((json['safety_tips'] as List?) ?? const <Object?>[])
        .whereType<Map>()
        .map((Map e) => SafetyTip.fromJson(Map<String, dynamic>.from(e)))
        .toList(growable: false),
    weather: json['weather'] is Map
        ? Weather.fromJson(Map<String, dynamic>.from(json['weather'] as Map))
        : null,
  );
  final List<Story> stories;
  final List<NewsArticle> news;
  final List<Event> events;
  final List<SafetyTip> safetyTips;
  final Weather? weather;
}

double _number(Object? value) => double.tryParse('$value') ?? 0;
double? _numberOrNull(Object? value) =>
    value == null ? null : double.tryParse('$value');
