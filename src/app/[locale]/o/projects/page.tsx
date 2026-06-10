// app/[locale]/o/projects/page.tsx — Table dossiers pro filterable v2.1
// v2.1 — Bouton « + Nouveau dossier » fonctionnel : Link vers /o/projects/new
//        qui redirige vers le wizard de création.
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { DPELabel } from "@/components/results/DPELabel";

interface Props { params: Promise<{ locale: string }> }

const PROJECTS = [
  { id: "p1", name: "Maison Martin",    client: "Pierre Martin",  segment: "particulier", team: "JD",   surface: 132,  dpe: "D" as const, status: "in_progress", updated: "2h" },
  { id: "p2", name: "Copro Tilleuls",   client: "Foncia",          segment: "copro",      team: "JD",   surface: 2_800, dpe: "F" as const, status: "review",     updated: "1j" },
  { id: "p3", name: "Bureau ABC",       client: "ABC Conseil",     segment: "tertiaire",  team: "ML",   surface: 480,  dpe: "E" as const, status: "draft",      updated: "3j" },
  { id: "p4", name: "Maison Dubois",    client: "Sophie Dubois",   segment: "particulier", team: "JD",   surface: 95,   dpe: "C" as const, status: "delivered",  updated: "5j" },
  { id: "p5", name: "Immeuble Jaurès",  client: "SCI Jaurès",      segment: "copro",      team: "ML",   surface: 1_200, dpe: "G" as const, status: "delivered",  updated: "1 sem" },
];

const STATUS_TONE: Record<string, "neutral" | "info" | "warning" | "success"> = {
  draft: "neutral",
  in_progress: "info",
  review: "warning",
  delivered: "success",
};
const STATUS_KEY: Record<string, "statusDraft" | "statusInProgress" | "statusReview" | "statusDelivered"> = {
  draft: "statusDraft",
  in_progress: "statusInProgress",
  review: "statusReview",
  delivered: "statusDelivered",
};
const SEGMENT_KEY: Record<string, "segmentParticulier" | "segmentCopro" | "segmentTertiaire"> = {
  particulier: "segmentParticulier",
  copro: "segmentCopro",
  tertiaire: "segmentTertiaire",
};

export default async function ProProjectsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "oProjects" });
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 rounded-3xl border border-cream-300 bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50 p-6 shadow-card md:p-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-forest-100 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-forest-700">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
            {t("eyebrow")}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
            {t("title")}
          </h1>
          <p className="mt-1.5 text-sm text-forest-900/70">{t("subtitleCount", { count: PROJECTS.length, active: 12, delivered: 3 })}</p>
        </div>
        <Link
          href={`/${locale}/o/projects/new`}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-600 px-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-forest-800 hover:shadow-md"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          {t("newCta")}
        </Link>
      </header>

      {/* Filtres */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <input type="search" placeholder={t("searchPlaceholder")} className="h-10 min-w-[200px] flex-1 rounded-lg border border-cream-400 px-3.5 text-sm text-forest-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-200/40" />
            <select className="h-10 rounded-lg border border-cream-400 px-3 text-sm text-forest-900">
              <option>{t("filterAllStatus")}</option>
              <option>{t("statusDraft")}</option>
              <option>{t("statusInProgress")}</option>
              <option>{t("statusReview")}</option>
              <option>{t("statusDelivered")}</option>
            </select>
            <select className="h-10 rounded-lg border border-cream-400 px-3 text-sm text-forest-900">
              <option>{t("filterAllSegments")}</option>
              <option>{t("segmentParticulier")}</option>
              <option>{t("segmentCopro")}</option>
              <option>{t("segmentTertiaire")}</option>
            </select>
            <select className="h-10 rounded-lg border border-cream-400 px-3 text-sm text-forest-900">
              <option>{t("filterAllTeam")}</option>
              <option>Jean Dupont (JD)</option>
              <option>Marie L. (ML)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table dense */}
      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-2xs uppercase tracking-wider text-stone-600">
              <tr>
                <th className="px-4 py-2.5 text-left">{t("thDpe")}</th>
                <th className="px-4 py-2.5 text-left">{t("thDossier")}</th>
                <th className="px-4 py-2.5 text-left">{t("thClient")}</th>
                <th className="px-4 py-2.5 text-left">{t("thSegment")}</th>
                <th className="px-4 py-2.5 text-right">{t("thSurface")}</th>
                <th className="px-4 py-2.5 text-left">{t("thTeam")}</th>
                <th className="px-4 py-2.5 text-left">{t("thStatus")}</th>
                <th className="px-4 py-2.5 text-right">{t("thUpdated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {PROJECTS.map(p => (
                <tr key={p.id} className="hover:bg-stone-50/50">
                  <td className="px-4 py-3"><DPELabel classification={p.dpe} size="sm" /></td>
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    <Link href={`/${locale}/o/projects/${p.id}`} className="hover:text-teal-700 hover:underline">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{p.client}</td>
                  <td className="px-4 py-3 text-xs text-stone-500">{t(SEGMENT_KEY[p.segment])}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.surface.toLocaleString(locale)} m²</td>
                  <td className="px-4 py-3">
                    <span aria-hidden className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-2xs font-bold text-white">{p.team}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={STATUS_TONE[p.status]} size="sm">{t(STATUS_KEY[p.status])}</StatusBadge></td>
                  <td className="px-4 py-3 text-right text-xs text-stone-500">{p.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
