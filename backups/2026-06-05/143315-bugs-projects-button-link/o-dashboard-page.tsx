// app/[locale]/o/dashboard/page.tsx — Dashboard Pro Premium v2.0
// 4 KpiCards (MRR, conv, dossiers/mo, CSAT) + activité 30j + récents 5 projets + actions rapides

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { DPELabel } from "@/components/results/DPELabel";

interface Props { params: Promise<{ locale: string }> }

const RECENT_PROJECTS = [
  { id: "p1", name: "Maison Martin",  client: "Pierre Martin",  segment: "Particulier",  surface: 132, dpe: "D" as const, updated: "il y a 2h",  status: "in_progress" as const },
  { id: "p2", name: "Copro Les Tilleuls", client: "Syndic Foncia", segment: "Copropriété", surface: 2_800, dpe: "F" as const, updated: "hier",   status: "review" as const },
  { id: "p3", name: "Bureau ABC",     client: "ABC Conseil",     segment: "Tertiaire",     surface: 480, dpe: "E" as const, updated: "il y a 3j", status: "draft" as const },
  { id: "p4", name: "Maison Dubois",  client: "Sophie Dubois",   segment: "Particulier",  surface: 95,  dpe: "C" as const, updated: "il y a 5j", status: "delivered" as const },
  { id: "p5", name: "Immeuble Jaurès", client: "SCI Jaurès",     segment: "Copropriété", surface: 1_200, dpe: "G" as const, updated: "il y a 1 sem", status: "delivered" as const },
];

const STATUS_LABEL: Record<string, { label: string; status: "info" | "warning" | "success" | "neutral" }> = {
  draft:        { label: "Brouillon",     status: "neutral" },
  in_progress:  { label: "En cours",      status: "info" },
  review:       { label: "À relire",      status: "warning" },
  delivered:    { label: "Livré",         status: "success" },
};

// Activité 30 derniers jours (1 valeur / jour)
const ACTIVITY_30D = [
  3, 5, 4, 7, 6, 8, 5, 9, 12, 8, 10, 11, 14, 13, 9, 12, 15, 11, 13, 16,
  18, 14, 12, 17, 19, 15, 14, 20, 22, 18,
];

