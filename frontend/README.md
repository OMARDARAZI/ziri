# Zeere dashboard frontend

This Vite/React/TypeScript application provides the session-authenticated admin and provider dashboards plus a public participant QR page for Zeere.

## Stack

React 19, Vite, TypeScript, React Router, Axios, TanStack React Query, React Hook Form, Zod, Bootstrap 5, Bootstrap Icons, ZXing browser QR scanning, and Vitest/React Testing Library.

## Install and start

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell use `Copy-Item .env.example .env`.

Before starting the frontend, start the backend and ensure MySQL is configured:

```bash
cd ../backend
Copy-Item .env.example .env
npm run db:schema
npm run db:seed
npm run dev
```

Set `CORS_ORIGINS=http://localhost:3000,http://localhost:5173` in the backend environment for a direct Vite connection. The development proxy handles `/api` and `/uploads` when `VITE_PROXY_TARGET` is set.

## Environment

- `VITE_API_BASE_URL` defaults to `http://localhost:3000/api/v1`.
- `VITE_BACKEND_ORIGIN` is used for backend-hosted images.
- `VITE_PUBLIC_QR_BASE_URL` identifies the SPA public QR URL.
- `VITE_PROXY_TARGET` is only for Vite development proxying.

No backend secrets belong in this project.

## Routes and features

- Admin: `/admin/dashboard`, all content, provider, offering, customer, booking, participant, QR, scan-log, settings, and profile routes.
- Provider: `/provider/dashboard`, bookings, scanner, scan history, and profile.
- Public QR: `/qr/:token`.

Admin and provider authentication uses the backend’s HttpOnly session cookie. Axios sends credentials, retains the server-issued CSRF token after login/current-user restoration, and React Query clears data on logout. Role guards redirect unauthenticated users to the appropriate login page and reject wrong-role access.

Generic admin resource screens use the real dashboard API for pagination, URL-backed search and filters, record inspection, uploads, creation, edits, deletion, booking confirmation/cancellation, and QR cancellation. Provider validation is only accepted after the backend transaction confirms it; the scanner accepts raw QR tokens or public URLs and releases camera streams when stopped or unmounted.

## Quality commands

```bash
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npm run build
```

The tests do not require a live backend. They cover login form behavior, Zod constraints, currency handling, and QR extraction. The backend integration suite remains responsible for database transaction coverage.

## Production

Run `npm run build` and serve `dist/` with SPA fallback to `index.html`; proxy `/api` and `/uploads` to the backend or configure `VITE_API_BASE_URL` and backend CORS for the deployed origin.
