-- CreateEnum
CREATE TYPE "RecurringSchedule" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');
CREATE TYPE "RecurringSeriesStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');
CREATE TYPE "PromotionType" AS ENUM ('PERCENT', 'FIXED_CENTS');
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "PaymentTransactionType" AS ENUM ('CHARGE', 'REFUND', 'PAYOUT');

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "email_verified_at" TIMESTAMP(3),
ADD COLUMN "phone_verified_at" TIMESTAMP(3),
ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateTable ServiceCategory
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");
CREATE INDEX "ServiceCategory_active_idx" ON "ServiceCategory"("active");

-- AlterTable Service
ALTER TABLE "Service" ADD COLUMN "currency" TEXT,
ADD COLUMN "category_id" TEXT,
ADD COLUMN "deleted_at" TIMESTAMP(3);
CREATE INDEX "Service_category_id_idx" ON "Service"("category_id");
ALTER TABLE "Service" ADD CONSTRAINT "Service_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable Promotion
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "value" INTEGER NOT NULL,
    "currency" TEXT,
    "min_booking_cents" INTEGER,
    "max_discount_cents" INTEGER,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "max_uses" INTEGER,
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- CreateTable Address
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "line_1" TEXT NOT NULL,
    "line_2" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Address_user_id_idx" ON "Address"("user_id");
ALTER TABLE "Address" ADD CONSTRAINT "Address_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable RecurringSeries
CREATE TABLE "RecurringSeries" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "schedule" "RecurringSchedule" NOT NULL,
    "day_of_week" INTEGER,
    "preferred_time_start" TEXT,
    "preferred_time_end" TEXT,
    "address" TEXT NOT NULL,
    "customer_notes" TEXT,
    "status" "RecurringSeriesStatus" NOT NULL DEFAULT 'ACTIVE',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringSeries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RecurringSeries_customer_id_idx" ON "RecurringSeries"("customer_id");
ALTER TABLE "RecurringSeries" ADD CONSTRAINT "RecurringSeries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Booking
ALTER TABLE "Booking" ADD COLUMN "scheduled_end_at" TIMESTAMP(3),
ADD COLUMN "address_id" TEXT,
ADD COLUMN "discount_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "currency" TEXT DEFAULT 'USD',
ADD COLUMN "locale" TEXT,
ADD COLUMN "promotion_id" TEXT,
ADD COLUMN "recurring_series_id" TEXT;
CREATE INDEX "Booking_recurring_series_id_idx" ON "Booking"("recurring_series_id");
CREATE INDEX "Booking_address_id_idx" ON "Booking"("address_id");
CREATE INDEX "Booking_promotion_id_idx" ON "Booking"("promotion_id");
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_recurring_series_id_fkey" FOREIGN KEY ("recurring_series_id") REFERENCES "RecurringSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "read_at" TIMESTAMP(3),
    "resource_type" TEXT,
    "resource_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");
CREATE INDEX "Notification_user_id_read_at_idx" ON "Notification"("user_id", "read_at");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ProviderAvailability
CREATE TABLE "ProviderAvailability" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" INTEGER NOT NULL,
    "end_time" INTEGER NOT NULL,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderAvailability_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProviderAvailability_user_id_idx" ON "ProviderAvailability"("user_id");
ALTER TABLE "ProviderAvailability" ADD CONSTRAINT "ProviderAvailability_day_of_week_range" CHECK (day_of_week >= 0 AND day_of_week <= 6);
ALTER TABLE "ProviderAvailability" ADD CONSTRAINT "ProviderAvailability_times_range" CHECK (start_time >= 0 AND start_time < 1440 AND end_time > start_time AND end_time <= 1440);
ALTER TABLE "ProviderAvailability" ADD CONSTRAINT "ProviderAvailability_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ProviderService
CREATE TABLE "ProviderService" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "price_cents" INTEGER,
    "duration_minutes" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderService_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProviderService_user_id_service_id_key" ON "ProviderService"("user_id", "service_id");
CREATE INDEX "ProviderService_user_id_idx" ON "ProviderService"("user_id");
CREATE INDEX "ProviderService_service_id_idx" ON "ProviderService"("service_id");
ALTER TABLE "ProviderService" ADD CONSTRAINT "ProviderService_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderService" ADD CONSTRAINT "ProviderService_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Review
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "job_id" TEXT,
    "customer_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "provider_reply" TEXT,
    "replied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Review_booking_id_key" ON "Review"("booking_id");
CREATE INDEX "Review_provider_id_idx" ON "Review"("provider_id");
CREATE INDEX "Review_booking_id_idx" ON "Review"("booking_id");
CREATE UNIQUE INDEX "Review_job_id_key" ON "Review"("job_id");
ALTER TABLE "Review" ADD CONSTRAINT "Review_rating_range" CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE "Review" ADD CONSTRAINT "Review_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Refund
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "reason" TEXT,
    "stripe_refund_id" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Refund_stripe_refund_id_key" ON "Refund"("stripe_refund_id");
CREATE INDEX "Refund_booking_id_idx" ON "Refund"("booking_id");
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PaymentTransaction
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT,
    "type" "PaymentTransactionType" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "stripe_refund_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PaymentTransaction_booking_id_idx" ON "PaymentTransaction"("booking_id");
CREATE INDEX "PaymentTransaction_created_at_idx" ON "PaymentTransaction"("created_at");
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "payload" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_user_id_idx" ON "AuditLog"("user_id");
CREATE INDEX "AuditLog_resource_type_idx" ON "AuditLog"("resource_type");
CREATE INDEX "AuditLog_resource_id_idx" ON "AuditLog"("resource_id");
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable CustomerFavorite
CREATE TABLE "CustomerFavorite" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerFavorite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CustomerFavorite_customer_id_provider_id_key" ON "CustomerFavorite"("customer_id", "provider_id");
CREATE INDEX "CustomerFavorite_customer_id_idx" ON "CustomerFavorite"("customer_id");
ALTER TABLE "CustomerFavorite" ADD CONSTRAINT "CustomerFavorite_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerFavorite" ADD CONSTRAINT "CustomerFavorite_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable CompanyInvitation
CREATE TABLE "CompanyInvitation" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'cleaner',
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CompanyInvitation_token_key" ON "CompanyInvitation"("token");
CREATE INDEX "CompanyInvitation_company_id_idx" ON "CompanyInvitation"("company_id");
CREATE INDEX "CompanyInvitation_token_idx" ON "CompanyInvitation"("token");
CREATE INDEX "CompanyInvitation_email_idx" ON "CompanyInvitation"("email");
ALTER TABLE "CompanyInvitation" ADD CONSTRAINT "CompanyInvitation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
