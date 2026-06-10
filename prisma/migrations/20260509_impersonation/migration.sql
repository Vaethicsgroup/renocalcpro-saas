-- 20260509_impersonation
-- Table immuable d'audit pour l'impersonification admin → utilisateur.

CREATE TABLE IF NOT EXISTS "Impersonation" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "adminUserId"  TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "reason"       TEXT NOT NULL,
  "startedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"    TIMESTAMP(3) NOT NULL,
  "endedAt"      TIMESTAMP(3),
  "ipAddress"    TEXT,
  "userAgent"    TEXT,
  "tokenHash"    TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Impersonation_tokenHash_key"            ON "Impersonation"("tokenHash");
CREATE INDEX IF NOT EXISTS "Impersonation_adminUserId_startedAt_idx"        ON "Impersonation"("adminUserId","startedAt");
CREATE INDEX IF NOT EXISTS "Impersonation_targetUserId_startedAt_idx"       ON "Impersonation"("targetUserId","startedAt");
CREATE INDEX IF NOT EXISTS "Impersonation_expiresAt_idx"                    ON "Impersonation"("expiresAt");
