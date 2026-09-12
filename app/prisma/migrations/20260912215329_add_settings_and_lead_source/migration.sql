/*
  Warnings:

  - You are about to drop the `scraping_jobs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `business_type` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `discovered_from` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `discovered_url` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `social_profiles` on the `leads` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "scraping_jobs_status_idx";

-- DropIndex
DROP INDEX "scraping_jobs_organization_id_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "scraping_jobs";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "task_id" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "location" TEXT,
    "category" TEXT,
    "source" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "score_components" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DISCOVERED',
    "qualification" TEXT NOT NULL DEFAULT 'PENDING',
    "hypothesis" TEXT,
    "recommended_action" TEXT,
    "decision_maker" TEXT,
    "employee_count" INTEGER,
    "profile_json" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "leads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "leads_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_leads" ("category", "created_at", "decision_maker", "employee_count", "hypothesis", "id", "location", "name", "organization_id", "phone", "profile_json", "qualification", "recommended_action", "score", "score_components", "status", "task_id", "updated_at", "website") SELECT "category", "created_at", "decision_maker", "employee_count", "hypothesis", "id", "location", "name", "organization_id", "phone", "profile_json", "qualification", "recommended_action", "score", "score_components", "status", "task_id", "updated_at", "website" FROM "leads";
DROP TABLE "leads";
ALTER TABLE "new_leads" RENAME TO "leads";
CREATE INDEX "leads_organization_id_idx" ON "leads"("organization_id");
CREATE INDEX "leads_task_id_idx" ON "leads"("task_id");
CREATE INDEX "leads_score_idx" ON "leads"("score");
CREATE INDEX "leads_qualification_idx" ON "leads"("qualification");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "settings_organization_id_idx" ON "settings"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_organization_id_key_key" ON "settings"("organization_id", "key");
