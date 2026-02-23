-- CreateTable
CREATE TABLE "JobCompletion" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobCompletion_job_id_key" ON "JobCompletion"("job_id");

-- CreateIndex
CREATE INDEX "JobCompletion_completed_at_idx" ON "JobCompletion"("completed_at");

-- AddForeignKey
ALTER TABLE "JobCompletion" ADD CONSTRAINT "JobCompletion_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
