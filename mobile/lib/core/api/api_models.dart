import 'package:json_annotation/json_annotation.dart';

part 'api_models.g.dart';

@JsonSerializable()
class Pagination {
  const Pagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.pages,
  });

  factory Pagination.fromJson(Map<String, dynamic> json) =>
      _$PaginationFromJson(json);

  final int page;
  final int limit;
  final int total;
  final int pages;

  Map<String, dynamic> toJson() => _$PaginationToJson(this);
}

@JsonSerializable()
class ApiEnvelope {
  const ApiEnvelope({
    required this.success,
    required this.message,
    this.code,
    this.data,
    this.pagination,
  });

  factory ApiEnvelope.fromJson(Map<String, dynamic> json) =>
      _$ApiEnvelopeFromJson(json);

  final bool success;
  final String message;
  final String? code;
  final Object? data;
  final Pagination? pagination;

  Map<String, dynamic> toJson() => _$ApiEnvelopeToJson(this);
}
