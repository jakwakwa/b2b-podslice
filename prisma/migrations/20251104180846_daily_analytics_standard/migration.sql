/*
  Warnings:

  - Made the column `payout_status` on table `organizations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tax_form_status` on table `organizations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "analytics_events" ADD COLUMN     "browser_name" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "device_type" TEXT,
ADD COLUMN     "duration_ms" INTEGER,
ADD COLUMN     "os_name" TEXT,
ADD COLUMN     "progress_pct" DOUBLE PRECISION,
ADD COLUMN     "region" TEXT;

-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "payout_status" SET NOT NULL,
ALTER COLUMN "tax_form_status" SET NOT NULL;

-- CreateTable
CREATE TABLE "daily_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "day" DATE NOT NULL,
    "summary_id" UUID NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "completes" INTEGER NOT NULL DEFAULT 0,
    "listen_ms_total" INTEGER NOT NULL DEFAULT 0,
    "completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_daily_analytics_day" ON "daily_analytics"("day");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_daily_summary_day" ON "daily_analytics"("summary_id", "day");

-- AddForeignKey
ALTER TABLE "daily_analytics" ADD CONSTRAINT "daily_analytics_summary_id_fkey" FOREIGN KEY ("summary_id") REFERENCES "summaries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
