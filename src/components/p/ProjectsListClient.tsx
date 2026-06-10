// src/components/p/ProjectsListClient.tsx
// ════════════════════════════════════════════════════════════════════════════
// Composant client de la liste des projets — recherche, tri, filtre, vue
// liste/grille, menu contextuel d'actions (modifier, dupliquer, archiver,
// supprimer). Présentation premium avec vignette gradient personnalisée
// selon DPE, métriques riches, badges statut.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  MapPin,
  ArrowRight,
  MoreVertical,
  Pencil,
  Copy,
  Archive,
  Trash2,
  Calendar,
  TrendingUp,
  LayoutGrid,
  List,
  Filter,
  Home,
  Building2,
  Briefcase,
} from "lucide-react";
import { DPELabel } from "@/components/results/DPELabel";

type DPEClassification = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type ProjectStatus =
  | "draft"
  | "in_progress"
  | "to_review"
  | "completed"
  | "archived";

export interface ProjectListItem {
  id: string;
  name: string;
  location: string;
  surface: number;
  year: number;
  currentDPE: DPEClassification;
  targetDPE: DPEClassification;
  progress: number;
  updatedAt: string;
  status: ProjectStatus;
  kind?: "INDIVIDUAL" | "COLLECTIVE" | "TERTIARY";
}

const STATUS_META: Record<
  ProjectStatus,
  { labelKey: string; color: string; dot: string }
