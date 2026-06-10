-- Catalog overrides — édition admin des catalogues métier hors-code

CREATE TYPE "CatalogOverrideKind" AS ENUM ('MATERIAL', 'SYSTEM');

CREATE TABLE "CatalogOverride" (
  "id"              TEXT NOT NULL,
  "kind"            "CatalogOverrideKind" NOT NULL,
  "entryId"         TEXT NOT NULL,
  "patch"           JSONB NOT NULL,
  "enabled"         BOOLEAN NOT NULL DEFAULT TRUE,
  "reason"          TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogOverride_kind_entryId_key" ON "CatalogOverride"("kind", "entryId");
CREATE INDEX "CatalogOverride_kind_enabled_idx" ON "CatalogOverride"("kind", "enabled");

CREATE TABLE "CatalogOverrideHistory" (
  "id"               TEXT NOT NULL,
  "overrideId"       TEXT NOT NULL,
  "previousPatch"    JSONB NOT NULL,
  "newPatch"         JSONB NOT NULL,
  "changedByUserId"  TEXT NOT NULL,
  "changeReason"     TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogOverrideHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CatalogOverrideHistory_overrideId_createdAt_idx" ON "CatalogOverrideHistory"("overrideId", "createdAt");

ALTER TABLE "CatalogOverrideHistory"
  ADD CONSTRAINT "CatalogOverrideHistory_overrideId_fkey"
  FOREIGN KEY ("overrideId") REFERENCES "CatalogOverride"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
