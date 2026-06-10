// components/feature/UpgradeCard.tsx
// Carte d'upsell affichée quand un FeatureGate bloque.

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { FeatureFlag, SubscriptionPlan } from "@prisma/client";
import type { CanUseReason } from "@/lib/features/canUse";

interface UpgradeCardProps {
  feature: FeatureFlag;
  reason: CanUseReason;
  suggestedPlan?: SubscriptionPlan;
}

const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  P_DECOUVERTE: "Découverte",
  P_MON_PROJET: "Mon projet",
  TRIAL: "Essai 14 j",
  SOLO: "Solo",
  PRO: "Pro",
  TEAM: "Équipe",
  ENTERPRISE: "Entreprise",
};

export async function UpgradeCard({ feature, reason, suggestedPlan }: UpgradeCardProps) {
  const t = await getTranslations("billing.upgrade");

  const reasonLabel: Record<CanUseReason, string> = {
    feature_not_enabled:    t("reason.featureNotEnabled"),
    quota_reached:          t("reason.quotaReached"),
    subscription_inactive:  t("reason.subscriptionInactive"),
    no_organization:        t("reason.noOrganization"),
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-amber-500/40 bg-gradient-to-br from-amber-50 to-amber-100/40 p-6">
      <div className="flex items-start gap-4">
        <div aria-hidden className="flex size-10 items-center justify-center rounded-full bg-amber-500/20 text-2xl">
          ✦
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-amber-900">
            {t("title")}
          </h3>
          <p className="mt-1 text-sm text-amber-800/80">
            {reasonLabel[reason]}
          </p>
          {suggestedPlan && (
            <p className="mt-3 text-sm text-amber-900">
              {t("suggested", { plan: PLAN_LABEL[suggestedPlan] })}
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <Link
              href="/tarifs"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            >
              {t("cta.upgrade")}
            </Link>
            <Link
              href={`/help/${feature.toLowerCase()}`}
              className="rounded-lg border border-amber-600/30 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
            >
              {t("cta.learnMore")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