> = {
  draft:       { labelKey: "statusDraft",      color: "bg-stone-100 text-stone-700", dot: "bg-stone-400" },
  in_progress: { labelKey: "statusInProgress", color: "bg-info-100 text-info-800",   dot: "bg-info-500" },
  to_review:   { labelKey: "statusToReview",   color: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  completed:   { labelKey: "finalized",        color: "bg-forest-100 text-forest-800", dot: "bg-forest-500" },
  archived:    { labelKey: "archived",         color: "bg-stone-100 text-stone-500", dot: "bg-stone-300" },
};

const KIND_ICONS: Record<NonNullable<ProjectListItem["kind"]>, typeof Home> = {
  INDIVIDUAL: Home,
  COLLECTIVE: Building2,
  TERTIARY: Briefcase,
};

interface Props {
  projects: ReadonlyArray<ProjectListItem>;
  locale: string;
}

export function ProjectsListClient({ projects, locale }: Props) {
  const t = useTranslations("projectsList");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"updated" | "name" | "progress">(
    "updated",
  );
  const [view, setView] = useState<"grid" | "list">("grid");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...projects];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.location.toLowerCase().includes(s),
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "progress") {
      list.sort((a, b) => b.progress - a.progress);
    }
    return list;
  }, [projects, search, statusFilter, sortBy]);

  return (
    <div className="space-y-5">
      {/* Toolbar : recherche + filtres + tri + vue */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cream-300 bg-white p-3 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPh")}
            className="h-9 w-full rounded-md border border-cream-300 pl-9 pr-3 text-sm focus:border-forest-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ProjectStatus | "all")
          }
          className="h-9 rounded-md border border-cream-300 bg-white px-3 text-sm font-medium text-stone-700 focus:border-forest-500 focus:outline-none"
          aria-label={t("ariaFilter")}
        >
          <option value="all">{t("filterAll")}</option>
          {(
            ["draft", "in_progress", "to_review", "completed", "archived"] as ProjectStatus[]
          ).map((s) => (
            <option key={s} value={s}>
              {t(STATUS_META[s].labelKey)}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "updated" | "name" | "progress")
          }
          className="h-9 rounded-md border border-cream-300 bg-white px-3 text-sm font-medium text-stone-700 focus:border-forest-500 focus:outline-none"
          aria-label={t("ariaSort")}
        >
          <option value="updated">{t("sortRecent")}</option>
          <option value="name">{t("sortName")}</option>
          <option value="progress">{t("sortProgress")}</option>
        </select>

        <div className="flex items-center gap-0.5 rounded-md border border-cream-300 p-0.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label={t("ariaViewGrid")}
            className={[
              "grid h-7 w-7 place-items-center rounded transition-colors",
              view === "grid"
                ? "bg-forest-700 text-white"
                : "text-stone-500 hover:bg-cream-50",
            ].join(" ")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-label={t("ariaViewList")}
            className={[
              "grid h-7 w-7 place-items-center rounded transition-colors",
              view === "list"
                ? "bg-forest-700 text-white"
                : "text-stone-500 hover:bg-cream-50",
            ].join(" ")}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <Filter className="mx-auto h-6 w-6 text-stone-400" />
          <p className="mt-2 text-sm text-stone-600">
            {t("emptyMsg")}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="mt-3 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-forest-300"
          >
            {t("btnReset")}
          </button>
        </div>
      )}

      {filtered.length > 0 && view === "grid" && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              locale={locale}
              isMenuOpen={openMenuId === p.id}
              onToggleMenu={() =>
                setOpenMenuId(openMenuId === p.id ? null : p.id)
              }
              t={t}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && view === "list" && (
        <ProjectListTable
          projects={filtered}
          locale={locale}
          openMenuId={openMenuId}
          onToggleMenu={(id) => setOpenMenuId(openMenuId === id ? null : id)}
          t={t}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  locale,
  isMenuOpen,
  onToggleMenu,
  t,
}: {
  project: ProjectListItem;
  locale: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const status = STATUS_META[project.status];
  const Kind = project.kind ? KIND_ICONS[project.kind] : Home;

  return (
    <div className="group relative overflow-hidden rounded-2xl border-2 border-cream-300 bg-white shadow-sm transition-all hover:border-forest-300 hover:shadow-md">
      {/* Vignette gradient (dégradé personnalisé selon DPE actuel) */}
      <Link
        href={`/${locale}/p/projects/${project.id}/synthese`}
        className="block"
      >
        <div className={`relative h-32 ${dpeGradientFor(project.currentDPE)}`}>
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.color}`}
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
              />
              {t(status.labelKey)}
            </span>
          </div>
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-stone-700 shadow-sm backdrop-blur">
              <Calendar className="h-2.5 w-2.5" />
              {project.updatedAt}
            </span>
          </div>
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
              <Kind className="h-4 w-4 text-forest-700" />
            </span>
          </div>
        </div>
      </Link>

      {/* Menu actions */}
      <div className="absolute right-2 top-12 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleMenu();
          }}
          aria-label={t("ariaActions")}
          aria-expanded={isMenuOpen}
          className="grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-sm transition-colors hover:bg-cream-50"
        >
          <MoreVertical className="h-4 w-4 text-stone-700" />
        </button>
        {isMenuOpen && (
          <ActionsMenu projectId={project.id} locale={locale} t={t} />
        )}
      </div>

      {/* Corps */}
      <Link
        href={`/${locale}/p/projects/${project.id}/synthese`}
        className="block p-4"
      >
        <h3
          className="font-serif text-lg font-bold text-forest-900"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {project.name}
        </h3>
        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-stone-600">
          <MapPin className="h-3 w-3 text-stone-400" />
          {project.location}
        </p>

        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-cream-200 pt-3 text-[11px]">
          <div>
            <dt className="text-stone-500">{t("labelSurface")}</dt>
            <dd className="font-bold tabular-nums text-forest-900">
              {project.surface} m²
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">{t("labelYear")}</dt>
            <dd className="font-bold tabular-nums text-forest-900">
              {project.year}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">{t("labelDpe")}</dt>
            <dd className="mt-0.5 flex items-center gap-0.5">
              <DPELabel classification={project.currentDPE} size="sm" />
              <ArrowRight className="h-3 w-3 text-stone-400" />
              <DPELabel classification={project.targetDPE} size="sm" />
            </dd>
          </div>
        </dl>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-stone-600">
              <TrendingUp className="h-3 w-3 text-forest-600" />
              {t("labelProgress")}
            </span>
            <span className="font-semibold text-forest-700">
              {project.progress} %
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-200">
            <div
              className="h-full bg-gradient-to-r from-forest-600 to-forest-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function ProjectListTable({
  projects,
  locale,
  openMenuId,
  onToggleMenu,
  t,
}: {
  projects: ReadonlyArray<ProjectListItem>;
  locale: string;
  openMenuId: string | null;
  onToggleMenu: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-cream-300 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cream-300 bg-cream-50 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <th className="px-4 py-3 text-left">{t("thProject")}</th>
            <th className="hidden px-3 py-3 text-left sm:table-cell">{t("thAddress")}</th>
            <th className="px-3 py-3 text-center">{t("labelDpe")}</th>
            <th className="hidden px-3 py-3 text-right md:table-cell">{t("labelSurface")}</th>
            <th className="px-3 py-3 text-right">{t("labelProgress")}</th>
            <th className="px-3 py-3 text-center">{t("thStatus")}</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-200">
          {projects.map((p) => {
            const status = STATUS_META[p.status];
            return (
              <tr key={p.id} className="hover:bg-cream-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/${locale}/p/projects/${p.id}/synthese`}
                    className="font-semibold text-forest-900 hover:underline"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="hidden px-3 py-3 text-stone-600 sm:table-cell">
                  {p.location}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <DPELabel classification={p.currentDPE} size="sm" />
                    <ArrowRight className="h-3 w-3 text-stone-400" />
                    <DPELabel classification={p.targetDPE} size="sm" />
                  </div>
                </td>
                <td className="hidden px-3 py-3 text-right tabular-nums text-stone-700 md:table-cell">
                  {p.surface} m²
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="font-semibold text-forest-700">
                    {p.progress} %
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.color}`}
                  >
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                    />
                    {t(status.labelKey)}
                  </span>
                </td>
                <td className="relative px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onToggleMenu(p.id)}
                    aria-label={t("ariaActions")}
                    className="rounded-md p-1.5 hover:bg-cream-100"
                  >
                    <MoreVertical className="h-4 w-4 text-stone-600" />
                  </button>
                  {openMenuId === p.id && (
                    <ActionsMenu projectId={p.id} locale={locale} t={t} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function ActionsMenu({
  projectId,
  locale,
  t,
}: {
  projectId: string;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div
      role="menu"
      className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-cream-300 bg-white shadow-lg"
    >
      <Link
        href={`/${locale}/p/projects/${projectId}/edit`}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-forest-900 hover:bg-cream-50"
      >
        <Pencil className="h-3.5 w-3.5 text-forest-700" />
        {t("menuEdit")}
      </Link>
      <Link
        href={`/${locale}/p/projects/${projectId}/synthese`}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-forest-900 hover:bg-cream-50"
      >
        <ArrowRight className="h-3.5 w-3.5 text-forest-700" />
        {t("menuOpen")}
      </Link>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-cream-50"
      >
        <Copy className="h-3.5 w-3.5 text-stone-500" />
        {t("menuDuplicate")}
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-cream-50"
      >
        <Archive className="h-3.5 w-3.5 text-stone-500" />
        {t("menuArchive")}
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 border-t border-cream-200 px-3 py-2 text-left text-xs font-medium text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {t("menuDelete")}
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function dpeGradientFor(letter: DPEClassification): string {
  switch (letter) {
    case "A":
    case "B":
      return "bg-gradient-to-br from-forest-50 via-forest-100 to-forest-200";
    case "C":
    case "D":
      return "bg-gradient-to-br from-cream-100 via-amber-50 to-amber-100";
    case "E":
      return "bg-gradient-to-br from-amber-100 via-amber-200 to-orange-200";
    case "F":
    case "G":
      return "bg-gradient-to-br from-orange-200 via-red-200 to-red-300";
    default:
      return "bg-gradient-to-br from-cream-100 to-stone-100";
  }
}
