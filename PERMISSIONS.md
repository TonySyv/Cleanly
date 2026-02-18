# Cleanly – Permissions and Access Control

This document is the single source of truth for **who sees what** and **who can access what** across the backend API, Android app, and web app. When adding a new route or menu item, update this doc and all three clients together.

---

## Roles

| Role | Purpose |
|------|--------|
| **CUSTOMER** | End user who books cleanings. Uses the customer app (Android) or web customer area. |
| **PROVIDER** | Independent provider who can pick up jobs, manage profile and offered services. Uses web provider dashboard. |
| **COMPANY** | Company owner; can do everything PROVIDER can plus manage company and employees. Uses web provider dashboard. |
| **EMPLOYEE** | Company employee; can be assigned to jobs by the company. |
| **PLATFORM_ADMIN** | Platform administrator; can manage services (CRUD). Uses web admin area. |

Default role on register (when not specified): **CUSTOMER**. JWT payload includes `userId` and `role`; missing role in token is treated as CUSTOMER.

---

## Backend API Matrix

All routes are under `/api/v1/` unless noted.

| Route / prefix | Auth | Role | Who can access |
|----------------|------|------|----------------|
| **auth** (POST /login, /register, /refresh) | No | — | Anyone (public). |
| **users/:id** (GET, PUT) | requireAuth | Any | Authenticated user; **self only** (req.userId === id). Returns and accepts role in body. |
| **tasks** (GET, POST, PUT, DELETE) | requireAuth | Any | Authenticated user; tasks scoped by req.userId. |
| **services** (GET) | No | — | Public. List of (active) services for booking. |
| **bookings** (GET, GET/:id, POST, POST/:id/confirm-payment, PATCH/:id/cancel) | requireAuth | **CUSTOMER** | CUSTOMER only. Bookings scoped by customerId. |
| **jobs** (GET, POST, PATCH) | requireAuth | **PROVIDER**, **COMPANY** | Provider or company only. |
| **provider** (GET/POST /company, GET/PUT /profile, GET/POST/DELETE /employees) | requireAuth | **PROVIDER**, **COMPANY** | Provider or company only. Some actions (company, employees) are COMPANY-only on the server. |
| **admin/services** (GET, POST, PUT/:id, DELETE/:id) | requireAuth | **PLATFORM_ADMIN** | Platform admin only. |
| **webhooks/stripe** (POST) | No (signature verification) | — | Stripe only (signature verified). |

- **requireAuth**: Valid Bearer token required; sets `req.userId` and `req.role` (from JWT or default CUSTOMER).
- **requireRole(allowedRoles)**: Used after requireAuth; returns 403 with “Insufficient permissions” if `req.role` is not in the allowed list.

---

## Android App

### Screens and routes

| Screen / route | Who can open |
|----------------|--------------|
| Login, Register | Anyone (not logged in). |
| Home | **CUSTOMER** only. Non-CUSTOMER are redirected to Profile. |
| Services (Book cleaning) | **CUSTOMER** only. |
| Checkout | **CUSTOMER** only. |
| Bookings, Booking detail | **CUSTOMER** only. |
| Profile | **All authenticated roles.** |
| Tasks, Add/Edit task | Any authenticated user (legacy; not in main drawer). |

### Drawer menu by role

- **CUSTOMER**: Home, Book cleaning, My bookings, Profile.
- **Non-CUSTOMER** (PROVIDER, COMPANY, EMPLOYEE, PLATFORM_ADMIN): Message “Use the web app for provider/admin features.” + **Profile** only.

Non-CUSTOMER users who land on a customer-only route (Home, Services, Checkout, Bookings, Booking detail) are redirected to Profile and the customer-only part of the back stack is cleared.

**Note:** Provider and admin features are not implemented on Android; non-CUSTOMER users should use the web app.

---

## Web App

### Routes by role

| Route | Who can access |
|-------|----------------|
| /login | Anyone. After login, redirect by role: PLATFORM_ADMIN → /admin; PROVIDER or COMPANY → /provider; else (CUSTOMER) → / (customer area). |
| / (customer area) | **CUSTOMER** only (CustomerGate). Child routes: /services, /checkout, /bookings, /bookings/:id, /profile. |
| /admin/* | **PLATFORM_ADMIN** only (Protected). Services CRUD. |
| /provider/* | **PROVIDER** or **COMPANY** only (Protected). Provider dashboard. |

### Menu items by role

- **Customer layout** (only for CUSTOMER): Book cleaning, My bookings, Profile. (See PERMISSIONS.md reference in CustomerLayout.)
- **Provider dashboard** (PROVIDER or COMPANY): Jobs, Profile & Services; **Company & Employees** tab only when `user.role === 'COMPANY'`. (See PERMISSIONS.md reference in Dashboard.)
- **Admin**: Services management (list, create, edit, delete).

---

## Cross-cutting rules

- **Profile (users/:id)**: Users can only access their own profile; backend checks `req.userId === id` and returns 403 otherwise.
- **Bookings and booking creation**: CUSTOMER-only (backend requireRole + Android drawer and route guard + web CustomerGate).
- **Jobs and provider company/employees**: PROVIDER or COMPANY only (backend requireRole; web Protected + provider dashboard; Android does not expose these).
- **Services (catalog)**: Public for listing; create/update/delete are PLATFORM_ADMIN-only under /admin/services.

---

## Maintenance

When you add a **new API route**, **new screen**, or **new menu item**:

1. Update the backend middleware (requireAuth / requireRole) and this doc’s API matrix.
2. Update Android: drawer items and/or route guard in NavGraph, and this doc’s Android section.
3. Update web: route protection and menu visibility, and this doc’s web section.
4. Keep this file in sync so permissions stay consistent and easy to reason about.
