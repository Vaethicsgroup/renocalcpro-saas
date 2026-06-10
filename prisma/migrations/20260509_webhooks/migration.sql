-- Webhooks outbound (HMAC-SHA256 signed)

CREATE TYPE "WebhookEvent" AS ENUM (
  'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_ARCHIVED',
  'REPORT_QUEUED', 'REPORT_READY', 'REPORT_FAILED',
  'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED',
  'SUBSCRIPTION_UPDATED'
);

CREATE TYPE "WebhookDeliveryStatus" AS ENUM (
  'PENDING', 'IN_FLIGHT', 'DELIVERED', 'RETRYING', 'FAILED', 'CANCELLED'
);

CREATE TABLE "Webhook" (
  "id"                   TEXT NOT NULL,
  "organizationId"       TEXT NOT NULL,
  "createdByUserId"      TEXT NOT NULL,
  "name"                 TEXT NOT NULL,
  "url"                  TEXT NOT NULL,
  "secret"               TEXT NOT NULL,
  "events"               "WebhookEvent"[],
  "active"               BOOLEAN NOT NULL DEFAULT TRUE,
  "consecutiveFailures"  INTEGER NOT NULL DEFAULT 0,
  "disabledAt"           TIMESTAMP(3),
  "disabledReason"       TEXT,
  "lastSuccessAt"        TIMESTAMP(3),
  "lastFailureAt"        TIMESTAMP(3),
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Webhook_organizationId_active_idx" ON "Webhook"("organizationId", "active");
CREATE INDEX "Webhook_active_disabledAt_idx" ON "Webhook"("active", "disabledAt");

ALTER TABLE "Webhook"
  ADD CONSTRAINT "Webhook_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WebhookDelivery" (
  "id"                  TEXT NOT NULL,
  "webhookId"           TEXT NOT NULL,
  "event"               "WebhookEvent" NOT NULL,
  "payload"             TEXT NOT NULL,
  "status"              "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount"        INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt"       TIMESTAMP(3),
  "lastResponseStatus"  INTEGER,
  "lastResponseBody"    TEXT,
  "lastError"           TEXT,
  "durationMs"          INTEGER,
  "signature"           TEXT NOT NULL,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebhookDelivery_webhookId_createdAt_idx" ON "WebhookDelivery"("webhookId", "createdAt");
CREATE INDEX "WebhookDelivery_status_nextAttemptAt_idx" ON "WebhookDelivery"("status", "nextAttemptAt");
CREATE INDEX "WebhookDelivery_event_createdAt_idx" ON "WebhookDelivery"("event", "createdAt");

ALTER TABLE "WebhookDelivery"
  ADD CONSTRAINT "WebhookDelivery_webhookId_fkey"
  FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
