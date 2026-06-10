-- ApiScope enum + ApiKey model
CREATE TYPE "ApiScope" AS ENUM ('BASIC', 'FULL');

CREATE TABLE "ApiKey" (
  "id"              TEXT NOT NULL,
  "organizationId"  TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "prefix"          TEXT NOT NULL,
  "secretHash"      TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "scope"           "ApiScope" NOT NULL DEFAULT 'BASIC',
  "allowedOrigins"  TEXT[] DEFAULT ARRAY[]::TEXT[],
  "lastUsedAt"      TIMESTAMP(3),
  "lastUsedIp"      TEXT,
  "revokedAt"       TIMESTAMP(3),
  "expiresAt"       TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApiKey_prefix_key" ON "ApiKey"("prefix");
CREATE INDEX "ApiKey_organizationId_revokedAt_idx" ON "ApiKey"("organizationId", "revokedAt");
CREATE INDEX "ApiKey_prefix_idx" ON "ApiKey"("prefix");

ALTER TABLE "ApiKey"
  ADD CONSTRAINT "ApiKey_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
