# Architecture

The application uses feature-oriented layers:

- `presentation`: Material 3 screens and small reusable widgets.
- `data`: repositories that translate real REST responses into domain values.
- `domain`: typed customer-facing values.
- `core`: configuration, security, API transport, parsing, formatting, theme, and shared state views.

Riverpod owns dependency injection and remote screen state. Future providers cache a screen's currently loaded data across tab changes; explicit pull-to-refresh invalidates the relevant provider. `SessionController` is the single authority for restore, register, login, profile changes, session expiration, and logout.

`ApiClient` wraps Dio and parses the backend `{ success, message, data, pagination }` envelope. Its queued authentication interceptor adds bearer tokens, allows one shared refresh operation, queues concurrent 401 requests behind it, and retries each request once. Failures are converted into readable `ApiException` values with field errors.

GoRouter starts at a splash route, waits for session restoration, guards booking/profile routes, preserves protected deep links as the `from` query parameter, and redirects signed-in users away from login/registration. The shell route provides the Home, Explore, Bookings, and Profile navigation.

Security decisions: access/refresh tokens are only in `flutter_secure_storage`; SharedPreferences is only used for the non-sensitive currency preference; prices/totals and QR state always remain backend-controlled; API request bodies and authorization values are never logged; release Android does not globally permit cleartext traffic.
