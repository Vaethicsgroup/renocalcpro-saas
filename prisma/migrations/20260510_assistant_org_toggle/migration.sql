-- Sprint 28 — Toggle désactivation assistant IA par org
ALTER TABLE "Organization" ADD COLUMN "assistantEnabled" BOOLEAN NOT NULL DEFAULT true;
