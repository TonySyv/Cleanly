# Cleanly Web (Admin & Provider)

React + Vite + TypeScript SPA for platform admin and provider/company cabinets.

## Setup

From project root or `web/`:

```bash
cd web
npm install
```

## Run

Start the backend API (from `backend/`: `npm run dev`), then:

```bash
npm run dev
```

Open http://localhost:5173. Use an account with role `PLATFORM_ADMIN` for `/admin` (services CRUD) or `PROVIDER`/`COMPANY` for `/provider` (profile, services, jobs, company/employees).

## Proxy

Vite proxies `/api` to `http://localhost:3000` so the same backend serves the app.

## Build

```bash
npm run build
```

Output in `dist/`. Serve with any static host and point API to your backend.

## Provider verification

Verification status and document URLs are managed via `PUT /provider/profile`. To support document uploads, implement upload to your storage (e.g. S3), then pass the returned URLs in `documentUrls`. Platform admin can set `verificationStatus` to `VERIFIED` or `REJECTED` (e.g. via a future admin verification screen or API).
