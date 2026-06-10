// app/[locale]/o/dashboard/page.tsx — Dashboard Pro Premium v3.1
// Améliorations responsive & rendu professionnel :
//   - KPIs 2-col mobile / 4-col desktop avec hover lift
//   - Chart Activité avec viewBox flexible + tooltip interactif
//   - Donut DPE centré sur nombre de projets (plus de "TOTAL 98 %")
//   - Header sticky avec greeting compact mobile
//   - Espacements raffinés, ombres premium, hover states
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import {
  Bell,
  ChevronDown,
  Plus,
  Briefcase,
  FileText,
  Layers,
  Gauge,
  ArrowUp,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  Sparkles,
  Building2,
  Home,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ActivityChart } from "@/components/o/dashboard/ActivityChart";
import { DpeDistributionDonut } from "@/components/o/dashboard/DpeDistributionDonut";

interface Props {
  params: Promise<{ locale: string }>;
}

// ─── KPIs principaux ─────────────────────────────────────────────────────
const KPIS = [
  {
    label: "Projets en cours",
    value: "24",
    delta: "+12 %",
    deltaCaption: "ce mois",
    Icon: Briefcase,
    iconBg: "bg-forest-100",
    iconColor: "text-forest-700",
    positive: true,
  },
  {
    label: "Études réalisées",
    value: "47",
    delta: "+16 %",
    deltaCaption: "ce mois",
    Icon: FileText,
    iconBg: "bg-info-100",
    iconColor: "text-info-700",
    positive: true,
  },
  {
    label: "Scénarios générés",
    value: "112",
    delta: "+27 %",
    deltaCaption: "ce mois",
    Icon: Layers,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    positive: true,
  },
  {
    label: "Gain énergétique moyen",
    value: "45 %",
    delta: "Moyenne",
    deltaCaption: "pondérée",
    Icon: Gauge,
    iconBg: "bg-night-100",
    iconColor: "text-night-700",
    positive: false,
  },
] as const;

// ─── Courbe activité 6 mois ──────────────────────────────────────────────
const ACTIVITY_DATA = [
  { month: "Déc.", projectsCreated: 20, studiesCompleted: 5 },
  { month: "Jan.", projectsCreated: 32, studiesCompleted: 11 },
  { month: "Fév.", projectsCreated: 24, studiesCompleted: 18 },
  { month: "Mars", projectsCreated: 25, studiesCompleted: 13 },
  { month: "Avr.", projectsCreated: 30, studiesCompleted: 18 },
  { month: "Mai", projectsCreated: 24, studiesCompleted: 10 },
];

// ─── Donut DPE — total de 47 projets répartis ───────────────────────────
const DPE_DISTRIBUTION = [
  { label: "A", value: 8, color: "#1F4D2E" }, // ~17%
  { label: "B", value: 15, color: "#3A8A57" }, // ~32%
  { label: "C", value: 12, color: "#D4A340" }, // ~26%
  { label: "D", value: 7, color: "#E67E22" }, // ~15%
  { label: "E+", value: 5, color: "#C0392B" }, // ~11%
];
const TOTAL_DPE_PROJECTS = DPE_DISTRIBUTION.reduce((s, d) => s + d.value, 0);

// ─── Projets récents ─────────────────────────────────────────────────────
type RecentProjectStatus = "en_cours" | "etude" | "livre";

const RECENT_PROJECTS = [
  {
    id: "p1",
    name: "Maison Martin",
    type: "Rénovation globale",
    status: "en_cours" as const,
    Icon: Home,
    iconColor: "bg-forest-100 text-forest-700",
  },
  {
    id: "p2",
    name: "Appartement Dupont",
    type: "Rénovation énergétique",
    status: "etude" as const,
    Icon: Building2,
    iconColor: "bg-info-100 text-info-700",
  },
  {
    id: "p3",
    name: "Maison Bernard",
    type: "Extension + rénovation",
    status: "en_cours" as const,
    Icon: Home,
    iconColor: "bg-amber-100 text-amber-700",
  },
];

const STATUS_META: Record<
  RecentProjectStatus,
  { label: string; color: string }
> = {
  en_cours: { label: "En cours", color: "bg-forest-100 text-forest-800" },
  etude: { label: "Étude", color: "bg-info-100 text-info-800" },
  livre: { label: "Livré", color: "bg-stone-100 text-stone-700" },
};

const UPCOMING_TASKS = [
  { id: "t1", title: "Valider scénario — Maison Martin", dueLabel: "aujourd'hui" },
  { id: "t2", title: "Réunion client — Appartement Dupont", dueLabel: "demain 14h" },
  { id: "t3", title: "Compléter audit — Maison Bernard", dueLabel: "vendredi" },
];

const NOTIFICATIONS = [
  { id: "n1", title: "Mise à jour des aides disponibles", time: "il y a 2 h" },
  { id: "n2", title: "Nouveau matériau ajouté à la bibliothèque", time: "il y a 5 h" },
  { id: "n3", title: "Votre rapport est prêt", time: "il y a 1 jour" },
];