export default async function ProDashboard({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-8">
      {/* Header + actions rapides */}
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-cream-300 bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50 p-6 shadow-card md:p-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-forest-100 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-forest-700">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
            Tableau de bord pro
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
            Bonjour, Cabinet Dupont <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-forest-900/70">12 dossiers actifs · MRR en hausse de <span className="font-semibold text-forest-700">14 %</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/o/projects`}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-forest-600 px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-forest-800"
          >
            + Nouveau dossier
          </Link>
          <Button variant="secondary" size="md">📷 Capture mobile</Button>
          <Button variant="ghost" size="md">📥 Import CSV</Button>
        </div>
      </header>

      {/* 4 KpiCards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<span aria-hidden>💶</span>}
          label="MRR"
          value="2 156 €"
          trend={{ direction: "up", value: "+14 %", period: "vs M-1" }}
          sparkline={[1500, 1620, 1750, 1820, 1890, 2000, 2050, 2156]}
        />
        <KpiCard
          icon={<span aria-hidden>🎯</span>}
          iconBg="bg-amber-100"
          iconColor="text-amber-700"
          label="Taux conversion"
          value="32,6 %"
          trend={{ direction: "up", value: "+3,4 pts", period: "vs M-1" }}
        />
        <KpiCard
          icon={<span aria-hidden>📁</span>}
          iconBg="bg-info-100"
          iconColor="text-info-700"
          label="Dossiers / mois"
          value="18"
          trend={{ direction: "up", value: "+5", period: "vs M-1" }}
          sparkline={ACTIVITY_30D.slice(-7)}
        />
        <KpiCard
          icon={<span aria-hidden>⭐</span>}
          iconBg="bg-success-100"
          iconColor="text-success-700"
          label="CSAT clients"
          value="4,7 / 5"
          trend={{ direction: "up", value: "+0,2 pts", period: "vs M-1" }}
          helpText="Sur 23 réponses"
        />
      </section>

      {/* Activité 30j */}
      <Card>
        <CardHeader>
          <CardTitle>Activité 30 derniers jours</CardTitle>
          <CardDescription>Dossiers créés par jour</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityChart values={ACTIVITY_30D} />
        </CardContent>
      </Card>

      {/* Récents projets + Actions rapides */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Dossiers récents</CardTitle>
            <CardDescription>Les 5 derniers projets actifs</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-stone-100">
              {RECENT_PROJECTS.map(p => {
                const st = STATUS_LABEL[p.status];
                return (
                  <li key={p.id}>
                    <Link href={`/${locale}/o/projects/${p.id}`} className="flex flex-wrap items-center gap-3 py-3 transition hover:bg-stone-50/50 -mx-2 px-2 rounded-md">
                      <DPELabel classification={p.dpe} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-forest-900">{p.name}</p>
                          <StatusBadge status={st.status} size="sm">{st.label}</StatusBadge>
                        </div>
                        <p className="mt-0.5 text-xs text-forest-900/55">{p.client} · {p.segment} · {p.surface} m²</p>
                      </div>
                      <span className="text-2xs text-forest-900/45">{p.updated}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 text-right">
              <Link href={`/${locale}/o/projects`} className="text-xs font-semibold text-forest-700 hover:text-forest-800 hover:underline">Voir tous les dossiers →</Link>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides + tips */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-forest-900/85">
                <li><Link href={`/${locale}/o/projects?new=1`} className="flex items-center gap-2.5 rounded-lg p-2 transition hover:bg-cream-100 hover:text-forest-800"><span aria-hidden className="text-base">📁</span> Nouveau dossier</Link></li>
                <li><Link href={`/${locale}/o/clients?new=1`} className="flex items-center gap-2.5 rounded-lg p-2 transition hover:bg-cream-100 hover:text-forest-800"><span aria-hidden className="text-base">👤</span> Nouveau client</Link></li>
                <li><Link href={`/${locale}/o/reports?new=1`} className="flex items-center gap-2.5 rounded-lg p-2 transition hover:bg-cream-100 hover:text-forest-800"><span aria-hidden className="text-base">📄</span> Générer un rapport</Link></li>
                <li><Link href={`/${locale}/o/library/materials`} className="flex items-center gap-2.5 rounded-lg p-2 transition hover:bg-cream-100 hover:text-forest-800"><span aria-hidden className="text-base">🧱</span> Bibliothèque matériaux</Link></li>
                <li><Link href={`/${locale}/o/tools`} className="flex items-center gap-2.5 rounded-lg p-2 transition hover:bg-cream-100 hover:text-forest-800"><span aria-hidden className="text-base">🛠</span> Outils calculs</Link></li>
              </ul>
              <p className="mt-3 border-t border-cream-200 pt-3 text-2xs text-forest-900/60">
                💡 Raccourcis : <kbd className="rounded-md border border-cream-300 bg-cream-50 px-1.5 font-mono text-forest-800">N</kbd> nouveau · <kbd className="rounded-md border border-cream-300 bg-cream-50 px-1.5 font-mono text-forest-800">G</kbd> rapport · <kbd className="rounded-md border border-cream-300 bg-cream-50 px-1.5 font-mono text-forest-800">/</kbd> recherche
              </p>
            </CardContent>
          </Card>

          <Card variant="featured">
            <p className="text-2xs font-semibold uppercase tracking-wider text-amber-700">💡 Astuce du jour</p>
            <p className="mt-2 text-sm leading-relaxed text-forest-900/85">
              Importez vos dossiers existants en CSV pour migrer rapidement depuis votre ancien outil.
              <Link href={`/${locale}/help/import-csv`} className="ml-1 font-semibold text-forest-700 hover:text-forest-800 hover:underline">Voir le guide →</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActivityChart({ values }: { values: number[] }) {
  const W = 720, H = 140;
  const PAD = { top: 10, right: 10, bottom: 24, left: 30 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = Math.max(...values);
  const barW = innerW / values.length - 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Activité dossiers 30 derniers jours">
      <defs>
        <linearGradient id="actBarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2d5a3e" />
          <stop offset="100%" stopColor="#4a7050" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(r => (
        <line key={r} x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH * (1 - r)} y2={PAD.top + innerH * (1 - r)} stroke="#ede3c8" strokeWidth="1" />
      ))}
      {values.map((v, i) => {
        const h = (v / max) * innerH;
        const x = PAD.left + i * (barW + 2);
        const y = PAD.top + innerH - h;
        return <rect key={i} x={x} y={y} width={barW} height={h} fill="url(#actBarGrad)" rx="2" />;
      })}
      <text x={PAD.left} y={H - 6} fontSize="10" fill="#7e7150">J-30</text>
      <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize="10" fill="#7e7150">aujourd'hui</text>
      <text x={PAD.left - 6} y={PAD.top + 8} textAnchor="end" fontSize="10" fill="#7e7150">{max}</text>
      <text x={PAD.left - 6} y={H - PAD.bottom + 4} textAnchor="end" fontSize="10" fill="#7e7150">0</text>
    </svg>
  );
}
