"use client";

/**
 * DashboardMockup — contenu du laptop central (sidebar vert nuit + main vue
 * d'ensemble). Visuel 100% reproductible du vrai `/dashboard` une fois branché
 * à Prisma. Les mêmes sous-composants (KpiCard, ProjectCard, DonutChart,
 * BarCompare, DpeScale) sont utilisables dans l'app réelle.
 */

import * as React from "react";
import { LogoIcon } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import type { DashboardMockupData, KpiData, ProjectCardData } from "./types";
import { DonutChart, BarCompare, DpeScale } from "./charts";
import {
  AssetImage,
  IconHome, IconLeaf, IconCO2, IconEuro,
  IconSearch, IconBell, IconPlus,
  NavDashboard, NavProjects, NavNewProject, NavBuilding, NavEnvelope, NavSystems,
  NavWorks, NavScenarios, NavResults, NavReports,
} from "./primitives";

const KPI_ICONS = { home: IconHome, leaf: IconLeaf, co2: IconCO2, euro: IconEuro } as const;

export function DashboardMockup({ data }: { data: DashboardMockupData }) {
  return (
    <>
      {/* Sidebar */}
      <aside className="relative flex w-60 flex-col gap-1 bg-gradient-to-b from-night-700 to-night-900 px-[18px] py-[22px] text-white">
        {/* Logo compact (SVG officiel LogoIcon) */}
        <div className="mb-5 flex items-center gap-2.5 border-b border-white/10 px-2 pb-5">
          <LogoIcon theme="light" className="h-[18px] w-[26px]" />
          <span className="font-serif text-[18px] font-semibold tracking-[-0.4px]">RENOCALCPRO</span>
        </div>

        <div className="px-2.5 pb-2 pt-3 text-[10px] font-medium uppercase tracking-[2px] text-white/40">Pilotage</div>
        <NavItem active icon={<NavDashboard />} label="Dashboard" />
        <NavItem icon={<NavProjects />} label="Mes projets" badge="12" />
        <NavItem icon={<NavNewProject />} label="Nouveau projet" />

        <div className="px-2.5 pb-2 pt-3 text-[10px] font-medium uppercase tracking-[2px] text-white/40">Audit</div>
        <NavItem icon={<NavBuilding />} label="Bâtiment" />
        <NavItem icon={<NavEnvelope />} label="Enveloppe" />
        <NavItem icon={<NavSystems />} label="Systèmes" />

        <div className="px-2.5 pb-2 pt-3 text-[10px] font-medium uppercase tracking-[2px] text-white/40">Sorties</div>
        <NavItem icon={<NavWorks />} label="Travaux" />
        <NavItem icon={<NavScenarios />} label="Scénarios" badge="3" />
        <NavItem icon={<NavResults />} label="Résultats" />
        <NavItem icon={<NavReports />} label="Rapports" />

        {/* User card */}
        <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 px-2.5 pt-3.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-copper-400 to-copper-600 text-[11px] font-semibold tracking-wider text-forest-900">
            {data.userInitials}
          </span>
          <span>
            <span className="block text-[12px] font-medium text-white">{data.userName}</span>
            <span className="block text-[10px] text-white/50">{data.userRole}</span>
          </span>
        </div>
      </aside>

      {/* MAIN */}
      <main className="relative flex-1 bg-cream-50 px-[30px] py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex max-w-[360px] flex-1 items-center gap-2.5 rounded-xl border border-cream-300 bg-cream-100 px-3.5 py-2.5 text-[13px] text-stone-500">
            <IconSearch className="text-stone-500" />
            Rechercher un projet, un client, un document…
          </div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-cream-300 bg-cream-50">
              <IconBell className="text-stone-700" />
              <span className="absolute right-2 top-2 h-[7px] w-[7px] rounded-full border-[1.5px] border-cream-50 bg-copper-400" />
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-forest-700 to-forest-900 text-[12px] font-semibold text-white">
              {data.userInitials}
            </span>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl font-medium leading-none tracking-[-0.8px] text-forest-900">{data.pageTitle}</h1>
            <p className="mt-1.5 text-[13px] text-stone-500">{data.pageSub}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-forest-800 px-[18px] py-2.5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(16,42,67,.1),0_4px_12px_rgba(30,61,42,.2)]"
          >
            <IconPlus /> Nouveau projet
          </button>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-3">
          {data.kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
        </div>

        <SectionHeader title="Mes projets récents" link="Voir tous les projets →" />
        <div className="mb-6 grid grid-cols-3 gap-3.5">
          {data.projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>

        <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-3.5">
          <ChartCard title="Déperditions thermiques" pill="Avant travaux">
            <DonutChart data={data.deperditions} />
          </ChartCard>
          <ChartCard title="Consommation énergétique" pill={data.consumption.reductionPct}>
            <BarCompare data={data.consumption} />
          </ChartCard>
          <ChartCard title="Étiquette énergétique" pill="DPE">
            <DpeScale data={data.dpe} />
          </ChartCard>
        </div>
      </main>
    </>
  );
}

/* ─── Sous-composants ─── */

function NavItem({
  active, icon, label, badge,
}: { active?: boolean; icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <a
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] tracking-[-0.1px]",
        active
          ? "bg-white/10 font-medium text-white ring-1 ring-inset ring-white/10"
          : "text-white/80"
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="rounded-xl bg-copper-400 px-2 py-0.5 text-[10px] font-semibold text-forest-900">{badge}</span>
      )}
    </a>
  );
}

