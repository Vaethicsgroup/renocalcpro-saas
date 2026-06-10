-- A/B test events — analytics conversion par variant

CREATE TYPE "AbTestEventKind" AS ENUM ('ASSIGNMENT', 'CONVERSION');

CREATE TABLE "AbTestEvent" (
  "id"              TEXT NOT NULL,
  "testName"        TEXT NOT NULL,
  "variant"         TEXT NOT NULL,
  "kind"            "AbTestEventKind" NOT NULL,
  "conversionType"  TEXT,
  "visitorHash"     TEXT NOT NULL,
  "utmSource"       TEXT,
  "utmMedium"       TEXT,
  "utmCampaign"     TEXT,
  "locale"          TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AbTestEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AbTestEvent_testName_variant_kind_createdAt_idx" ON "AbTestEvent"("testName", "variant", "kind", "createdAt");
CREATE INDEX "AbTestEvent_visitorHash_testName_idx" ON "AbTestEvent"("visitorHash", "testName");
