# Local / Dev / Prod Environment Setup

This document describes the three-tier setup: **local**, **dev**, and **prod**. Each tier has its own Frontend (Android app), Backend (API), and—where applicable—Database branch.

## Overview

| Tier   | Frontend (Android) | Backend (API)     | Database     |
|--------|--------------------|-------------------|--------------|
| **Local** | Local app (local flavor) | Local Node server | **Dev DB**   |
| **Dev**   | Dev app (dev flavor)     | Deployed dev API  | **Dev DB**   |
| **Prod**  | Prod app (prod flavor)   | Deployed prod API | **Prod DB**  |

- **Local** and **Dev** both use the **dev** database branch so you can develop and test against the same data without touching production.
- **Prod** uses the **prod** database branch only.

## Database Branches (Neon)

Use two branches in Neon (or two databases):

1. **Dev branch** – for local development and dev deployment (migrations, testing, feature work).
2. **Prod branch** – for production only.

Create branches in the Neon dashboard and use the connection strings in the corresponding backend env files.

## Backend: Env Files

All backend env files live in **`backend/`**. The server loads one file based on the **`ENV`** variable:

| `ENV` (or unset) | File loaded   | Use case                    |
|------------------|---------------|-----------------------------|
| (unset) or `local` | `.env.local` | Running backend on your machine |
| `dev`            | `.env.dev`    | Deployed dev service (e.g. Render) |
| `prod`           | `.env.prod`   | Deployed production service |

### Files

- **`.env.local`** – Local development. Points to **dev DB**. Renamed from the original `.env`.
- **`.env.dev`** – Dev deployment. Fill with **dev DB** URL and dev JWT secret.
- **`.env.prod`** – Production. Fill with **prod DB** URL and a strong, unique JWT secret.

None of these files are committed (see `.gitignore`). To recreate them, use:
- **`backend/.env.example`** – general template
- **`backend/.env.dev.example`** – copy to `.env.dev`
- **`backend/.env.prod.example`** – copy to `.env.prod`

### Running the backend

From **`backend/`**:

```bash
# Local (uses .env.local) – default
npm run dev

# Explicit local
ENV=local npm run dev

# If you ever run a “dev” build locally (e.g. to test .env.dev)
ENV=dev npm run dev
```

On **Render** (or similar), set in the service environment:

- **Dev service:** `ENV=dev` and add `DATABASE_URL`, `JWT_SECRET`, etc. (or use Render env from a copy of `.env.dev`).
- **Prod service:** `ENV=prod` and add production `DATABASE_URL`, `JWT_SECRET`, etc.

The app loads **`.env.${ENV}`** from the `backend/` directory (default `ENV=local` → `.env.local`).

## Android: Build Flavors

The app has three **product flavors** so each build talks to the right API:

| Flavor   | Application ID           | API base URL |
|----------|---------------------------|--------------|
| **local** | `com.example.cleanly.local` | `http://10.0.2.2:3000/api/v1/` (emulator → local backend) |
| **dev**   | `com.example.cleanly.dev`   | `https://your-dev-api.onrender.com/api/v1/` (replace with your dev API URL) |
| **prod**  | `com.example.cleanly`       | `https://your-prod-api.onrender.com/api/v1/` (replace with your prod API URL) |

### Building and running

From **project root**:

```bash
# Local: app → local backend → dev DB
./gradlew :app:installLocalDebug

# Dev: app → deployed dev API → dev DB
./gradlew :app:installDevDebug

# Prod: app → deployed prod API → prod DB
./gradlew :app:installProdDebug
```

In Android Studio, choose the **local**, **dev**, or **prod** build variant when running or debugging.

### Configuring dev/prod API URLs

Edit **`app/build.gradle.kts`** and set the `API_BASE_URL` for the **dev** and **prod** flavors to your real hostnames:

- **dev:** e.g. `https://cleanly-api-dev.onrender.com/api/v1/`
- **prod:** e.g. `https://cleanly-api.onrender.com/api/v1/` or your custom domain

Local flavor already points to `http://10.0.2.2:3000/api/v1/` for the emulator.

## Checklist

### Backend

- [ ] **Neon:** Create **dev** and **prod** branches (or two DBs).
- [ ] **backend/.env.local** – Already present; uses dev DB. Use for local runs.
- [ ] **backend/.env.dev** – Set `DATABASE_URL` (dev branch) and `JWT_SECRET` for the deployed dev service.
- [ ] **backend/.env.prod** – Set `DATABASE_URL` (prod branch) and a strong `JWT_SECRET` for production.
- [ ] **Deployed dev service:** Set `ENV=dev` and the same vars as in `.env.dev`.
- [ ] **Deployed prod service:** Set `ENV=prod` and the same vars as in `.env.prod`.

### Android

- [ ] **local** flavor: no change (already points to `10.0.2.2:3000`).
- [ ] **dev** flavor: set `API_BASE_URL` in `build.gradle.kts` to your dev API base URL.
- [ ] **prod** flavor: set `API_BASE_URL` in `build.gradle.kts` to your prod API base URL.

### Optional

- Firebase / Crashlytics: if you use one `google-services.json` per environment, add flavor-specific files (e.g. under `app/src/dev/`, `app/src/prod/`).

## Summary

- **prod** = prod FE + prod BE + prod DB  
- **dev** = dev FE + dev BE + dev DB  
- **local** = local FE + local BE + **dev DB**

Backend env is selected by **`ENV`** and the corresponding **`.env.local`** / **`.env.dev`** / **`.env.prod`** in **`backend/`**. Android environment is selected by the **local** / **dev** / **prod** build flavor.
