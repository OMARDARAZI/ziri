import '../../../core/api/api_client.dart';
import '../../content/data/content_repository.dart';
import '../domain/explore_models.dart';

class ExploreRepository {
  const ExploreRepository(this._api);
  final ApiClient _api;

  Future<PageResult<ProviderProfile>> providers({int page = 1}) async {
    final response = await _api.get(
      '/providers',
      query: <String, Object?>{'page': page, 'limit': 20},
    );
    return PageResult(
      items: asMapList(
        response.data,
      ).map(ProviderProfile.fromJson).toList(growable: false),
      pagination: response.pagination,
    );
  }

  Future<ProviderProfile> provider(int id) async =>
      ProviderProfile.fromJson(asMap((await _api.get('/providers/$id')).data));

  Future<PageResult<Offering>> offerings({String? type, int page = 1}) async {
    final response = await _api.get(
      '/offerings',
      query: <String, Object?>{'page': page, 'limit': 20, 'type': ?type},
    );
    return PageResult(
      items: asMapList(
        response.data,
      ).map(Offering.fromJson).toList(growable: false),
      pagination: response.pagination,
    );
  }

  Future<Offering> offering(int id) async =>
      Offering.fromJson(asMap((await _api.get('/offerings/$id')).data));
}
