// app/[locale]/p/projects/page.tsx — Liste des projets particulier v2.4
// Refonte UI : composant client `ProjectsListClient` avec recherche, filtres,
// tri, vue grille/liste, vignette gradient adaptée au DPE, menu contextuel
// d'actions par projet (modifier / dupliquer / archiver / supprimer).
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardFreemiumCard } from "@/components/billing/DashboardFreemiumCard";
import { getCurrentBillingPlan } from "@/server/auth/getCurrentBillingPlan";
import { getCurrentActiveProjectsCount } from "@/server/auth/getCurrentActiveProjectsCount";
import { getRemainingProjects } from "@/lib/billing/usage-policy";
import {
  ProjectsListClient,
  type ProjectListItem,
} from "@/components/p/ProjectsListClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ProjectsListPage({ params }: Props) {
  const { locale } = await params;

  const [billingPlan, activeProjectsCount] = await Promise.all([
    getCurrentBillingPlan(),
    getCurrentActiveProjectsCount(),
  ]);

  // MVP — données mockées enrichies (à remplacer par la query Prisma).
  const projects: ProjectListItem[] = [
    {
      id: "demo",
      name: "Maison des Tilleuls",
      location: "87000 Limoges",
      surface: 120,
      year: 1978,
      currentDPE: "E",
      targetDPE: "B",
      progress: 60,
      updatedAt: "il y a 2 jours",
      status: "in_progress",
      kind: "INDIVIDUAL",
    },
  ];

  const remainingProjects = getRemainingProjects(billingPlan, {
    activeProjectsCount,
    pdfExportsThisMonth: 0,
    emailVerified: true,
  });

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <header className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-white to-forest-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
              <Sparkles className="h-3 w-3" />
              Mon espace
            </p>
            <h1
              className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Mes projets
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              {projects.length} projet{projects.length > 1 ? "s" : ""} en cours{" "}
              {projects.length > 0 && (
                <span className="text-stone-500">
                  · dernière mise à jour{" "}
                  {projects[0]?.updatedAt}
                </span>
              )}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            iconLeft={<Plus className="h-4 w-4" strokeWidth={2} aria-hidden />}
          >
            <Link href={`/${locale}/p/projects/new`} className="contents">
              Nouveau projet
            </Link>
          </Button>
        </div>
      </header>

      {/* Carte freemium */}
      <DashboardFreemiumCard
        plan={billingPlan}
        remainingProjects={remainingProjects}
        locale={locale}
      />

      {/* Liste interactive */}
      {projects.length === 0 ? (
        <EmptyState
          type="projects"
          action={
            <Button variant="primary" size="md">
              <Link href={`/${locale}/p/projects/new`} className="contents">
                Créer mon premier projet
              </Link>
            </Button>
          }
        />
      ) : (
        <ProjectsListClient projects={projects} locale={locale} />
      )}
    </div>
  );
}
