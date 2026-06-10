// app/[locale]/o/dashboard/page.tsx — Dashboard Pro Premium v3.0
// Refonte complète inspirée maquette : greeting + agence + 4 KPIs avec deltas
// + courbe d'activité 6 mois + donut répartition DPE + 3 colonnes (projets
// récents / tâches à venir / notifications).
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
const KPIS: ReadonlyArray<{
  label: string;
  value: string;
  delta: string;
  Icon: typeof Briefcase;
  color: string;
}> = [
  {
    label: "Projets en cours",
    value: "24",
    delta: "+12 % ce mois",
    Icon: Briefcase,
    color: "text-forest-700",
  },
  {
    label: "Études réalisées",
    value: "47",
    delta: "+16 % ce mois",
    Icon: FileText,
    color: "text-info-700",
  },
  {
    label: "Scénarios générés",
    value: "112",
    delta: "+27 % ce mois",
    Icon: Layers,
    color: "text-amber-700",
  },
  {
    label: "Gain énergétique moyen",
    value: "45 %",
    delta: "Moyenne pondérée",
    Icon: Gauge,
    color: "text-night-700",
  },
];

// ─── Courbe activité 6 mois ──────────────────────────────────────────────
const ACTIVITY_DATA: ReadonlyArray<{
  month: string;
  projectsCreated: number;
  studiesCompleted: number;
}> = [
  { month: "Déc.", projectsCreated: 20, studiesCompleted: 5 },
  { month: "Jan.", projectsCreated: 32, studiesCompleted: 11 },
  { month: "Fév.", projectsCreated: 24, studiesCompleted: 18 },
  { month: "Mars", projectsCreated: 25, studiesCompleted: 13 },
  { month: "Avr.", projectsCreated: 30, studiesCompleted: 18 },
  { month: "Mai", projectsCreated: 24, studiesCompleted: 10 },
];

// ─── Donut DPE ────────────────────────────────────────────────────────────
const DPE_DISTRIBUTION: ReadonlyArray<{
  label: string;
  value: number;
  color: string;
}> = [
  { label: "A", value: 16, color: "#1F4D2E" }, // forest deep
  { label: "B", value: 32, color: "#3A8A57" }, // forest
  { label: "C", value: 25, color: "#D4A340" }, // amber
  { label: "D", value: 15, color: "#E67E22" }, // orange
  { label: "E+", value: 10, color: "#C0392B" }, // red
];

