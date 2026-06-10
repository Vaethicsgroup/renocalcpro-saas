-- Sprint 25 — Assistant IA métier (additif, zéro impact existant)

CREATE TYPE "AssistantContextType" AS ENUM (
  'FORM_FIELD','FORM_SECTION','CHOICE_HELP','RESULT_EXPLAIN','AID_EXPLAIN',
  'MATERIAL_RECOGNIZE','SYSTEM_RECOGNIZE','GENERAL'
);

CREATE TYPE "AssistantPersona" AS ENUM (
  'INDIVIDUAL','PRO_AUDITEUR','PRO_DIAGNOSTIQUEUR','PRO_ARTISAN','PRO_BE','PRO_ACCOMPAGNATEUR'
);

CREATE TYPE "AssistantMessageRole" AS ENUM ('USER','ASSISTANT','SYSTEM_NOTE');

CREATE TYPE "AssistantConfidence" AS ENUM ('CERTAIN','ESTIMATED','UNCERTAIN','UNKNOWN');

CREATE TABLE "AssistantConversation" (
  "id"             TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId"         TEXT,
  "projectId"      TEXT,
  "persona"        "AssistantPersona"     NOT NULL DEFAULT 'INDIVIDUAL',
  "contextType"    "AssistantContextType" NOT NULL DEFAULT 'GENERAL',
  "contextRef"     TEXT,
  "locale"         TEXT NOT NULL DEFAULT 'fr',
  "promptVersion"  TEXT NOT NULL DEFAULT 'v1.2026-05',
  "tokensIn"       INTEGER NOT NULL DEFAULT 0,
  "tokensOut"      INTEGER NOT NULL DEFAULT 0,
  "closedAt"       TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL
);
CREATE INDEX "AssistantConversation_org_created_idx" ON "AssistantConversation"("organizationId","createdAt");
CREATE INDEX "AssistantConversation_user_created_idx" ON "AssistantConversation"("userId","createdAt");
CREATE INDEX "AssistantConversation_project_ctx_idx" ON "AssistantConversation"("projectId","contextType");

CREATE TABLE "AssistantMessage" (
  "id"              TEXT PRIMARY KEY,
  "conversationId"  TEXT NOT NULL REFERENCES "AssistantConversation"("id") ON DELETE CASCADE,
  "role"            "AssistantMessageRole" NOT NULL,
  "content"         TEXT NOT NULL,
  "confidence"      "AssistantConfidence",
  "sources"         JSONB,
  "guardsTriggered" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "tokensUsed"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AssistantMessage_conv_created_idx" ON "AssistantMessage"("conversationId","createdAt");

CREATE TABLE "AssistantFeedback" (
  "id"              TEXT PRIMARY KEY,
  "conversationId"  TEXT NOT NULL REFERENCES "AssistantConversation"("id") ON DELETE CASCADE,
  "messageId"       TEXT,
  "helpful"         BOOLEAN,
  "issueKind"       TEXT,
  "comment"         TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AssistantFeedback_conv_created_idx" ON "AssistantFeedback"("conversationId","createdAt");
CREATE INDEX "AssistantFeedback_helpful_created_idx" ON "AssistantFeedback"("helpful","createdAt");