// ════════════════════════════════════════════════════════════════════════
export default async function ProDashboard({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ─── Hero greeting + actions (responsive) ─── */}
      <header className="space-y-4">
        <div>
          <h1
            className="font-serif text-2xl font-bold tracking-tight text-forest-900 sm:text-3xl md:text-4xl"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            Bonjour Marc,
          </h1>
          <p className="mt-1 text-sm text-stone-600 sm:text-base">
            Voici l&apos;activité de votre agence aujourd&apos;hui.
          </p>
        </div>
        {/* Actions sur 2 lignes mobile, 1 ligne desktop */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-sm transition-all hover:bg-cream-50 hover:shadow-md"
          >
            <Bell className="h-5 w-5 text-stone-700" strokeWidth={1.75} />
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1.5 text-[10px] font-bold text-white shadow ring-2 ring-white">
              {NOTIFICATIONS.length}
            </span>
          </button>
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-between gap-2 rounded-lg border border-cream-300 bg-white px-3 text-sm font-semibold text-forest-900 shadow-sm transition-all hover:border-forest-300 hover:bg-cream-50 sm:flex-initial"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-forest-100 text-forest-700">
                <Sparkles className="h-3 w-3" strokeWidth={2} />
              </span>
              <span className="truncate">Agence RenoSud</span>
            </span>
            <ChevronDown className="h-4 w-4 text-stone-500 shrink-0" />
          </button>
          <Link
            href={`/${locale}/o/projects`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-600 px-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-forest-800 hover:shadow-md"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nouveau dossier
          </Link>
        </div>
      </header>

      {/* ─── 4 KPIs : 2-col mobile, 4-col desktop ─── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {KPIS.map((k) => {
          const Icon = k.Icon;
          return (
            <article
              key={k.label}
              className="group relative overflow-hidden rounded-xl border border-cream-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-md sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 sm:text-[11px]">
                  {k.label}
                </p>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${k.iconBg} sm:h-9 sm:w-9`}
                >
                  <Icon
                    className={`h-4 w-4 ${k.iconColor} sm:h-4.5 sm:w-4.5`}
                    strokeWidth={2}
                  />
                </span>
              </div>
              <p
                className="mt-3 font-serif text-3xl font-bold leading-none text-forest-900 sm:text-4xl"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                {k.value}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[11px] sm:text-xs">
                {k.positive && (
                  <ArrowUp
                    className="h-3 w-3 text-forest-700"
                    strokeWidth={2.5}
                  />
                )}
                <span
                  className={
                    k.positive
                      ? "font-bold text-forest-700"
                      : "font-semibold text-stone-500"
                  }
                >
                  {k.delta}
                </span>
                <span className="text-stone-500"> {k.deltaCaption}</span>
              </div>
            </article>
          );
        })}
      </section>

      {/* ─── Chart Activité + Donut DPE ─── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3
                  className="font-serif text-base font-bold text-forest-900 sm:text-lg"
                  style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
                >
                  Activité des 6 derniers mois
                </h3>
                <p className="mt-0.5 text-xs text-stone-600">
                  Projets créés et études finalisées par mois.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-forest-700"
                    aria-hidden
                  />
                  <span className="text-stone-700">Projets créés</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-0.5 w-3 border-t-2 border-dashed"
                    style={{ borderColor: "#B8731C" }}
                    aria-hidden
                  />
                  <span className="text-stone-700">Études finalisées</span>
                </span>
              </div>
            </header>
            <ActivityChart data={ACTIVITY_DATA} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <header className="mb-4">
              <h3
                className="font-serif text-base font-bold text-forest-900 sm:text-lg"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                Répartition des étiquettes DPE
              </h3>
              <p className="mt-0.5 text-xs text-stone-600">
                {TOTAL_DPE_PROJECTS} projets après travaux recommandés.
              </p>
            </header>
            <DpeDistributionDonut
              data={DPE_DISTRIBUTION}
              totalProjectsCount={TOTAL_DPE_PROJECTS}
            />
          </CardContent>
        </Card>
      </section>

      {/* ─── 3 cards : projets / tâches / notifications ─── */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Projets récents */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3
              className="font-serif text-base font-bold text-forest-900 sm:text-lg"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Projets récents
            </h3>
            <ul className="mt-4 space-y-2.5">
              {RECENT_PROJECTS.map((p) => {
                const Icon = p.Icon;
                const meta = STATUS_META[p.status];
                return (
                  <li key={p.id}>
                    <Link
                      href={`/${locale}/o/projects/${p.id}/identite`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-cream-200 bg-white px-3 py-2.5 transition-all hover:border-forest-200 hover:bg-cream-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${p.iconColor}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-forest-900">
                            {p.name}
                          </p>
                          <p className="truncate text-[11px] text-stone-500">
                            {p.type}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href={`/${locale}/o/projects`}
              className="mt-4 flex items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50 hover:text-forest-900"
            >
              Voir tous les projets
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Tâches à venir */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3
              className="font-serif text-base font-bold text-forest-900 sm:text-lg"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Tâches à venir
            </h3>
            <ul className="mt-4 space-y-2.5">
              {UPCOMING_TASKS.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start gap-3 rounded-lg border border-cream-200 bg-white px-3 py-2.5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-night-100 text-night-700">
                    <ClipboardCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-forest-900">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Échéance : {t.dueLabel}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/o/projects`}
              className="mt-4 flex items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50 hover:text-forest-900"
            >
              Voir toutes les tâches
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3
              className="font-serif text-base font-bold text-forest-900 sm:text-lg"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Notifications
            </h3>
            <ul className="mt-4 space-y-2.5">
              {NOTIFICATIONS.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-3 rounded-lg border border-cream-200 bg-white px-3 py-2.5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-forest-900">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-stone-500">{n.time}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/o/projects`}
              className="mt-4 flex items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50 hover:text-forest-900"
            >
              Voir toutes les notifications
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
