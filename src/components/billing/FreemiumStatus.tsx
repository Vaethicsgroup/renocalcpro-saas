// src/components/billing/FreemiumStatus.tsx
// Bloc UI MVP freemium — badge "Offre gratuite", compteur projets restants,
// CTA upgrade quand pertinent. NE PILOTE PAS la policy : reflète l'état décidé
// côté serveur (props passées par la page). Le client ne décide jamais des
// limites.
//
// Composant ADDITIF — n'est importé nulle part par défaut. La page projet /
// dashboard peut l'intégrer sans risquer de casser le boot Next.

"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  type BillingPlan,
  getBillingPlanLabelFr,
  getPlanLimits,
} from "@/lib/billing/plan-limits";
import {
  type UpgradeReason,
  getUpgradeReason,
} from "@/lib/billing/usage-policy";

export interface FreemiumStatusProps {
  /** Plan billing courant (décidé côté serveur). */
  plan: BillingPlan;
  /** Projets restants — number ou "unlimited". */
  remainingProjects: number | "unlimited";
  /**
   * Si défini, affiche le CTA d'upgrade ciblé sur la raison (ex: après refus de
   * création projet / export PDF). Décidé par la page serveur, jamais inventé.
   */
  blockedReason?: UpgradeReason;
  /** Callback bouton "Passer à Pro" — typiquement push vers /pricing. */
  onUpgradeClick?: () => void;
  /** Slot optionnel (ex: lien support). */
  footer?: ReactNode;
}

export function FreemiumStatus({
  plan,
  remainingProjects,
  blockedReason,
  onUpgradeClick,
  footer,
}: FreemiumStatusProps): JSX.Element {
  const t = useTranslations("freemiumStatus");
  const isFree = plan === "FREE";
  const planLabel = getBillingPlanLabelFr(plan);
  const cta = blockedReason ? getUpgradeReason(blockedReason) : null;

  // Compteur visuel « 0 / 1 » pour FREE — basé sur les limites réelles du plan.
  const limits = getPlanLimits(plan);
  const maxProjects =
    limits.maxProjects === "unlimited" ? null : limits.maxProjects;
  const usedProjects =
    typeof remainingProjects === "number" && maxProjects !== null
      ? Math.max(0, maxProjects - remainingProjects)
      : null;
  const ratio =
    usedProjects !== null && maxProjects !== null && maxProjects > 0
      ? Math.min(1, usedProjects / maxProjects)
      : 0;
  const isSaturated =
    isFree && typeof remainingProjects === "number" && remainingProjects === 0;

  return (
    <div
      className="rounded-lg border border-cream-300 bg-white p-4 shadow-card"
      data-testid="freemium-status"
      data-plan={plan}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={
                isFree
                  ? "rounded-full bg-cream-200 px-2 py-0.5 text-xs font-semibold text-stone-700"
                  : "rounded-full bg-forest-100 px-2 py-0.5 text-xs font-semibold text-forest-800"
              }
            >
              {planLabel}
            </span>
            {isFree ? (
              <span className="text-sm font-medium text-stone-900 tabular-nums">
                {remainingProjects === "unlimited"
                  ? t("unlimited")
                  : t("freeUsed", { used: usedProjects ?? 0, max: maxProjects ?? 1 })}
              </span>
            ) : (
              <span className="text-sm text-stone-700">
                {t("planActive", { label: planLabel })}
              </span>
            )}
          </div>

          {/* Progress bar « usage gratuit » */}
          {isFree && maxProjects !== null ? (
            <div
              className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-cream-200"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={maxProjects}
              aria-valuenow={usedProjects ?? 0}
              aria-label={t("ariaProgress")}
            >
              <div
                className={[
                  "h-full transition-[width,background-color] duration-300",
                  isSaturated ? "bg-terracotta-500" : "bg-forest-600",
                ].join(" ")}
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
          ) : null}
        </div>

        {isFree && onUpgradeClick ? (
          <button
            type="button"
            onClick={onUpgradeClick}
            className="rounded-md bg-terracotta-500 px-3 py-1.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 focus-visible:ring-offset-2"
            data-testid="freemium-upgrade-cta"
          >
            {t("btnUpgrade")}
          </button>
        ) : null}
      </div>

      {cta ? (
        <div
          className="mt-3 rounded-md border border-terracotta-200 bg-terracotta-50 p-3"
          role="status"
          data-testid="freemium-block-cta"
          data-reason={blockedReason}
        >
          <div className="text-sm font-semibold text-terracotta-800">{cta.title}</div>
          <div className="mt-1 text-sm text-stone-700">{cta.body}</div>
          {onUpgradeClick ? (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="mt-2 inline-flex items-center rounded-md bg-terracotta-500 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition-colors hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 focus-visible:ring-offset-2"
            >
              {cta.ctaLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      {footer ? <div className="mt-3 text-xs text-stone-500">{footer}</div> : null}
    </div>
  );
}
