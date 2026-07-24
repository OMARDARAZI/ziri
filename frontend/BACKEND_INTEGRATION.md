# Backend integration changes

The frontend needed JSON endpoints because the existing admin and provider routes render EJS pages. The following additive endpoints were implemented in `backend/src/routes/api/dashboard.routes.js` and `backend/src/controllers/dashboard-api.controller.js`:

- `POST /api/v1/dashboard/admin/login`, `POST /provider/login`, plus role-specific `/me` and `/logout` endpoints.
- Session- and CSRF-protected admin summary, related-provider choices, generic CRUD resources, booking actions, and QR cancellation.
- Session- and CSRF-protected provider summary, bookings/details, scan history, profile, and QR validation endpoints.
- `GET /api/v1/dashboard/public/qr/:token`, which returns only public-safe QR information.

These endpoints use the existing database, upload middleware, sessions, booking confirmation/cancellation transaction code, and QR validation service. Existing EJS dashboard routes remain unchanged.

For local Vite development, add `http://localhost:5173` to the backend `CORS_ORIGINS` setting.
