-- 20260509_status_page

DO $$ BEGIN CREATE TYPE "ComponentName"   AS ENUM ('WEB','DB','REDIS','STORAGE','EMAIL','AGENTS');           EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ComponentStatus" AS ENUM ('OPERATIONAL','DEGRADED','PARTIAL_OUTAGE','MAJOR_OUTAGE','MAINTENANCE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "IncidentSeverity" AS ENUM ('MINOR','MAJOR','CRITICAL');                              EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "IncidentState"    AS ENUM ('INVESTIGATING','IDENTIFIED','MONITORING','RESOLVED');    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "HealthCheck" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "component" "ComponentName" NOT NULL,
  "status"    "ComponentStatus" NOT NULL,
  "latencyMs" INTEGER,
  "detail"    TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "HealthCheck_component_checkedAt_idx" ON "HealthCheck"("component","checkedAt");
CREATE INDEX IF NOT EXISTS "HealthCheck_checkedAt_idx"           ON "HealthCheck"("checkedAt");

CREATE TABLE IF NOT EXISTS "Incident" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "title"       TEXT NOT NULL,
  "components"  "ComponentName"[],
  "severity"    "IncidentSeverity" NOT NULL,
  "state"       "IncidentState" NOT NULL DEFAULT 'INVESTIGATING',
  "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt"  TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "Incident_startedAt_idx" ON "Incident"("startedAt");
CREATE INDEX IF NOT EXISTS "Incident_state_idx"     ON "Incident"("state");

CREATE TABLE IF NOT EXISTS "IncidentUpdate" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "incidentId" TEXT NOT NULL,
  "state"      "IncidentState" NOT NULL,
  "message"    TEXT NOT NULL,
  "postedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IncidentUpdate_incidentId_fkey"
    FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IncidentUpdate_incidentId_postedAt_idx" ON "IncidentUpdate"("incidentId","postedAt");
