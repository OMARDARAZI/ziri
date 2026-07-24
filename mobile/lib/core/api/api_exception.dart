class FieldError {
  const FieldError({required this.field, required this.message});

  final String field;
  final String message;
}

class ApiException implements Exception {
  const ApiException(
    this.message, {
    this.statusCode,
    this.code,
    this.fieldErrors = const [],
  });

  final String message;
  final int? statusCode;
  final String? code;
  final List<FieldError> fieldErrors;

  String fieldMessage(String field) =>
      fieldErrors
          .where((FieldError error) => error.field == field)
          .map((FieldError error) => error.message)
          .firstOrNull ??
      message;

  @override
  String toString() => message;
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
