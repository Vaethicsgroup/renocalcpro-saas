// src/components/compliance/ProfessionalComplianceCard.tsx
// Carte de conformité professionnelle — affiche statut + champs manquants +
// capacités dérivées + CTA "Compléter mon profil".
//
// Usage typique : monter sur /o/dashboard pour informer l'utilisateur de l'état
// de sa conformité et l'inciter à compléter.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  evaluateProfessionalCompliance,
  type ProfessionalProfile,
  type ProfessionalComplianceStatus,
  type ComplianceData,
} from "@/lib/compliance/professional-compliance";
import { loadComplianceData } from "@/lib/compliance/storage";

interface Props {
  /** Profil métier déduit de l'organisation. */
  profile: ProfessionalProfile;
  /** ID de l'organisation (clé de persistance). */
  orgId: string;
  /** Locale courante (pour les liens). */
  locale?: string;
}

const STATUS_META: Record<ProfessionalComplianceStatus, {
  badgeClass: string;
  iconClass: string;
  icon: typeof ShieldCheck;
  statusKey: string;
  descKey: string;
}> = {
  INCOMPLETE:     { badgeClass: "bg-amber-100 text-amber-900 border-amber-300",   iconClass: "text-amber-700",   icon: ShieldAlert,    statusKey: "statusIncomplete",    descKey: "statusDescIncomplete" },
  DECLARED:       { badgeClass: "bg-teal-100 text-teal-900 border-teal-300",      iconClass: "text-teal-700",    icon: ShieldQuestion, statusKey: "statusDeclared",       descKey: "statusDescDeclared" },
  PENDING_REVIEW: { badgeClass: "bg-stone-100 text-stone-700 border-stone-300",   iconClass: "text-stone-500",   icon: Clock,          statusKey: "statusPendingReview",  descKey: "statusDescPendingReview" },
  VERIFIED:       { badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300", iconClass: "text-emerald-700", icon: ShieldCheck, statusKey: "statusVerified",       descKey: "statusDescVerified" },
  EXPIRED:        { badgeClass: "bg-orange-100 text-orange-900 border-orange-300", iconClass: "text-orange-700",  icon: AlertTriangle,  statusKey: "statusExpired",        descKey: "statusDescExpired" },
  REJECTED:       { badgeClass: "bg-rose-100 text-rose-900 border-rose-300",       iconClass: "text-rose-700",    icon: ShieldAlert,    statusKey: "statusRejected",       descKey: "statusDescRejected" },
};

export function ProfessionalComplianceCard({ profile, orgId, locale: localeProp }: Props) {
  const t = useTranslations("compliance");
  const tCard = useTranslations("complianceCard");
  const tFields = useTranslations("complianceFields");
  const tProfiles = useTranslations("complianceProfiles");
  const currentLocale = useLocale();
  const locale = localeProp ?? currentLocale;

  const [data, setData] = useState<ComplianceData | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadComplianceData(orgId));
    setHydrated(true);
  }, [orgId]);

  const evalResult = evaluateProfessionalCompliance(profile, data);
  const meta = STATUS_META[evalResult.status];
  const Icon = meta.icon;

  const cta = evalResult.status === "VERIFIED"
    ? t("ctaReviewProfile")
    : evalResult.status === "EXPIRED" || evalResult.status === "REJECTED"
      ? t("ctaUpdateProfile")
      : t("ctaCompleteProfile");

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft"
      aria-busy={!hydrated}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-50 ${meta.iconClass}`}>
            <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-lg font-semibold text-stone-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
              {tCard("title")}
            </h3>
            <p className="mt-0.5 text-xs text-stone-500">
              {tCard("profileLabel")} <span className="font-medium text-stone-700">{tProfiles(profile)}</span>
            </p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-2xs font-bold uppercase tracking-wider ${meta.badgeClass}`}>
          {t(meta.statusKey)}
        </span>
      </header>

      <p className="mt-3 text-sm text-stone-700">{t(meta.descKey)}</p>

      {evalResult.missingFields.length > 0 && (
        <div className="mt-4">
          <h4 className="text-2xs font-semibold uppercase tracking-wider text-stone-500">
            {tCard("missingFieldsTitle")}
          </h4>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {evalResult.missingFields.map((key) => (
              <li
                key={key}
                className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-2xs font-medium text-amber-900 border border-amber-200"
              >
                {tFields(key)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50/60 p-3">
        <h4 className="text-2xs font-semibold uppercase tracking-wider text-stone-500">
          {tCard("capabilitiesTitle")}
        </h4>
        <ul className="mt-2 space-y-1 text-xs text-stone-700">
          <li className="flex items-start gap-1.5">
            <span aria-hidden className={evalResult.canUseExpertMode ? "text-emerald-600" : "text-stone-400"}>
              {evalResult.canUseExpertMode ? "✓" : "✗"}
            </span>
            <span>{evalResult.canUseExpertMode ? t("expertModeUnlocked") : t("expertModeBlocked")}</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span aria-hidden className={evalResult.canEmbedProfessionalIdentityInReport ? "text-emerald-600" : "text-stone-400"}>
              {evalResult.canEmbedProfessionalIdentityInReport ? "✓" : "✗"}
            </span>
            <span>
              {evalResult.canEmbedProfessionalIdentityInReport
                ? t("identityUnlocked")
                : t("identityBlocked")}
            </span>
          </li>
          {evalResult.reportShouldDiscloseUnverified && evalResult.canEmbedProfessionalIdentityInReport && (
            <li className="flex items-start gap-1.5 text-stone-500">
              <span aria-hidden>ℹ</span>
              <span className="italic">{t("unverifiedReportMention")}</span>
            </li>
          )}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/${locale}/o/settings/compliance`}
          className="inline-flex h-9 items-center justify-center rounded-md bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-800"
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}
