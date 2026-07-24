# API integration

The base API URL is `API_BASE_URL`; `BACKEND_ORIGIN` resolves relative image paths; `PUBLIC_QR_BASE_URL` documents the public QR host. All are supplied through `--dart-define-from-file`.

The implemented Node API contract is:

- `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- `GET /auth/me`; `PUT /auth/profile`, `/auth/change-password`
- `GET /home`, `/stories`, `/news`, `/events`, `/safety-tips`, `/weather` and their `/:id` variants
- `GET /providers`, `/providers/:id`, `/offerings`, `/offerings/:id`
- `POST /bookings`; `GET /bookings`, `/bookings/:id`; `POST /bookings/:id/cancel`
- `GET /bookings/:bookingId/participants/:participantId/qr`

Responses use `{ "success": true, "message": "…", "data": {} }`; list endpoints also include `{ "pagination": { "page", "limit", "total", "pages" } }`. Validation failures include `errors` entries with `field` and `message`, which are mapped to forms.

Authenticated requests send `Authorization: Bearer <access token>`. Refresh posts `{ "refresh_token": "…" }`, stores the rotated pair securely, and retries only the original rejected request.

Booking creation posts `offering_id`, ISO `scheduled_at`, `currency` (`USD` or `LBP`), `include_customer`, a guest `participants` array with `full_name`/`phone`, and optional `notes`. MySQL dates are displayed carefully: date-only event values are never converted to UTC; time-only values are formatted as times; scheduled datetimes use the response timestamp. USD/LBP values are displayed as returned—no local conversion occurs. Relative images are resolved against `BACKEND_ORIGIN`.
