// src/components/billing/DashboardFreemiumCard.tsx — étape E + UX freemium léger
// Server Component intégrable dans /p/dashboard et /p/projects.
// Affiche :
//   - badge plan (PlanBadge)
//   - phrase compteur projets « 0 / 1 » plus compteur visuel (FREE)
//   - micro-liste d'avantages Pro (pédagogique, jamais agressive)
//   - CTA upgrade en lien serveur (pas de onClick / pas de client-side state)
//
// Pas de "use client". Aucune logique policy : reflète l'état décidé serveur.
// Si tu veux montrer un message "bloqué", passe `blockedReason` — la card
// affichera la copie associée via getUpgradeReason (pure).

import type { JSX, ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PlanBadge } from "./PlanBadge";
import {
  type BillingPlan,
  getPlanLimits,
} from "@/lib/billing/plan-limits";
import {
  getUpgradeReason,
  type UpgradeReason,
} from "@/lib/billing/usage-policy";

export interface DashboardFreemiumCardProps {
  plan: BillingPlan;
  remainingProjects: number | "unlimited";
  /** Locale courante pour construire l'URL d'upgrade. */
  locale: string;
  /** Si défini, affiche la copie d'upgrade associée à la raison. */
  blockedReason?: UpgradeReason;
  /** Slot footer optionnel (ex: lien support). */
  footer?: ReactNode;
}

export async function DashboardFreemiumCard({
  plan,
  remainingProjects,
  locale,
  blockedReason,
  footer,
}: DashboardFreemiumCardProps): Promise<JSX.Element> {
  const t = await getTranslations({ locale, namespace: "freemiumCard" });
  const isFree = plan === "FREE";
  const upgradeHref = `/${locale}/tarifs`;
  const cta = blockedReason ? getUpgradeReason(blockedReason) : null;
  const proBenefits = [t("benefit1"), t("benefit2"), t("benefit3")];

  // Compteur visuel « 0 / 1 » pour FREE — utilise la limite réelle du plan,
  // pas une constante magique. `getPlanLimits` est pur et déjà testé (B-suite).
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

  const counterText =
    remainingProjects === "unlimited"
      ? t("unlimited")
      : isFree
        ? t("freeCounter", { used: usedProjects ?? 0, max: maxProjects ?? 1 })
        : t("remaining", { n: remainingProjects });

  return (
    <section
      aria-label={t("cardAria")}
      data-testid="dashboard-freemium-card"
      data-plan={plan}
      className="rounded-lg border border-cream-300 bg-white p-4 shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <PlanBadge plan={plan} />
            <span className="text-sm font-medium text-stone-900 tabular-nums">
              {counterText}
            </span>
          </div>

          {/* Compteur visuel FREE — discret, pédagogique */}
          {isFree && maxProjects !== null ? (
            <div
              className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-cream-200"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={maxProjects}
              aria-valuenow={usedProjects ?? 0}
              aria-label={t("ariaProjectsUsed")}
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

        {isFree ? (
          <Link
            href={upgradeHref}
            data-testid="dashboard-freemium-cta"
            className="inline-flex h-9 items-center justify-center rounded-md bg-terracotta-500 px-3.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 focus-visible:ring-offset-2"
          >
            {t("upgradeCta")}
          </Link>
        ) : null}
      </div>

      {/* Micro-liste d'avantages Pro — uniquement pour FREE non-bloqué, pour
          rendre l'upgrade compréhensible sans être agressif. */}
      {isFree && !cta ? (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-600">
          {proBenefits.map((b) => (
            <li key={b} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-forest-500"
              />
              {b}
            </li>
          ))}
        </ul>
      ) : null}

      {cta ? (
        <div
          className="mt-3 rounded-md border border-terracotta-200 bg-terracotta-50 p-3"
          role="status"
          data-testid="dashboard-freemium-block"
          data-reason={blockedReason}
        >
          <div className="text-sm font-semibold text-terracotta-800">
            {cta.title}
          </div>
          <div className="mt-1 text-sm text-stone-700">{cta.body}</div>
          <Link
            href={upgradeHref}
            className="mt-2 inline-flex items-center rounded-md bg-terracotta-500 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition-colors hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 focus-visible:ring-offset-2"
          >
            {cta.ctaLabel}
          </Link>
        </div>
      ) : null}

      {footer ? (
        <div className="mt-3 text-xs text-stone-500">{footer}</div>
      ) : null}
    </section>
  );
}