function KpiCard({ kpi }: { kpi: KpiData }) {
  const Icon = KPI_ICONS[kpi.icon];
  const iconTint =
    kpi.variant === "gold" ? "bg-copper-50 text-copper-600" :
    "bg-forest-50 text-forest-800";
  const valueTint =
    kpi.variant === "success" ? "text-forest-700" :
    kpi.variant === "gold"    ? "text-copper-600" :
    "text-forest-900";
  const goldCorner = kpi.variant === "gold" ? "before:absolute before:top-0 before:right-0 before:h-16 before:w-16 before:pointer-events-none before:[background:radial-gradient(circle_at_top_right,rgba(201,162,79,0.1),transparent_70%)]" : "";
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-cream-300 bg-white p-4", goldCorner)}>
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", iconTint)}>
          <Icon />
        </span>
        <span className="text-[11px] tracking-[-0.1px] text-stone-500">{kpi.label}</span>
      </div>
      <div className={cn("font-serif text-[28px] font-medium leading-none tracking-[-0.8px]", valueTint)}>
        {kpi.value}
        {kpi.trend && (
          <span className="ml-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-forest-500">
            {kpi.trend.direction === "up" ? "↑" : kpi.trend.direction === "down" ? "↓" : ""} {kpi.trend.value}
          </span>
        )}
      </div>
      {kpi.footer && <div className="mt-1.5 text-[10px] tracking-[-0.1px] text-stone-400">{kpi.footer}</div>}
    </div>
  );
}

const TAG_FOR_THEME: Record<ProjectCardData["imageTheme"], string> = {
  maison: "⌂ Maison", copro: "⚏ Copropriété", tertiaire: "⌘ Tertiaire",
};
const STATUS_TINT: Record<ProjectCardData["status"], string> = {
  "en-cours":  "bg-forest-100 text-forest-800",
  "etude":     "bg-copper-50 text-copper-700",
  "scenarios": "bg-blue-50 text-blue-800",
  "termine":   "bg-cream-200 text-stone-700",
};

function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-cream-300 bg-white">
      <AssetImage
        src={project.imageSrc}
        hint={`PHOTO · ${project.name}`}
        alt={project.imageHint}
        theme={project.imageTheme}
        className="h-28 w-full"
      >
        <span className="relative z-10 inline-flex items-center gap-1.5 rounded-xl bg-black/30 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {TAG_FOR_THEME[project.imageTheme]}
        </span>
      </AssetImage>
      <div className="p-4">
        <div className="text-[15px] font-semibold tracking-[-0.2px] text-forest-900">{project.name}</div>
        <div className="mb-2.5 text-[12px] text-stone-500">{project.location} · {project.meta}</div>
        <div className="flex items-center justify-between border-t border-cream-300 pt-2.5">
          <span className="text-[11px] text-stone-500">
            {project.bottomStatLabel} <strong className="font-semibold text-forest-700">{project.bottomStatValue}</strong>
          </span>
          <span className={cn("rounded-xl px-2.5 py-0.5 text-[10px] font-semibold tracking-wider", STATUS_TINT[project.status])}>
            {project.statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, link }: { title: string; link?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h3 className="font-serif text-[20px] font-medium tracking-[-0.3px] text-forest-900">{title}</h3>
      {link && <a className="inline-flex items-center gap-1 text-[12px] font-medium text-forest-700">{link}</a>}
    </div>
  );
}

function ChartCard({ title, pill, children }: { title: string; pill?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cream-300 bg-white p-4">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-[12px] font-semibold tracking-[-0.1px] text-forest-900">{title}</div>
        {pill && <span className="rounded-xl bg-forest-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-forest-700">{pill}</span>}
      </div>
      {children}
    </div>
  );
}
