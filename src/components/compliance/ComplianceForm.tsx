// src/components/compliance/ComplianceForm.tsx
// Formulaire déclaratif client — sauvegarde en localStorage.

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  COMPLIANCE_MATRIX,
  evaluateProfessionalCompliance,
  type ProfessionalProfile,
  type ComplianceData,
} from "@/lib/compliance/professional-compliance";
import {
  clearComplianceData,
  loadComplianceData,
  saveComplianceData,
} from "@/lib/compliance/storage";
import { ProfessionalComplianceCard } from "@/components/compliance/ProfessionalComplianceCard";

interface Props {
  orgId: string;
  locale: string;
}

const PROFILES: ProfessionalProfile[] = [
  "diagnostiqueur",
  "auditeur",
  "bureau_etudes",
  "syndic",
  "agence",
  "pro_general",
];

export function ComplianceForm({ orgId, locale }: Props) {
  const t = useTranslations("complianceForm");
  const tFields = useTranslations("complianceFields");
  const tProfiles = useTranslations("complianceProfiles");

  const [profile, setProfile] = useState<ProfessionalProfile>("pro_general");
  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const data = loadComplianceData(orgId);
    if (data) {
      setFields(data.fields ?? {});
      setExpiresAt(data.expiresAt ?? "");
      // On suppose que le profil n'est pas stocké à part : on garde celui de
      // l'orga. Pour un MVP utilisateur peut tester via le select.
    }
    setHydrated(true);
  }, [orgId]);

  function setField(key: string, value: unknown) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const data: ComplianceData = {
      fields,
      declaredAt: new Date().toISOString(),
      expiresAt: expiresAt || undefined,
    };
    saveComplianceData(orgId, data);
    setToast(t("savedToast"));
    setTimeout(() => setToast(null), 3000);
  }

  function handleReset() {
    clearComplianceData(orgId);
    setFields({});
    setExpiresAt("");
  }

  const defs = COMPLIANCE_MATRIX[profile] ?? [];
  const evaluation = evaluateProfessionalCompliance(profile, {
    fields,
    declaredAt: hydrated ? new Date().toISOString() : undefined,
    expiresAt: expiresAt || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-l-4 border-stone-300 bg-stone-50 p-3 text-xs text-stone-700">
        ℹ {t("storageNotice")}
      </div>

      <ProfessionalComplianceCard profile={profile} orgId={orgId} locale={locale} />

      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
        <div>
          <label htmlFor="profile-select" className="text-sm font-semibold text-stone-700">
            {t("profileSelectLabel")}
          </label>
          <select
            id="profile-select"
            value={profile}
            onChange={(e) => setProfile(e.target.value as ProfessionalProfile)}
            className="mt-1.5 h-10 w-full rounded-md border border-cream-300 bg-white px-3 text-sm focus:border-forest-500 focus:outline-none"
          >
            {PROFILES.map((p) => (
              <option key={p} value={p}>{tProfiles(p)}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4 border-t border-stone-200 pt-5">
          {defs.map((def) => {
            const value = fields[def.key];
            const isInvalid =
              def.required && evaluation.missingFields.includes(def.key);
            return (
              <div key={def.key} className="space-y-1.5">
                <label htmlFor={`field-${def.key}`} className="flex items-center gap-2 text-sm font-medium text-stone-800">
                  <span>{tFields(def.key)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${def.required ? "bg-amber-100 text-amber-900" : "bg-stone-100 text-stone-600"}`}>
                    {def.required ? tFields("requiredBadge") : tFields("optionalBadge")}
                  </span>
                </label>
                {def.type === "checkbox" ? (
                  <label className="flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
                    <input
                      id={`field-${def.key}`}
                      type="checkbox"
                      checked={value === true}
                      onChange={(e) => setField(def.key, e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-stone-300 text-forest-600 focus:ring-forest-300"
                    />
                    <span>{tFields(def.key)}</span>
                  </label>
                ) : def.type === "date" ? (
                  <input
                    id={`field-${def.key}`}
                    type="date"
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => setField(def.key, e.target.value)}
                    aria-invalid={isInvalid}
                    className="h-10 w-full rounded-md border border-cream-300 px-3 text-sm focus:border-forest-500 focus:outline-none"
                  />
                ) : def.type === "siret" ? (
                  <input
                    id={`field-${def.key}`}
                    type="text"
                    inputMode="numeric"
                    placeholder={tFields("siretHelper")}
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => setField(def.key, e.target.value)}
                    aria-invalid={isInvalid}
                    className="h-10 w-full rounded-md border border-cream-300 px-3 text-sm focus:border-forest-500 focus:outline-none"
                  />
                ) : def.type === "file" ? (
                  <input
                    id={`field-${def.key}`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setField(def.key, e.target.files?.[0]?.name ?? "")}
                    className="block w-full text-xs text-stone-700"
                  />
                ) : (
                  <input
                    id={`field-${def.key}`}
                    type="text"
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => setField(def.key, e.target.value)}
                    aria-invalid={isInvalid}
                    className="h-10 w-full rounded-md border border-cream-300 px-3 text-sm focus:border-forest-500 focus:outline-none"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-1.5 border-t border-stone-200 pt-5">
          <label htmlFor="expires-at" className="text-sm font-semibold text-stone-700">
            {t("expirySectionTitle")}
          </label>
          <p className="text-xs text-stone-500">{t("expiryHelper")}</p>
          <input
            id="expires-at"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="mt-1 h-10 w-full max-w-xs rounded-md border border-cream-300 px-3 text-sm focus:border-forest-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-stone-200 pt-5">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-800"
          >
            {t("btnSave")}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-10 items-center justify-center rounded-md border border-cream-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            {t("btnReset")}
          </button>
          {toast && (
            <span role="status" className="text-xs font-medium text-forest-700">
              {toast}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
