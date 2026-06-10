"use client";
// components/settings/CreateApiKeyForm.tsx — Formulaire création + affichage one-time secret.

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createApiKeyAction } from "@/server/actions/apiKeys";

export function CreateApiKeyForm({ orgId }: { orgId: string }) {
  const t = useTranslations("apiKeyForm");
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"BASIC" | "FULL">("BASIC");
  const [expiresInDays, setExpiresInDays] = useState<number | "">("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ prefix: string; secretFull: string } | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await createApiKeyAction({
          organizationId: orgId,
          name,
          scope,
          expiresInDays: expiresInDays === "" ? null : Number(expiresInDays),
        });
        setCreated({ prefix: res.prefix, secretFull: res.secretFull });
        setName("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "unknown_error");
      }
    });
  }

  if (created) {
    return (
      <div className="mt-4 rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
        <h3 className="text-sm font-semibold text-amber-900">{t("secretTitle")}</h3>
        <p className="mt-1 text-xs text-amber-800">
          {t("secretDesc")}
        </p>
        <div className="mt-3 rounded-md bg-white p-3">
          <code className="block break-all font-mono text-sm text-stone-900">{created.secretFull}</code>
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(created.secretFull)}
          className="mt-3 rounded-md border border-amber-600 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
        >
          {t("btnCopy")}
        </button>
        <button
          type="button"
          onClick={() => setCreated(null)}
          className="ml-2 mt-3 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
        >
          {t("btnAck")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="block text-xs font-medium text-stone-700">{t("labelName")}</span>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t("phName")}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:border-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-medium text-stone-700">{t("labelScope")}</span>
        <select
          value={scope}
          onChange={e => setScope(e.target.value as "BASIC" | "FULL")}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="BASIC">{t("scopeBasic")}</option>
          <option value="FULL">{t("scopeFull")}</option>
        </select>
      </label>

      <label className="block">
        <span className="block text-xs font-medium text-stone-700">{t("labelExpiration")}</span>
        <input
          type="number"
          min={1}
          max={3650}
          value={expiresInDays}
          onChange={e => setExpiresInDays(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={t("phExpiration")}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </label>

      <div className="flex items-end">
        <button
          type="button"
          disabled={!name || pending}
          onClick={submit}
          className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? t("creating") : t("btnCreate")}
        </button>
      </div>

      {error && (
        <div role="alert" className="sm:col-span-2 rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
          ✗ {error}
        </div>
      )}
    </div>
  );
}
