"use client";
// components/admin/FlagControlForm.tsx
// Contrôles inline pour piloter un feature flag depuis l'admin.

import { useState, useTransition } from "react";
import { updateFeatureFlagAction } from "@/server/actions/featureFlags";

interface Props {
  flagKey: string;
  currentEnabled: boolean;
  currentRollout: number;
}

export function FlagControlForm({ flagKey, currentEnabled, currentRollout }: Props) {
  const [enabled, setEnabled] = useState(currentEnabled);
  const [rollout, setRollout] = useState(currentRollout);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updateFeatureFlagAction({ key: flagKey, enabled, rolloutPercent: rollout });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="mt-4 grid items-center gap-3 sm:grid-cols-[auto_1fr_auto]">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="accent-teal-700" />
        Enabled
      </label>

      <label className="flex items-center gap-3 text-xs">
        <span className="font-medium text-stone-700 whitespace-nowrap">Rollout %</span>
        <input
          type="range" min="0" max="100" step="1"
          value={rollout}
          onChange={e => setRollout(Number(e.target.value))}
          className="w-full accent-teal-700"
        />
        <span className="w-10 text-right font-mono font-semibold">{rollout}%</span>
      </label>

      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="rounded-md bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
      >
        {pending ? "…" : saved ? "✓ Sauvé" : "Appliquer"}
      </button>
    </div>
  );
}