// ─── Projets récents ─────────────────────────────────────────────────────
const RECENT_PROJECTS: ReadonlyArray<{
  id: string;
  name: string;
  type: string;
  status: "en_cours" | "etude" | "livre";
  Icon: typeof Home;
  iconColor: string;
}> = [
  {
    id: "p1",
    name: "Maison Martin",
    type: "Rénovation globale",
    status: "en_cours",
    Icon: Home,
    iconColor: "bg-forest-100 text-forest-700",
  },
  {
    id: "p2",
    name: "Appartement Dupont",
    type: "Rénovation énergétique",
    status: "etude",
    Icon: Building2,
    iconColor: "bg-info-100 text-info-700",
  },
  {
    id: "p3",
    name: "Maison Bernard",
    type: "Extension + rénovation",
    status: "en_cours",
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

type RecentProjectStatus = "en_cours" | "etude" | "livre";

// ─── Tâches à venir ──────────────────────────────────────────────────────
const UPCOMING_TASKS: ReadonlyArray<{
  id: string;
  title: string;
  dueLabel: string;
}> = [
  {
    id: "t1",
    title: "Valider scénario — Maison Martin",
    dueLabel: "aujourd'hui",
  },
  {
    id: "t2",
    title: "Réunion client — Appartement Dupont",
    dueLabel: "demain 14h",
  },
  {
    id: "t3",
    title: "Compléter audit — Maison Bernard",
    dueLabel: "vendredi",
  },
];

// ─── Notifications ───────────────────────────────────────────────────────
const NOTIFICATIONS: ReadonlyArray<{
  id: string;
  title: string;
  time: string;
}> = [
  {
    id: "n1",
    title: "Mise à jour des aides disponibles",
    time: "il y a 2 h",
  },
  {
    id: "n2",
    title: "Nouveau matériau ajouté à la bibliothèque",
    time: "il y a 5 h",
  },
  {
    id: "n3",
    title: "Votre rapport est prêt",
    time: "il y a 1 jour",
  },
];

// ════════════════════════════════════════════════════════════════════════
export default async function ProDashboard({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      {/* ─── Hero greeting + agency switcher + notifications ─── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            Bonjour Marc,
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Voici l&apos;activité de votre agence aujourd&apos;hui.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm transition-colors hover:bg-cream-50"
          >
            <Bell className="h-5 w-5 text-stone-700" strokeWidth={1.75} />
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1.5 text-[10px] font-bold text-white shadow">
              {NOTIFICATIONS.length}
            </span>
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-lg border border-cream-300 bg-white px-3 text-sm font-semibold text-forest-900 shadow-sm hover:bg-cream-50"
          >
            <span className="grid h-6 w-6 place-items-center rounded-md bg-forest-100 text-forest-700">
              <Sparkles className="h-3 w-3" strokeWidth={2} />
            </span>
            Agence RenoSud
            <ChevronDown className="h-4 w-4 text-stone-500" />
          </button>
          <Link
            href={`/${locale}/o/projects`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-forest-800"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nouveau dossier
          </Link>
        </div>
      </header>

      {/* ─── 4 KPIs ─── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Icon = k.Icon;
          return (
            <Card key={k.label}>
              <CardContent>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    {k.label}
                  </p>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-cream-100">
                    <Icon className={`h-4 w-4 ${k.color}`} strokeWidth={1.75} />
                  </span>
                </div>
                <p
                  className="mt-2 font-serif text-4xl font-bold text-forest-900"
                  style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
                >
                  {k.value}
                </p>
                <p
                  className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${
                    k.delta.includes("+")
                      ? "text-forest-700"
                      : "text-stone-500"
                  }`}
                >
                  {k.delta.includes("+") && <ArrowUp className="h-3 w-3" />}
                  {k.delta}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* ─── 2 colonnes : activity chart + donut DPE ─── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardContent>
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-forest-900">
                  Activité des 6 derniers mois
                </h3>
                <p className="mt-0.5 text-xs text-stone-600">
                  Projets créés et études finalisées par mois.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-forest-700"
                    aria-hidden
                  />
                  Projets créés
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-0.5 w-3 bg-amber-600"
                    aria-hidden
                    style={{ borderTop: "2px dashed #B8731C" }}
                  />
                  Études finalisées
                </span>
              </div>
            </header>
            <ActivityChart data={ACTIVITY_DATA} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <header className="mb-4">
              <h3 className="font-serif text-base font-bold text-forest-900">
                Répartition des étiquettes DPE
              </h3>
              <p className="mt-0.5 text-xs text-stone-600">
                Projets après travaux recommandés.
              </p>
            </header>
            <DpeDistributionDonut data={DPE_DISTRIBUTION} />
          </CardContent>
        </Card>
      </section>

      {/* ─── 3 colonnes : projets récents / tâches / notifications ─── */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Projets récents */}
        <Card>
          <CardContent>
            <h3 className="font-serif text-base font-bold text-forest-900">
              Projets récents
            </h3>
            <ul className="mt-4 space-y-3">
              {RECENT_PROJECTS.map((p) => {
                const Icon = p.Icon;
                const meta = STATUS_META[p.status];
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-cream-200 bg-white px-3 py-2.5"
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
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Link
              href={`/${locale}/o/projects`}
              className="mt-4 flex items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50"
            >
              Voir tous les projets
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Tâches à venir */}
        <Card>
          <CardContent>
            <h3 className="font-serif text-base font-bold text-forest-900">
              Tâches à venir
            </h3>
            <ul className="mt-4 space-y-3">
              {UPCOMING_TASKS.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start gap-3 rounded-lg border border-cream-200 bg-white px-3 py-2.5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-night-100 text-night-700">
                    <ClipboardCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-forest-900">
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
              className="mt-4 flex items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50"
            >
              Voir toutes les tâches
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardContent>
            <h3 className="font-serif text-base font-bold text-forest-900">
              Notifications
            </h3>
            <ul className="mt-4 space-y-3">
              {NOTIFICATIONS.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-3 rounded-lg border border-cream-200 bg-white px-3 py-2.5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-forest-900">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-stone-500">{n.time}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/o/projects`}
              className="mt-4 flex items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50"
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
