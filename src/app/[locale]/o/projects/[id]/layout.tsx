// app/[locale]/o/projects/[id]/layout.tsx
// ════════════════════════════════════════════════════════════════════════════
// Workspace projet pro v3 — Layout simplifié : breadcrumb + header avec
// titre/badge/actions + onglets (Synthèse / Scénarios / Étude thermique /
// Devis / Documents / Historique). Pas de sidebar droite — contenu plein
// largeur. Conformément à la maquette client.
// ════════════════════════════════════════════════════════════════════════════
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Share2, Edit3 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ProjectSubTabs } from "@/components/o/ProjectSubTabs";

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string; id: string }>;
}

export default async function WorkspaceLayout({ children, params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "oWorkspace" });
  const project = { name: "Maison Martin" };

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label={t("breadcrumbAria")} className="mb-3 flex items-center gap-1 text-xs text-stone-500">
        <Link href={`/${locale}/o/dashboard`} className="hover:text-forest-700">
          {t("breadcrumbDashboard")}
        </Link>
        <ChevronRight className="h-3 w-3 text-stone-400" />
        <Link href={`/${locale}/o/projects`} className="hover:text-forest-700">
          {t("breadcrumbProjects")}
        </Link>
        <ChevronRight className="h-3 w-3 text-stone-400" />
        <span className="text-stone-700">{project.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className="font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              {project.name}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-bold text-forest-800">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-forest-500" />
              {t("statusInProgress")}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-600">{t("projectTagline")}</p>
        </div>
        <div className="flex gap-2">
          {/* Partage — workflow portail client à brancher (mock pour démo). */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            title={t("shareSoonTitle")}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-cream-200 bg-white px-3 text-sm font-semibold text-forest-400 shadow-sm cursor-not-allowed opacity-60"
          >
            <Share2 className="h-4 w-4" strokeWidth={1.75} />
            {t("shareBtn")}
            <span aria-hidden className="ml-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200">{t("shareSoonPill")}</span>
          </button>
          <Link
            href={`/${locale}/o/projects/${id}/edit`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-forest-800"
          >
            <Edit3 className="h-4 w-4" strokeWidth={2} />
            {t("editBtn")}
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <ProjectSubTabs locale={locale} projectId={id} />

      <main className="mt-6">{children}</main>
    </div>
  );
}
