-- Beta program — candidatures + statut acceptation

CREATE TYPE "BetaApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE "BetaSegment" AS ENUM ('AUDITEUR', 'DIAGNOSTIQUEUR', 'SYNDIC', 'COPROPRIETAIRE', 'PARTICULIER', 'AUTRE');

CREATE TABLE "BetaApplication" (
  "id"               TEXT NOT NULL,
  "email"            TEXT NOT NULL,
  "fullName"         TEXT NOT NULL,
  "segment"          "BetaSegment" NOT NULL,
  "expectations"     TEXT NOT NULL,
  "profilePhotoUrl"  TEXT,
  "status"           "BetaApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "adminNotes"       TEXT,
  "createdUserId"    TEXT,
  "acceptedAt"       TIMESTAMP(3),
  "rejectedAt"       TIMESTAMP(3),
  "rejectedReason"   TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BetaApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BetaApplication_email_key" ON "BetaApplication"("email");
CREATE INDEX "BetaApplication_status_createdAt_idx" ON "BetaApplication"("status", "createdAt");
CREATE INDEX "BetaApplication_segment_idx" ON "BetaApplication"("segment");
