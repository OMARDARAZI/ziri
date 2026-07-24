# Zeere backend

Zeere is a Node.js/Express backend for an island-content Flutter application. It includes customer REST APIs, Bootstrap admin and provider dashboards, bookings with participant-level QR passes, and provider-only atomic QR validation.

## Requirements

- Node.js 20 or newer
- MySQL 8 or newer
- npm

## Install and run

```bash
cd backend
npm install
copy .env.example .env
# Create the MySQL server/database user as needed, then:
npm run db:schema
npm run db:migrate
npm run db:seed
npm run dev
```

On macOS/Linux, use `cp .env.example .env`. The application is available at `http://localhost:3000`.

For a production process:

```bash
NODE_ENV=production npm start
```

`npm run db:migrate` safely adds columns needed by the current application schema to an existing database and backfills legacy data. `npm run db:reset` drops and rebuilds the configured development database. It is destructive; never point it at production. `npm run expire-qr` can be scheduled every few minutes to mark overdue active QR passes as expired.

## Environment

Copy `.env.example` and set every secret to a long random value in production:

| Variable | Purpose |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | MySQL connection |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Independent JWT signing secrets |
| `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Token lifetimes |
| `SESSION_SECRET` | Dashboard session signing secret |
| `PUBLIC_APP_URL` | Base URL embedded in participant QR codes |
| `CORS_ORIGINS` | Comma-separated browser/mobile origins |
| `QR_VALID_BEFORE_MINUTES`, `QR_VALID_AFTER_MINUTES` | Initial QR validity defaults |
| `MAX_UPLOAD_SIZE_MB` | Image upload cap (default 5 MB) |

The session store is implemented directly with the maintained `mysql2/promise` connection pool. This avoids the only published `connect-mysql2` release, which currently bundles a critical-vulnerability version of `mysql2`; it still stores sessions in MySQL as required.

## Development accounts

| Role | Phone | Password |
| --- | --- | --- |
| Admin | `+96170000001` | `Admin123!` |
| Provider 1 | `+96170000002` | `Provider123!` |
| Provider 2 | `+96170000003` | `Provider123!` |
| Customer | `+96170000004` | `Customer123!` |

Seed passwords are bcrypt hashes in the database; the plaintext values above are development credentials only.

## Main routes

### Customer REST API (`/api/v1`)

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`; `GET /auth/me`; `PUT /auth/profile`, `/auth/change-password` |
| Home/content | `GET /home`, `/stories`, `/news`, `/events`, `/safety-tips`, `/weather` and item routes |
| Discovery | `GET /providers`, `/providers/:id`, `/offerings`, `/services`, `/activities`, `/offerings/:id` |
| Bookings | `POST /bookings`; `GET /bookings`, `/bookings/:id`; `POST /bookings/:id/cancel` |
| Participant QR | `GET /bookings/:bookingId/participants/:participantId/qr` |
| Provider validation | `POST /provider/qr/validate` (provider bearer token) |

All successful API responses use `{ success, message, data }`. Collection endpoints also include `pagination`.

### Web routes

- Admin: `/admin/login`, `/admin/dashboard`, then `/admin/stories`, `/admin/news`, `/admin/events`, `/admin/safety-tips`, `/admin/weather`, `/admin/providers`, `/admin/provider-users`, `/admin/offerings`, `/admin/customers`, `/admin/bookings`, `/admin/participants`, `/admin/qr-codes`, `/admin/scan-logs`, and `/admin/settings`.
- Provider: `/provider/login`, `/provider/dashboard`, `/provider/bookings`, `/provider/scanner`, `/provider/scan-history`, `/provider/profile`.
- Public QR: `/qr/:token` and `/qr/:token/image`.

## Flutter examples

Register and retain both returned tokens securely:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Amina Haddad","phone":"+96170123456","password":"StrongPass1!","password_confirmation":"StrongPass1!"}'
```

Create a booking using the access token. The server obtains the current offering price and never accepts a client-supplied amount.

```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"offering_id":1,"scheduled_at":"2026-08-01T16:00:00Z","currency":"USD","include_customer":true,"participants":[{"full_name":"Guest One","phone":"+96171111111"}]}'
```

Refresh access tokens with `POST /api/v1/auth/refresh` and `{ "refresh_token": "..." }`; logout revokes the supplied refresh token.

## Booking and QR flow

1. A customer selects an offering, schedule, currency, whether to include themselves, and any guests.
2. The booking transaction locks the active offering, snapshots its USD/LBP price, creates each participant, and creates a cryptographically random individual QR token.
3. An admin confirms the booking. Validity is recalculated from the settings around `scheduled_at`.
4. Each participant may open or share `/qr/:token`; the page only displays status and never consumes the pass.
5. A provider scans a raw token or full public link. The validation transaction uses `SELECT ... FOR UPDATE`, checks provider ownership and all validity/status conditions, records the audit row, and marks a valid code used immediately.

## Security notes

- Passwords use bcrypt. Password and refresh-token hashes are never serialized in API output.
- Access/refresh JWTs are separate; refresh-token hashes, revocation, and rotation are persisted.
- Dashboard sessions are HTTP-only, same-site, and MySQL-backed; all dashboard mutations require a CSRF token.
- Helmet, CORS allowlisting, rate limits, strict role/ownership checks, parameterized SQL, and upload MIME/size checks are enabled.
- Uploaded JPG, JPEG, PNG, and WEBP files go under `src/public/uploads/<entity>/`; replaced media is removed.

## Tests

```bash
npm test
```

The included unit checks exercise normalisation, totals, token/link parsing, and per-participant token uniqueness without MySQL. The end-to-end suite covers registration/login/duplicate phone detection, protected access, all booking participant combinations and currencies, one QR per participant, and provider validation/repeat/wrong-provider/cancelled/expired branches.

```bash
copy .env.test.example .env.test
# Load its values into your shell, then run:
npm run test:integration
```

It resets only the `TEST_DB_NAME` database and refuses names other than `zeere_test*`. Never point `TEST_DB_NAME` at development or production.

## Project layout

`src/config` contains database, session, upload, and environment configuration; `controllers`, `repositories`, and `services` separate HTTP, SQL access, and business transactions. `routes` contains API, admin, provider, and public routers. EJS views and static files are under `src/views` and `src/public`; SQL and seed utilities are in `database`.
