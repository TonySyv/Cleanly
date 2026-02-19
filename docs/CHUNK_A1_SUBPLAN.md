# Chunk A1 – Schema and roles: sub-plan

**Parent:** [BOOKING_PLATFORM_PLAN.md §11 Implementation chunks](../BOOKING_PLATFORM_PLAN.md) – Phase A, Chunk A1  
**Scope:** Prisma schema (User.role, Service, Booking, BookingService, Job, ProviderProfile, CompanyEmployee); migrations; auth with role in JWT and `requireRole` middleware.

---

## 1. Acceptance criteria (from plan)

- [ ] **Schema:** User has `role` enum; Service, Booking, BookingService, Job, ProviderProfile, CompanyEmployee (and Company) exist with required fields and relations.
- [ ] **Indexes:** User.role, Booking.customerId, Booking.status, Job.providerId, Job.bookingId (and any other critical lookups).
- [ ] **Migrations:** All schema changes applied via Prisma migrations; DB is in sync with `schema.prisma`.
- [ ] **Auth:** Register accepts optional `role`; JWT access (and refresh) payload includes `role`; `requireAuth` sets `req.userId` and `req.role`.
- [ ] **Middleware:** `requireRole(allowedRoles)` exists and returns 403 when role not in list; protected routes use `requireAuth` + `requireRole` as needed.
- [ ] **Routes:** Bookings require CUSTOMER; jobs and provider require PROVIDER or COMPANY; admin services require PLATFORM_ADMIN.

---

## 2. Verification checklist (what to verify)

Use this to confirm each part is done and consistent.

### 2.1 Prisma schema

| Item | Expected | Verify in `backend/prisma/schema.prisma` |
|------|----------|------------------------------------------|
| Role enum | CUSTOMER, PROVIDER, COMPANY, EMPLOYEE, PLATFORM_ADMIN | § Role enum (line ~10) |
| User.role | `role Role @default(CUSTOMER)` | User model |
| User.companyId | Optional, for company employees | User model |
| Service | id, name, description, basePriceCents, durationMinutes, active, createdById | Service model |
| Booking | customerId, status, scheduledAt, address, totalPriceCents, items (BookingService) | Booking model |
| BookingService | bookingId, serviceId, quantity, priceCents | BookingService model |
| Job | bookingId, providerId, companyId?, assignedEmployeeId?, status | Job model |
| ProviderProfile | userId, verificationStatus, documentUrls, offeredServiceIds | ProviderProfile model |
| Company | ownerId, name; employees via User.companyId | Company model |
| CompanyEmployee | companyId, userId, role (string) | CompanyEmployee model |
| Indexes | User(role), Booking(customerId, status), Job(providerId, bookingId) | @@index on each model |

**Note:** Plan doc says `COMPANY_EMPLOYEE` for the role; schema uses `EMPLOYEE`. Codebase (auth, provider, Android) uses `EMPLOYEE` consistently. No change needed for A1; optionally align plan doc to say EMPLOYEE.

### 2.2 Migrations

| Step | Command (run from `w:\AndroidStudioProjects\Cleanly\backend`) | Purpose |
|------|-------------------------------------------------------------|---------|
| 1 | `npx prisma migrate status` | Confirm all migrations applied (no pending). Requires `DATABASE_URL` in env (e.g. `.env.local`). |
| 2 | `npx prisma db pull` (optional) | Compare DB with schema; should match. |
| 3 | `npx prisma generate` | Regenerate client after any schema change. |

If `migrate status` reports pending or drift, run `npx prisma migrate deploy` (or `migrate dev` in dev) and re-check.

### 2.3 Auth and middleware

