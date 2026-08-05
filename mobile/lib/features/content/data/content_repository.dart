import '../../../core/api/api_client.dart';
import '../../../core/api/api_models.dart';
import '../domain/content_models.dart';

class PageResult<T> {
  const PageResult({required this.items, this.pagination});
  final List<T> items;
  final Pagination? pagination;
}

class ContentRepository {
  const ContentRepository(this._api);
  final ApiClient _api;

  Future<HomeContent> home() async =>
      HomeContent.fromJson(asMap((await _api.get('/home')).data));

  Future<PageResult<Story>> stories({int page = 1}) =>
      _list('/stories', page, Story.fromJson);
  Future<PageResult<NewsArticle>> news({int page = 1}) =>
      _list('/news', page, NewsArticle.fromJson);
  Future<PageResult<Event>> events({int page = 1}) =>
      _list('/events', page, Event.fromJson);
  Future<PageResult<Restaurant>> restaurants({int page = 1}) =>
      _list('/restaurants', page, Restaurant.fromJson);
  Future<PageResult<SafetyTip>> safetyTips({int page = 1}) =>
      _list('/safety-tips', page, SafetyTip.fromJson);
  Future<PageResult<Weather>> weather({int page = 1}) =>
      _list('/weather', page, Weather.fromJson);

  Future<T> detail<T>(
    String resource,
    int id,
    T Function(Map<String, dynamic>) parse,
  ) async {
    return parse(asMap((await _api.get('/$resource/$id')).data));
  }

  Future<PageResult<T>> _list<T>(
    String path,
    int page,
    T Function(Map<String, dynamic>) parse,
  ) async {
    final response = await _api.get(
      path,
      query: <String, Object?>{'page': page, 'limit': 20},
    );
    return PageResult(
      items: asMapList(response.data).map(parse).toList(growable: false),
      pagination: response.pagination,
    );
  }
}
