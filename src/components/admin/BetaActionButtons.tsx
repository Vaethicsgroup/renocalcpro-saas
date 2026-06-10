"use client";

import { useTransition } from "react";
import { acceptBetaApplicationAction, rejectBetaApplicationAction } from "@/server/actions/beta";

export function BetaActionButtons({ applicationId }: { applicationId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Accepter cette candidature ? Email d'invitation envoyé immédiatement.")) return;
          startTransition(() => acceptBetaApplicationAction(applicationId));
        }}
        className="rounded-md border border-emerald-600 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
      >
        ✓ Accepter
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const reason = prompt("Raison du rejet (optionnel) :", "Liste d'attente — quota atteint");
          if (reason === null) return;
          startTransition(() => rejectBetaApplicationAction(applicationId, reason));
        }}
        className="rounded-md border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
      >
        ✗ Rejeter
      </button>
    </div>
  );
}
