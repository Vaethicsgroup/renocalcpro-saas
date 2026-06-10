-- Sprint 27 — Soft delete RGPD art. 17 sur AssistantConversation
ALTER TABLE "AssistantConversation"
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedReason" TEXT;

CREATE INDEX "AssistantConversation_deletedAt_idx" ON "AssistantConversation"("deletedAt");
