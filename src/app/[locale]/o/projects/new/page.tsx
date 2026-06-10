// app/[locale]/o/projects/new/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Étape pro « Nouveau dossier » avant le wizard de saisie bâtiment.
//
// L'utilisateur pro renseigne d'abord le contexte de mission (client, bien,
// type d'audit, priorité, notes), puis bascule sur /p/projects/new?from=pro
// qui consomme l'intake pour pré-remplir projectName + location.
//
// Stockage : localStorage uniquement (clé `renocalc.pro_intake`). Aucune
// dépendance Prisma, aucun appel serveur. Fail-safe en mode privé.
//
// Le wizard particulier (/p/projects/new sans `from=pro`) reste inchangé.
// ════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ChevronRight, Briefcase } from "lucide-react";
import { ProIntakeForm } from "@/components/o/ProIntakeForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function NewProProjectPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "oProjNew" });

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb */}
      <nav aria-label={t("breadcrumbAria")} className="flex items-center gap-1 text-xs text-stone-500">
        <Link href={`/${locale}/o/dashboard`} className="hover:text-forest-700">
          {t("crumbDashboard")}
        </Link>
        <ChevronRight className="h-3 w-3 text-stone-400" />
        <Link href={`/${locale}/o/projects`} className="hover:text-forest-700">
          {t("crumbProjects")}
        </Link>
        <ChevronRight className="h-3 w-3 text-stone-400" />
        <span className="text-stone-700">{t("crumbNew")}</span>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-cream-300 bg-gradient-to-br from-forest-800 to-forest-700 p-6 text-cream-50 shadow-md md:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cream-100/5 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-cream-200/80">
              {t("eyebrow")}
            </p>
            <h1
              className="mt-2 font-serif text-2xl font-bold md:text-3xl"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              {t("title")}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-cream-100/80">
              {t("subtitle")}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cream-100/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cream-100 ring-1 ring-cream-200/20">
            <Briefcase className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            {t("proBadge")}
          </span>
        </div>
      </header>

      {/* Formulaire intake */}
      <ProIntakeForm locale={locale} />
    </div>
  );
}
