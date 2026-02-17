-- AlterTable
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- AlterTable (Service)
ALTER TABLE "Service" ADD COLUMN "created_by_id" TEXT;
CREATE INDEX "Service_created_by_id_idx" ON "Service"("created_by_id");
CREATE INDEX "Service_active_idx" ON "Service"("active");
ALTER TABLE "Service" ADD CONSTRAINT "Service_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "customer_notes" TEXT,
ADD COLUMN "cancelled_at" TIMESTAMP(3);

-- CreateIndex (BookingService)
CREATE INDEX "BookingService_booking_id_idx" ON "BookingService"("booking_id");
CREATE INDEX "BookingService_service_id_idx" ON "BookingService"("service_id");

-- AlterTable (Job)
ALTER TABLE "Job" ADD COLUMN "company_id" TEXT;
CREATE INDEX "Job_company_id_idx" ON "Job"("company_id");
ALTER TABLE "Job" ADD CONSTRAINT "Job_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable (ProviderProfile)
ALTER TABLE "ProviderProfile" ADD COLUMN "verification_notes" TEXT;

-- AlterTable (Company)
ALTER TABLE "Company" ADD COLUMN "stripe_account_id" TEXT;

-- CreateTable (IdempotencyKey)
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdempotencyKey_key_key" ON "IdempotencyKey"("key");
CREATE INDEX "IdempotencyKey_expires_at_idx" ON "IdempotencyKey"("expires_at");
