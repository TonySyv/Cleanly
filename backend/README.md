# Cleanly Backend API

Fully functioning backend for the Cleanly Android app. Uses **Neon PostgreSQL** and **JWT** auth.

## Prerequisites

- Node.js 18+
- Database URL in `.env` (see below)

## Setup

### 1. Environment

From the project root, copy the database URL into `backend/.env`, or create `backend/.env` with:

```env
DATABASE_URL=postgresql://...your-neon-url...?sslmode=require
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=3600
JWT_REFRESH_EXPIRY=604800
PORT=3000
```

A `.env` file with your dev database URL is already present if you ran the initial setup.

### 2. Install and generate DB client

From **`w:\AndroidStudioProjects\Cleanly\backend`**:

```bash
npm install
npx prisma generate
```

### 3. Push schema to database

This creates the `User` and `RefreshToken` tables in your Neon database:

```bash
npx prisma db push
```

### 4. Start the server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

Server runs at **http://localhost:3000**.

## Payment provider

Bookings use a payment abstraction. Set **PAYMENT_PROVIDER** in `.env` (or env in production):

- **`dummy`** (default): No Stripe keys needed. Create booking then call `POST /bookings/:id/confirm-payment` to mark payment succeeded. Use for local/dev.
- **`stripe`**: Real payments. Set **STRIPE_SECRET_KEY** and **STRIPE_WEBHOOK_SECRET** (for `POST /api/v1/webhooks/stripe`). See `.env.example`.

Switching is config-only; booking and checkout logic stay the same.

## Android app configuration

In `app/build.gradle.kts` set:

- **Emulator:** `buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api/v1/\"")`
- **Physical device:** Use your computer’s IP, e.g. `"http://192.168.1.100:3000/api/v1/"`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/health | No | Health check |
| POST | /api/v1/auth/register | No | Register (email, password, name) |
| POST | /api/v1/auth/login | No | Login (email, password) |
| POST | /api/v1/auth/refresh | No | Refresh access token |
| GET | /api/v1/users/:id | Bearer | Get user profile |
| PUT | /api/v1/users/:id | Bearer | Update user (name, avatarUrl) |

## Deploy to Render

The repo includes a **Render Blueprint** (`render.yaml` in the project root). To deploy:

1. Connect your Git repo to Render.
2. Add **DATABASE_URL** (Neon) and optionally **JWT_SECRET** in the service Environment.
3. Use **Root Directory** `backend` so Render runs build/start from this folder.

See **[DEPLOY.md](../DEPLOY.md)** in the project root for step-by-step Render deployment (Blueprint and manual).

## Troubleshooting: Database connection (P1001)

If you see **"Can't reach database server"** (Prisma `P1001`):

1. **Neon projects suspend after inactivity.** Log into [Neon Console](https://console.neon.tech), open your project, and run any query or use "Restore" to wake the database. Then start the server again.
2. **Check which env file is used.** The server loads `backend/.env.${ENV}`; default is `ENV=local` (so `backend/.env.local`). Set `DATABASE_URL` in that file and ensure it ends with `?sslmode=require` for Neon.
3. **Test the URL:** From `backend/`, run `npx prisma db execute --stdin` and type `SELECT 1;` then Ctrl+Z and Enter (Windows) to see if Prisma can reach the DB.
4. **Network:** If you're on a restricted network or VPN, try disabling VPN or another network; some firewalls block outbound port 5432.

## Scripts

- `npm start` – run server
- `npm run dev` – run with watch mode
- `npx prisma db push` – sync schema to DB (dev)
- `npx prisma migrate deploy` – run migrations (production / Render)
- `npx prisma studio` – open Prisma Studio to inspect data
