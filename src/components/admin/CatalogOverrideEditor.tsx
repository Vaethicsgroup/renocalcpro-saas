"use client";
// components/admin/CatalogOverrideEditor.tsx
// Formulaire générique d'édition d'un override catalogue (matériau ou système).

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  createCatalogOverrideAction,
  updateCatalogOverrideAction,
  toggleCatalogOverrideAction,
  deleteCatalogOverrideAction,
} from "@/server/actions/catalogOverrides";

interface ExistingOverride {
  id: string;
  patch: unknown;
  enabled: boolean;
  reason: string;
}

interface Props {
  kind: "MATERIAL" | "SYSTEM";
  entryId: string;
  existingOverride?: ExistingOverride;
}

export function CatalogOverrideEditor({ kind, entryId, existingOverride }: Props) {
  const t = useTranslations("catalogOverride");
  const [patchJson, setPatchJson] = useState(JSON.stringify(existingOverride?.patch ?? {}, null, 2));
  const [reason, setReason] = useState(existingOverride?.reason ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    let parsed: unknown;
    try { parsed = JSON.parse(patchJson); }
    catch (e) { setError(`${t("errJsonPrefix")} ${e instanceof Error ? e.message : e}`); return; }

    startTransition(async () => {
      try {
        if (existingOverride) {
          await updateCatalogOverrideAction({ id: existingOverride.id, kind, entryId, patch: parsed, reason });
        } else {
          await createCatalogOverrideAction({ kind, entryId, patch: parsed, reason });
        }
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "unknown_error");
      }
    });
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="text-base font-semibold text-stone-900">
        {existingOverride ? t("editTitle") : t("createTitle")}
      </h2>

      <label className="mt-4 block">
        <span className="text-xs font-medium text-stone-700">{t("labelPatch")}</span>
        <textarea
          rows={10}
          value={patchJson}
          onChange={e => setPatchJson(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-xs"
          placeholder={`{\n  "thermal": { "lambda": 0.041 },\n  "unitPrice": 12.5,\n  "sources": ["DTU 25.41", "PEP CSTB-001"]\n}`}
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-medium text-stone-700">{t("labelReason")}</span>
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm"
          placeholder={t("reasonPh")}
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || !reason.trim() || reason.length < 10}
          onClick={save}
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {pending ? t("saving") : existingOverride ? t("btnUpdate") : t("btnCreate")}
        </button>

        {existingOverride && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => toggleCatalogOverrideAction(existingOverride.id, !existingOverride.enabled))}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              {existingOverride.enabled ? t("btnDeactivate") : t("btnReactivate")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!confirm(t("confirmDelete"))) return;
                startTransition(() => deleteCatalogOverrideAction(existingOverride.id));
              }}
              className="rounded-md border border-rose-600 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              {t("btnDelete")}
            </button>
          </>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
          ✗ {error}
        </div>
      )}
      {saved && (
        <div role="status" className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-900">
          {t("saved")}
        </div>
      )}
    </div>
  );
}