| Item | Expected | Verify in |
|------|----------|----------|
| Register accepts role | Body: email, password, name, role?; default CUSTOMER; only ALLOWED_ROLES accepted | `backend/src/routes/auth.js` |
| JWT payload | access + refresh tokens include `role` | auth.js (signAccessToken, signRefreshToken) |
| requireAuth | Sets req.userId, req.role from Bearer token; 401 if missing/invalid | `backend/src/middleware/auth.js` |
| requireRole(allowedRoles) | 403 if req.role not in allowedRoles; use after requireAuth | auth.js |
| Bookings route | requireAuth + requireRole(['CUSTOMER']) | `backend/src/routes/bookings.js` |
| Jobs route | requireAuth + requireRole(['PROVIDER', 'COMPANY']) | `backend/src/routes/jobs.js` |
| Provider route | requireAuth + requireRole(['PROVIDER', 'COMPANY']) | `backend/src/routes/provider.js` |
| Admin services | requireAuth + requireRole(['PLATFORM_ADMIN']) | `backend/src/routes/admin/services.js` |

### 2.4 JWT library

| Item | Expected | Verify in `backend/src/lib/jwt.js` |
|------|----------|-----------------------------------|
| signAccessToken | Accepts { userId, role? }; encodes in payload | jwt.js |
| verifyToken | Returns payload with userId and role | jwt.js |

---

## 3. Completion checklist (gaps to fix)

Work through these only if verification found issues.

- [ ] **Schema drift:** If DB and schema differ, create a new migration: `npx prisma migrate dev --name sync_schema` (from `backend`). Resolve any conflicts.
- [ ] **Missing indexes:** If any critical query (e.g. list bookings by customerId, list jobs by providerId) is unindexed, add `@@index([...])` in schema and migrate.
- [ ] **Role in refresh flow:** Ensure refresh token response includes updated user with role and that new access token carries role (auth.js refresh handler).
- [ ] **EMPLOYEE vs COMPANY_EMPLOYEE:** Plan says COMPANY_EMPLOYEE; code uses EMPLOYEE. For A1, no code change; optionally update BOOKING_PLATFORM_PLAN.md §5 to say EMPLOYEE for the enum value.
- [ ] **Routes not protected:** Any new route that should be role-scoped must use `requireAuth` and, if needed, `requireRole(...)`.

---

## 4. How to run (quick test)

From project root `w:\AndroidStudioProjects\Cleanly`:

```powershell
cd backend
npx prisma migrate status
npx prisma generate
node --experimental-vm-modules node_modules/.bin/jest --testPathIgnorePatterns=[] 2>$null; if (-not $?) { node -e "require('child_process').execSync('npx prisma db execute --stdin < prisma/seed.cjs', { stdio: 'inherit', shell: true });" 2>$null }
```

Or manually:

1. **From `backend`:** `npx prisma migrate deploy` (or `migrate dev` if dev DB).
2. **From `backend`:** `npx prisma generate`.
3. **From `backend`:** Seed if needed: `node prisma/seed.cjs` (or your seed command).
4. **From `backend`:** Start API: `npm run dev` or `node src/index.js`.
5. **Smoke test:**  
   - Register with `role: "PROVIDER"` → login → access token should contain role.  
   - `GET /api/v1/bookings` with that token → 403 (bookings require CUSTOMER).  
   - Register CUSTOMER, login, `GET /api/v1/bookings` → 200 (empty array ok).

---

## 5. Key files

| Area | Path |
|------|------|
| Schema | `backend/prisma/schema.prisma` |
| Migrations | `backend/prisma/migrations/*/migration.sql` |
| Auth routes | `backend/src/routes/auth.js` |
| Auth middleware | `backend/src/middleware/auth.js` |
| JWT | `backend/src/lib/jwt.js` |
| User DTO | `backend/src/lib/userDto.js` (exposes role) |
| Role-protected routes | `backend/src/routes/bookings.js`, `jobs.js`, `provider.js`, `admin/services.js` |
| App entry | `backend/src/index.js` (mounts all routes) |

---

## 6. Sign-off

When all acceptance criteria are met and verification is done:

- [ ] All items in §1 checked.
- [ ] §2 verification completed; any issues documented and fixed in §3.
- [ ] Migrations applied; generate run; smoke test passed.
- [ ] Chunk A1 considered **complete**; proceed to A2 (Services API) or parallel A2–A5 as planned.
