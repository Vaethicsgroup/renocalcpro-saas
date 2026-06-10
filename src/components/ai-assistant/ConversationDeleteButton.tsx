"use client";
// components/ai-assistant/ConversationDeleteButton.tsx
// Bouton de suppression conversation avec modal de confirmation (RGPD art. 17).

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  conversationId: string;
  /** URL de redirection après suppression réussie */
  redirectTo?: string;
}

export function ConversationDeleteButton({ conversationId, redirectTo }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const resp = await fetch(`/api/v1/me/conversations/${conversationId}`, { method: "DELETE" });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setError(body.error ?? "delete_failed");
        setBusy(false);
        return;
      }
      // Succès — rediriger
      router.push(redirectTo ?? "../");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100"
      >
        🗑 Supprimer (RGPD art. 17)
      </button>
    );
  }

  return (
    <div className="rounded-lg border-2 border-rose-300 bg-rose-50 p-3" role="alertdialog" aria-labelledby="delconv-title">
      <p id="delconv-title" className="text-sm font-semibold text-rose-900">
        Confirmer la suppression définitive ?
      </p>
      <p className="mt-1 text-xs text-rose-800">
        Cette conversation sera supprimée immédiatement (suppression douce + purge cron sous 30 jours).
        Cette action est irréversible.
      </p>
      {error && <p className="mt-2 text-xs font-semibold text-rose-700">Erreur : {error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="rounded-md bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
        >
          {busy ? "Suppression…" : "Oui, supprimer"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
