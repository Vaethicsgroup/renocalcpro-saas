"use client";
// components/admin/ImpersonateButton.tsx — Impersonification avec modal de confirmation.

import { useState, useTransition } from "react";

interface Props {
  userId: string;
  userEmail: string;
  onConfirm: (userId: string, reason: string) => Promise<void>;
}

export function ImpersonateButton({ userId, userEmail, onConfirm }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    if (reason.trim().length < 10) {
      alert("Motif d'impersonification requis (≥ 10 caractères, audit log immuable).");
      return;
    }
    startTransition(async () => {
      await onConfirm(userId, reason.trim());
      setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-800 transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
      >
        🎭 Impersonate
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="impersonate-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="impersonate-title" className="font-serif text-xl font-bold text-rose-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
              ⚠ Impersonification
            </h3>
            <p className="mt-3 text-sm text-stone-700">
              Vous êtes sur le point de prendre l'identité de <strong>{userEmail}</strong>. Toute action sera loggée
              dans l'audit log immuable avec votre identité administrateur. À utiliser uniquement pour le support.
            </p>
            <label className="mt-4 block text-sm">
              <span className="font-medium text-stone-700">Motif (audit) *</span>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="Ex : ticket support #1234 — investigation bug PDF"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
                required
                minLength={10}
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-stone-600 hover:bg-stone-100">
                Annuler
              </button>
              <button onClick={handleConfirm} disabled={pending} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50">
                {pending ? "…" : "Impersonifier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
