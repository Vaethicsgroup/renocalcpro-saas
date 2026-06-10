-- ProjectMaterialSelection — persistance optionnelle des choix matériau du bâti initial

CREATE TYPE "MaterialSelectionSource" AS ENUM ('UI', 'PHOTO', 'API', 'IMPORT');

CREATE TYPE "MaterialSelectionConfidence" AS ENUM ('OBSERVED', 'ESTIMATED', 'SUPPOSED', 'UNKNOWN');

CREATE TABLE "ProjectMaterialSelection" (
  "id"             TEXT NOT NULL,
  "projectId"      TEXT NOT NULL,
  "materialId"     TEXT NOT NULL,
  "category"       TEXT NOT NULL,
  "confidence"     "MaterialSelectionConfidence" NOT NULL DEFAULT 'SUPPOSED',
  "source"         "MaterialSelectionSource" NOT NULL DEFAULT 'UI',
  "addedByUserId"  TEXT NOT NULL,
  "note"           TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectMaterialSelection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectMaterialSelection_projectId_createdAt_idx" ON "ProjectMaterialSelection"("projectId", "createdAt");
CREATE INDEX "ProjectMaterialSelection_materialId_idx" ON "ProjectMaterialSelection"("materialId");
CREATE INDEX "ProjectMaterialSelection_source_idx" ON "ProjectMaterialSelection"("source");
CREATE INDEX "ProjectMaterialSelection_category_idx" ON "ProjectMaterialSelection"("category");

ALTER TABLE "ProjectMaterialSelection"
  ADD CONSTRAINT "ProjectMaterialSelection_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
