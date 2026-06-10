"use client";
// components/settings/SendTestWebhookButton.tsx
// Émet un webhook test PING + affiche le résultat live.

import { useState, useTransition } from "react";
import { sendTestWebhookAction } from "@/server/actions/webhooks";

interface Props {
  orgId: string;
  webhookId: string;
  webhookName: string;
}

interface Result {
  ok: boolean;
  status?: number;
  latencyMs?: number;
  responseBody?: string;
  error?: string;
}

export function SendTestWebhookButton({ orgId, webhookId, webhookName }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  function send() {
    setResult(null);
    startTransition(async () => {
      const r = await sendTestWebhookAction(orgId, webhookId);
      setResult(r);
    });
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={pending}
        onClick={send}
        className="rounded-md border border-teal-600 px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50"
      >
        {pending ? "📡 Envoi…" : "📡 Envoyer un évènement test"}
      </button>

      {result && (
        <div role="status"
             className={`mt-2 rounded-lg border-2 p-3 text-xs ${
               result.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-rose-300 bg-rose-50 text-rose-900"
             }`}>
          <p className="font-semibold">
            {result.ok ? "✓ Webhook test livré" : "✗ Webhook test échoué"}
            {" "}<span className="font-normal opacity-80">vers {webhookName}</span>
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
            {result.status != null && <><dt className="text-stone-600">Status :</dt><dd className="font-mono">{result.status}</dd></>}
            {result.latencyMs != null && <><dt className="text-stone-600">Latence :</dt><dd className="font-mono">{result.latencyMs} ms</dd></>}
            {result.error && <><dt className="text-stone-600">Erreur :</dt><dd className="font-mono">{result.error}</dd></>}
          </dl>
          {result.responseBody && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[10px] font-semibold">Body de la réponse ({result.responseBody.length} chars)</summary>
              <pre className="mt-1 max-h-32 overflow-auto rounded bg-white p-2 text-[10px]">{result.responseBody}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
