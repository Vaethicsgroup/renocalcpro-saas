"use client";
// components/audit/HygroChecker.tsx
// Vérifie la compatibilité hygrothermique entre un mur et une finition.
// Affiche alerte critique / warning avec recommandations.

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getMaterialsByCategory,
  checkHygroCompatibility,
  type HygroCheck,
} from "@renocal/core";

interface Props {
  /** Id du mur sélectionné (par MaterialPicker en amont). */
  wallId: string;
  /** Id finition initiale (optionnel). */
  defaultFinishId?: string;
  /** Callback quand l'utilisateur change la finition. */
  onChange?: (finishId: string, check: HygroCheck) => void;
}

const SEVERITY_COLOR = {
  none:     { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-900", icon: "✓", labelKey: "sevCompat" },
  warning:  { bg: "bg-amber-50",   border: "border-amber-400",   text: "text-amber-900",   icon: "⚠", labelKey: "sevWarning" },
  critical: { bg: "bg-rose-50",    border: "border-rose-500",    text: "text-rose-900",    icon: "⛔", labelKey: "sevCritical" },
} as const;

export function HygroChecker({ wallId, defaultFinishId, onChange }: Props) {
  const t = useTranslations("hygroChecker");
  const finishes = useMemo(() => getMaterialsByCategory("finish"), []);
  const [finishId, setFinishId] = useState<string>(defaultFinishId ?? finishes[0]?.id ?? "");

  const check = useMemo(() => {
    if (!wallId || !finishId) return null;
    return checkHygroCompatibility(wallId, finishId);
  }, [wallId, finishId]);

  function selectFinish(id: string) {
    setFinishId(id);
    if (id && wallId) {
      const c = checkHygroCompatibility(wallId, id);
      onChange?.(id, c);
    }
  }

  const palette = check ? SEVERITY_COLOR[check.severity] : SEVERITY_COLOR.none;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <h3 className="text-base font-semibold text-stone-900">{t("title")}</h3>
      <p className="mt-1 text-xs text-stone-600">{t("subtitle")}</p>

      <label className="mt-4 block">
        <span className="text-xs font-medium text-stone-700">{t("finishLabel")}</span>
        <select
          value={finishId}
          onChange={e => selectFinish(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm focus-visible:border-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
        >
          {finishes.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </label>

      {check && (
        <div role={check.severity === "critical" ? "alert" : check.severity === "warning" ? "status" : undefined}
             className={`mt-4 rounded-lg border-2 p-4 ${palette.bg} ${palette.border} ${palette.text}`}>
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-xl leading-none">{palette.icon}</span>
            <div className="flex-1">
              <h4 className="font-semibold">{t(palette.labelKey)}</h4>
              <ul className="mt-2 space-y-1 text-xs">
                {check.reasons.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>

              {check.recommendations.length > 0 && (
                <div className="mt-3 border-t border-current/20 pt-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wider opacity-90">{t("recommendations")}</h5>
                  <ul className="mt-1 space-y-1 text-xs">
                    {check.recommendations.map((r, i) => <li key={i}>✓ {r}</li>)}
                  </ul>
                </div>
              )}

              {check.references && check.references.length > 0 && (
                <p className="mt-3 text-[10px] opacity-75">
                  {t("references")} {check.references.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
