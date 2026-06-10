"use client";
// components/admin/ReplayDeliveryButton.tsx — Bouton replay manuel d'une delivery échouée.

import { useTransition } from "react";
import { replayDeliveryAction } from "@/server/actions/webhooks";

export function ReplayDeliveryButton({ orgId, deliveryId }: { orgId: string; deliveryId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Replay cette livraison ? Sera retentée par le prochain run du worker cron.")) return;
        startTransition(() => replayDeliveryAction(orgId, deliveryId));
      }}
      className="rounded-md border border-amber-600 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
    >
      {pending ? "…" : "↻ Replay"}
    </button>
  );
}
