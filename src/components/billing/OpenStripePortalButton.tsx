"use client";
// components/billing/OpenStripePortalButton.tsx
// Ouvre le Stripe Customer Portal (ou la page mock en dev).

import { useTransition } from "react";
import { createPortalSessionAction } from "@/server/actions/billing";

export function OpenStripePortalButton({ orgId }: { orgId: string }) {
  const [pending, start] = useTransition();
  function open() {
    start(async () => {
      const { url } = await createPortalSessionAction(orgId);
      window.location.href = url;
    });
  }
  return (
    <button
      onClick={open}
      disabled={pending}
      className="rounded-lg bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
    >
      {pending ? "Ouverture…" : "💳 Gérer mon abonnement"}
    </button>
  );
}
