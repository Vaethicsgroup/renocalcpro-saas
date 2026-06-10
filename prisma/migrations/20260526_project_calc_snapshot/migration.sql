-- ────────────────────────────────────────────────────────────────────────────
--  Migration : ProjectCalcSnapshot — persistance moteur de calcul
--  Sprint v3.0 — créé 2026-05-26
--
--  Table : un snapshot = un calcul moteur complet (inputs + baseline +
--  scénarios + aides + warnings). Immutable. Versionné via engineVersion +
--  parametersVersion. Colonnes extraites indexées pour listing rapide ;
--  payload complet conservé en JSONB pour évolution future.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "ProjectCalcSnapshot" (
    "id"                    TEXT NOT NULL,
    "organizationId"        TEXT NOT NULL,
    "projectId"             TEXT NOT NULL,
    "engineVersion"         TEXT NOT NULL,
    "parametersVersion"     TEXT NOT NULL,
    "buildingInputs"        JSONB NOT NULL,
    "householdInputs"       JSONB,
    "scenarioInputs"        JSONB NOT NULL,
    "baselineUaWK"          DOUBLE PRECISION NOT NULL,
    "baselineCepKwhM2"      DOUBLE PRECISION NOT NULL,
    "baselineGesKgM2"       DOUBLE PRECISION NOT NULL,
    "baselineDpeLabel"      TEXT NOT NULL,
    "baselineGesLabel"      TEXT NOT NULL,
    "baselineCostEur"       DOUBLE PRECISION NOT NULL,
    "baselineHeatingKwh"    DOUBLE PRECISION NOT NULL,
    "baselineDhwKwh"        DOUBLE PRECISION NOT NULL,
    "recommendedScenarioId" TEXT,
    "scenariosCount"        INTEGER NOT NULL DEFAULT 0,
    "warningsCount"         INTEGER NOT NULL DEFAULT 0,
    "fullResult"            JSONB NOT NULL,
    "notes"                 TEXT,
    "computedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectCalcSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectCalcSnapshot_projectId_computedAt_idx"
    ON "ProjectCalcSnapshot"("projectId", "computedAt" DESC);

CREATE INDEX "ProjectCalcSnapshot_organizationId_computedAt_idx"
    ON "ProjectCalcSnapshot"("organizationId", "computedAt" DESC);

CREATE INDEX "ProjectCalcSnapshot_organizationId_baselineDpeLabel_idx"
    ON "ProjectCalcSnapshot"("organizationId", "baselineDpeLabel");

CREATE INDEX "ProjectCalcSnapshot_engineVersion_parametersVersion_idx"
    ON "ProjectCalcSnapshot"("engineVersion", "parametersVersion");

ALTER TABLE "ProjectCalcSnapshot"
    ADD CONSTRAINT "ProjectCalcSnapshot_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectCalcSnapshot"
    ADD CONSTRAINT "ProjectCalcSnapshot_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
