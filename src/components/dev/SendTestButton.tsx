"use client";
// components/dev/SendTestButton.tsx
// Bouton "envoyer un test à mon email" depuis le dev preview.

import { useTransition, useState } from "react";
import { sendTestEmailAction } from "@/server/actions/dev";
import type { TemplateName, Locale } from "@/lib/email/templates";

export function SendTestButton({ template, locale }: { template: TemplateName; locale: Locale }) {
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function send() {
    setFeedback(null);
    start(async () => {
      const r = await sendTestEmailAction(template, locale);
      setFeedback(r.ok ? `✓ Envoi simulé enregistré (${r.id})` : `✗ ${r.error}`);
    });
  }

  return (
    <div className="flex items-center gap-3">
      {feedback && <span className={`text-xs ${feedback.startsWith("✓") ? "text-teal-700" : "text-rose-700"}`}>{feedback}</span>}
      <button
        onClick={send}
        disabled={pending}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
      >
        {pending ? "Envoi…" : "📤 Envoyer un test à moi-même"}
      </button>
    </div>
  );
}
