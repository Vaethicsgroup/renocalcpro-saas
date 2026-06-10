// app/[locale]/p/projects/page.tsx — Liste des projets particulier v2.4.1
// Fix critique :
//   - <a> imbriqué dans <button> retiré (invalide HTML → hydration error)
//   - fail-safe sur les fetch async (DB indisponible → fallback projet vide)
//   - imports lucide alignés sur ce qui est réellement utilisé
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
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

  // Fail-safe : si la DB est indisponible (dev sans Postgres, etc.) on
  // tombe sur FREE / 0 projets actifs et la page continue de s'afficher.
  let billingPlan: Awaited<ReturnType<typeof getCurrentBillingPlan>>;
  let activeProjectsCount = 0;
  try {
    [billingPlan, activeProjectsCount] = await Promise.all([
      getCurrentBillingPlan(),
      getCurrentActiveProjectsCount(),
    ]);
  } catch {
    billingPlan = "FREE";
  }

  // MVP — données mockées enrichies. À remplacer par un fetch Prisma quand
  // la liste réelle des projets sera persistée.
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
              {projects.length} projet{projects.length > 1 ? "s" : ""} en cours
              {projects.length > 0 && (
                <span className="text-stone-500">
                  {" · dernière mise à jour "}
                  {projects[0]?.updatedAt}
                </span>
              )}
            </p>
          </div>
          {/* Link stylé comme bouton — pas de <a> imbriqué dans <button> */}
          <Link
            href={`/${locale}/p/projects/new`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-forest-600 px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-forest-800"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Nouveau projet
          </Link>
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
            <Link
              href={`/${locale}/p/projects/new`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-forest-600 px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-forest-800"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              Créer mon premier projet
            </Link>
          }
        />
      ) : (
        <ProjectsListClient projects={projects} locale={locale} />
      )}
    </div>
  );
}
