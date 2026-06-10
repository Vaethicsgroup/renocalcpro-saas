-- 20260509_email_mock_log
CREATE TABLE IF NOT EXISTS "EmailMockLog" (
  "id"             TEXT NOT NULL PRIMARY KEY,
  "toEmail"        TEXT NOT NULL,
  "template"       TEXT NOT NULL,
  "locale"         TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "html"           TEXT NOT NULL,
  "text"           TEXT NOT NULL,
  "sentByUserId"   TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "EmailMockLog_toEmail_createdAt_idx"  ON "EmailMockLog"("toEmail","createdAt");
CREATE INDEX IF NOT EXISTS "EmailMockLog_template_createdAt_idx" ON "EmailMockLog"("template","createdAt");
