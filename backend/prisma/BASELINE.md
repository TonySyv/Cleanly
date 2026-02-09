# Prisma migrate baseline (P3005)

If you see "The database schema is not empty" when running `prisma migrate deploy`, the DB was created earlier (e.g. with `db push` or manually). Baseline and then deploy:

**From the `backend/` directory:**

```powershell
# Mark the two existing migrations as already applied (they match your current DB)
npx prisma migrate resolve --applied "20250209000000_init"
npx prisma migrate resolve --applied "20250209120000_add_tasks"

# Now deploy; only the new migration (booking_platform_schema) will run
npx prisma migrate deploy
```

After this, the database will have the full booking platform schema (roles, Service, Booking, Job, ProviderProfile, Company, etc.).
