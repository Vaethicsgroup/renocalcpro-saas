-- Status email subscribers — abonnement aux notifications incidents

CREATE TABLE "StatusSubscriber" (
  "id"               TEXT NOT NULL,
  "email"            TEXT NOT NULL,
  "locale"           TEXT NOT NULL DEFAULT 'fr',
  "components"       TEXT[] DEFAULT ARRAY[]::TEXT[],
  "unsubscribeToken" TEXT NOT NULL,
  "confirmedAt"      TIMESTAMP(3),
  "unsubscribedAt"   TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StatusSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StatusSubscriber_email_key" ON "StatusSubscriber"("email");
CREATE UNIQUE INDEX "StatusSubscriber_unsubscribeToken_key" ON "StatusSubscriber"("unsubscribeToken");
CREATE INDEX "StatusSubscriber_email_idx" ON "StatusSubscriber"("email");
CREATE INDEX "StatusSubscriber_confirmedAt_unsubscribedAt_idx" ON "StatusSubscriber"("confirmedAt", "unsubscribedAt");
