-- AlterTable
ALTER TABLE "leads" ADD COLUMN "business_type" TEXT;
ALTER TABLE "leads" ADD COLUMN "discovered_from" TEXT;
ALTER TABLE "leads" ADD COLUMN "discovered_url" TEXT;
ALTER TABLE "leads" ADD COLUMN "email" TEXT;
ALTER TABLE "leads" ADD COLUMN "social_profiles" JSONB;

-- CreateTable
CREATE TABLE "scraping_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "product_query" TEXT NOT NULL,
    "platforms" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "leadsFound" INTEGER NOT NULL DEFAULT 0,
    "leadsWithPhone" INTEGER NOT NULL DEFAULT 0,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "scraping_jobs_organization_id_idx" ON "scraping_jobs"("organization_id");

-- CreateIndex
CREATE INDEX "scraping_jobs_status_idx" ON "scraping_jobs"("status");

-- CreateIndex
CREATE INDEX "leads_discovered_from_idx" ON "leads"("discovered_from");
