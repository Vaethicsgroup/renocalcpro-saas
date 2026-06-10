"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { submitBetaApplicationAction } from "@/server/actions/beta";

export function BetaApplicationForm() {
  const t = useTranslations("betaForm");
  const SEGMENTS = [
    { value: "AUDITEUR", label: t("segAud") },
    { value: "DIAGNOSTIQUEUR", label: t("segDiag") },
    { value: "SYNDIC", label: t("segSyn") },
    { value: "COPROPRIETAIRE", label: t("segCopro") },
    { value: "PARTICULIER", label: t("segPart") },
    { value: "AUTRE", label: t("segAutre") },
  ];
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [segment, setSegment] = useState("AUDITEUR");
  const [expectations, setExpectations] = useState("");
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await submitBetaApplicationAction({ email, fullName, segment, expectations });
      if (r.ok) setSubmitted(true);
      else setError(r.error ?? "unknown_error");
    });
  }

  if (submitted) {
    return (
      <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
        {t("successMsg")} <strong>{email}</strong>.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <label className="block">
        <span className="block text-xs font-medium text-stone-700">{t("labelEmail")}</span>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="block text-xs font-medium text-stone-700">{t("labelFullName")}</span>
        <input
          type="text"
          required
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="block text-xs font-medium text-stone-700">{t("labelSegment")}</span>
        <select
          value={segment}
          onChange={e => setSegment(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="block text-xs font-medium text-stone-700">{t("labelExpectations")}</span>
        <textarea
          rows={4}
          required
          value={expectations}
          onChange={e => setExpectations(e.target.value)}
          placeholder={t("expectationsPh")}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </label>

      <button
        type="button"
        disabled={pending || !email || fullName.length < 2 || expectations.length < 20}
        onClick={submit}
        className="rounded-md bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
      >
        {pending ? t("btnSending") : t("btnSubmit")}
      </button>

      {error && (
        <div role="alert" className="rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
          ✗ {error === "email_already_registered" ? t("errEmailDup") :
              error === "quota_reached" ? t("errQuota") :
              error}
        </div>
      )}
    </div>
  );
}
