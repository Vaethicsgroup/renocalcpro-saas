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
import { ProjectSubTabs } from "@/components/o/ProjectSubTabs";

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string; id: string }>;
}

export default async function WorkspaceLayout({ children, params }: Props) {
  const { locale, id } = await params;
  const project = { name: "Maison Martin" };

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="Fil d'Ariane" className="mb-3 flex items-center gap-1 text-xs text-stone-500">
        <Link href={`/${locale}/o/dashboard`} className="hover:text-forest-700">
          Tableau de bord
        </Link>
        <ChevronRight className="h-3 w-3 text-stone-400" />
        <Link href={`/${locale}/o/projects`} className="hover:text-forest-700">
          Dossiers
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
              En cours
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-600">Rénovation globale</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-cream-300 bg-white px-3 text-sm font-semibold text-forest-900 shadow-sm hover:bg-cream-50"
          >
            <Share2 className="h-4 w-4" strokeWidth={1.75} />
            Partager
          </button>
          <Link
            href={`/${locale}/o/projects/${id}/edit`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-forest-800"
          >
            <Edit3 className="h-4 w-4" strokeWidth={2} />
            Modifier
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <ProjectSubTabs locale={locale} projectId={id} />

      <main className="mt-6">{children}</main>
    </div>
  );
}
