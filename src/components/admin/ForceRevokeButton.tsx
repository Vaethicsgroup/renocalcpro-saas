"use client";
// components/admin/ForceRevokeButton.tsx — Force-revoke d'une session impersonification active.

import { useTransition } from "react";
import { forceRevokeImpersonationAction } from "@/server/actions/admin";

export function ForceRevokeButton({ impersonationId }: { impersonationId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Force-revoke cette session impersonification ? L'admin sera déconnecté immédiatement de la cible.")) return;
        startTransition(() => forceRevokeImpersonationAction(impersonationId));
      }}
      className="rounded-md border border-rose-600 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
    >
      {pending ? "…" : "Force-revoke"}
    </button>
  );
}
