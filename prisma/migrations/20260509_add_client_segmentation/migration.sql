-- 20260509_add_client_segmentation
-- Ajoute la segmentation clientType / onboarding / features.
-- Idempotent : utilise IF NOT EXISTS quand Postgres le permet.

-- ──────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "ClientType" AS ENUM (
    'INDIVIDUAL',
    'PRO_ARTISAN',
    'PRO_DIAGNOSTICIAN',
    'PRO_AUDITOR',
    'PRO_BUREAU_ETUDES',
    'PRO_AGENCY',
    'PRO_SYNDIC',
    'PRO_OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OnboardingStep" AS ENUM (
    'CLIENT_TYPE',
    'PRO_SUB_SEGMENT',
    'IDENTITY',
    'QUESTIONS',
    'PLAN_SUGGESTION',
    'COMPLETED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PrimaryGoal" AS ENUM (
    'FIND_AIDS', 'PLAN_RENO', 'COMPARE_QUOTES', 'REDUCE_BILLS', 'SELL_BUY_HOUSE',
    'PRODUCE_AUDITS', 'PRODUCE_DPE', 'COMPLY_DECRET_TERTIAIRE', 'WIN_DEALS', 'ONBOARD_TEAM'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SegmentSize" AS ENUM ('SOLO','XS','S','M','L','XL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY','ANNUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FeatureFlag" AS ENUM (
    'CALC_BASIC',
    'CALC_ADVANCED_SCENARIOS',
    'PDF_TEMPLATE_PARTICULIER',
    'PDF_TEMPLATE_DPE_COLLECTIF',
    'PDF_TEMPLATE_COPROPRIETE',
    'PDF_TEMPLATE_TERTIAIRE',
    'PDF_BRAND_WHITELABEL',
    'AI_PHOTO_ANALYSIS',
    'AI_REPORT_DRAFTING',
    'AI_AGENT_ORCHESTRATOR',
    'TEAM_MULTI_SEAT',
    'CLIENT_PORTAL_PUBLIC_LINK',
    'COMMENT_THREADS',
    'AUDIT_LOG_EXPORT',
    'WEBHOOKS',
    'REST_API'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Étend SubscriptionPlan avec les nouveaux plans particulier.
DO $$ BEGIN
  ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'P_DECOUVERTE';
  ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'P_MON_PROJET';
EXCEPTION WHEN others THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- ALTER Organization
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "clientType"     "ClientType"     NOT NULL DEFAULT 'INDIVIDUAL',
  ADD COLUMN IF NOT EXISTS "onboardingStep" "OnboardingStep" NOT NULL DEFAULT 'CLIENT_TYPE',
  ADD COLUMN IF NOT EXISTS "primaryGoal"    "PrimaryGoal",
  ADD COLUMN IF NOT EXISTS "segmentSize"    "SegmentSize",
  ADD COLUMN IF NOT EXISTS "monthlyVolume"  INTEGER,
  ADD COLUMN IF NOT EXISTS "defaultLocale"  TEXT NOT NULL DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS "signupSource"   TEXT,
  ADD COLUMN IF NOT EXISTS "utmCampaign"    TEXT;

CREATE INDEX IF NOT EXISTS "Organization_clientType_idx"     ON "Organization"("clientType");
CREATE INDEX IF NOT EXISTS "Organization_onboardingStep_idx" ON "Organization"("onboardingStep");

-- ──────────────────────────────────────────────────────────────────────────
-- ALTER Subscription
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "billingPeriod"        "BillingPeriod" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS "stripePriceId"        TEXT,
  ADD COLUMN IF NOT EXISTS "stripeProductId"      TEXT,
  ADD COLUMN IF NOT EXISTS "monthlyQuotaAiTokens" INTEGER DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS "seatsIncluded"        INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "usageProjects"        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "usageReports"         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "usagePhotos"          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "usageAiTokens"        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "usageSeatsActive"     INTEGER NOT NULL DEFAULT 0;

-- monthlyQuota* deviennent nullable (null = illimité)
ALTER TABLE "Subscription" ALTER COLUMN "monthlyQuotaProjects" DROP NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "monthlyQuotaReports"  DROP NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "monthlyQuotaPhotos"   DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "Subscription_stripeCustomerId_idx"     ON "Subscription"("stripeCustomerId");
CREATE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE PlanFeature
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PlanFeature" (
  "id"        TEXT NOT NULL,
  "plan"      "SubscriptionPlan" NOT NULL,
  "feature"   "FeatureFlag" NOT NULL,
  "enabled"   BOOLEAN NOT NULL DEFAULT TRUE,
  "hardLimit" INTEGER,
  CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlanFeature_plan_feature_key" ON "PlanFeature"("plan","feature");
CREATE INDEX IF NOT EXISTS "PlanFeature_plan_idx"    ON "PlanFeature"("plan");
CREATE INDEX IF NOT EXISTS "PlanFeature_feature_idx" ON "PlanFeature"("feature");

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE OrganizationFeatureOverride
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "OrganizationFeatureOverride" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "feature"        "FeatureFlag" NOT NULL,
  "enabled"        BOOLEAN NOT NULL,
  "hardLimit"      INTEGER,
  "reason"         TEXT,
  "expiresAt"      TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationFeatureOverride_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrganizationFeatureOverride_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationFeatureOverride_organizationId_feature_key"
  ON "OrganizationFeatureOverride"("organizationId","feature");
CREATE INDEX IF NOT EXISTS "OrganizationFeatureOverride_organizationId_idx" ON "OrganizationFeatureOverride"("organizationId");
CREATE INDEX IF NOT EXISTS "OrganizationFeatureOverride_feature_idx"        ON "OrganizationFeatureOverride"("feature");
