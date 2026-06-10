// app/[locale]/p/projects/[id]/synthese/page.tsx — v3.1 (étape 2 freemium UI)
// Server Component : exécute le moteur Rich en SSR sur le projet courant,
// rend les KPIs réellement calculés, embed le bouton de téléchargement PDF.
//
// ⚠️ Source de données : SAMPLE_BUILDING (jeu de démo statique) tant que les
// formulaires Enveloppe/Systèmes ne sont pas branchés à la persistance Prisma.
// Banner explicite affichée pour ne pas tromper le testeur.
//
// v3.1 — Étape 2 MVP freemium :
//   - lit le plan via `getCurrentBillingPlan()` (placeholder serveur "FREE")
//   - calcule remainingProjects via `getRemainingProjects` + usage placeholder
//   - rend la carte `FreemiumStatus` sous la bannière démo
//   - gate le `DownloadReportButton` du Hero : remplacé par un texte de renvoi
//     pour les plans sans `fullPdf` (évite un bypass FREE → PDF complet)
//   - aucune touche à la logique calc / DPE / scénarios / vigilance

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DPELabel } from "@/components/results/DPELabel";
import { DownloadReportButton } from "@/components/calc/DownloadReportButton";
import { FreemiumStatus } from "@/components/billing/FreemiumStatus";
import { ProjectSummaryEditor } from "@/components/project-summary/ProjectSummaryEditor";
import type { ProjectNarrativeInputs } from "@/lib/project-summary/project-narrative";
import { getCurrentBillingPlan } from "@/server/auth/getCurrentBillingPlan";
import { getPlanLimits } from "@/lib/billing/plan-limits";
import {
  getRemainingProjects,
  type UpgradeReason,
  type UsageSnapshot,
} from "@/lib/billing/usage-policy";
import { consolidateProjectResultRich } from "@/lib/calc/result/consolidate-rich";
import { SAMPLE_BUILDING, SAMPLE_HOUSEHOLD, SAMPLE_SCENARIOS } from "@/lib/calc/samples/maison-1975";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function SynthesePage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "pSyn" });

  // ── Plan billing courant (SOURCE SERVEUR — placeholder étape 2 freemium) ──
  // `getCurrentBillingPlan` retourne "FREE" en dur tant que NextAuth + Prisma
  // ne sont pas branchés. Cette valeur n'est JAMAIS issue d'un signal client.
  const plan = await getCurrentBillingPlan();
  const planLimits = getPlanLimits(plan);

  // Snapshot d'usage placeholder honnête : la page synthèse implique au
  // minimum qu'un projet existe (ce projet courant). Côté FREE cela rend
  // `remainingProjects = 0` et déclenche le CTA upgrade — fidèle à la policy.
  // À remplacer par une vraie lecture serveur à l'étape 3 (cf. checkProject…).
  const usagePlaceholder: UsageSnapshot = {
    activeProjectsCount: 1,
    pdfExportsThisMonth: 0,
    emailVerified: true,
  };
  const remainingProjects = getRemainingProjects(plan, usagePlaceholder);
  const blockedReason: UpgradeReason | undefined =
    plan === "FREE" ? "free_project_limit" : undefined;
  const canDownloadFullPdf = planLimits.fullPdf;
  const upgradeHref = `/${locale}/tarifs`;

  // Exécution moteur réelle en SSR
  const result = consolidateProjectResultRich({
    project_id: id,
    building: SAMPLE_BUILDING,
    household: SAMPLE_HOUSEHOLD,
    scenarios: SAMPLE_SCENARIOS,
  });

  const fmt = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 0 });
  const eur = (n: number) => `${fmt(n)} €`;
  const baseline = result.baseline;
  const reco = result.scenarios.find(s => s.scenario_id === result.recommended_scenario_id);

  return (
    <div className="space-y-6">
      {/* Banner sources de données — HONNÊTE */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm text-amber-900">
        <p className="font-semibold">{t("demoMode")}</p>
        <p className="mt-1 text-xs">
          {t("demoMsg", { engine: result.engine_version, params: result.parameters_version })}
        </p>
      </div>

      {/* ── Statut freemium / exports PDF — étape 2 MVP freemium ──
          Source du plan : `getCurrentBillingPlan()` côté serveur uniquement.
          Pour l'instant, placeholder retournant "FREE". Le composant
          `FreemiumStatus` reflète l'état décidé serveur ; il ne pilote rien.
          Les boutons PDF ci-dessous restent visuels à l'étape 2 — la
          politique watermark/full sera branchée à l'étape 4 dans
          `src/app/api/calc/pdf/route.ts`. */}
      <Card data-testid="synthese-freemium-card" data-plan={plan}>
        <CardHeader>
          <CardTitle>{t("offerTitle")}</CardTitle>
          <CardDescription>
            {t("offerDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FreemiumStatus
              plan={plan}
              remainingProjects={remainingProjects}
              blockedReason={blockedReason}
            />

            <div className="rounded-lg border border-stone-200 bg-stone-50/40 p-4">
              <p className="text-sm font-semibold text-stone-900">{t("exportsTitle")}</p>
              <p className="mt-0.5 text-xs text-stone-600">
                {plan === "FREE" ? t("exportsFreeMsg") : t("exportsProMsg")}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {/* Bouton « Aperçu PDF filigrané »
                    Étape 2 : visuel uniquement — la mécanique route handler
                    sera branchée à l'étape 4 (FREE = mode watermarked_preview
                    forcé serveur). Désactivé pour ne pas tromper l'utilisateur
                    en démo. */}
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title={t("watermarkTitle")}
                  data-testid="synthese-pdf-watermarked-preview"
                  className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium text-stone-500 opacity-70"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                  </svg>
                  {t("watermarkBtn")}
                </button>

                {/* Bouton « PDF complet »
                    FREE : désactivé proprement avec libellé explicite + tooltip.
                    PRO/TRIAL/TEAM/ENTERPRISE : on conserve le DownloadReportButton
                    existant (route handler actuelle inchangée à cette étape). */}
                {canDownloadFullPdf ? (
                  <div data-testid="synthese-pdf-full-enabled">
                    <DownloadReportButton
                      result={result}
                      label={t("fullPdfBtnPro")}
                      size="md"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    title={t("fullPdfDisabledTitle")}
                    data-testid="synthese-pdf-full-disabled"
                    className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-stone-300 bg-stone-100 px-4 text-sm font-medium text-stone-500"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15l-4-4m4 4l4-4m-4 4V3M4 20h16" />
                    </svg>
                    {t("fullPdfDisabledBtn")}
                  </button>
                )}

                {/* CTA upgrade — affiché uniquement en FREE.
                    Lien Server-side vers la page tarifs existante ; on ne
                    modifie pas la page tarifs (hors périmètre étape 2). */}
                {plan === "FREE" ? (
                  <Link
                    href={upgradeHref}
                    data-testid="synthese-upgrade-cta"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-terracotta-500 px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 focus-visible:ring-offset-2"
                  >
                    {t("upgradeBtn")}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero synthèse — RÉEL calculé */}
      <Card variant="featured">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">{t("heroEyebrow")}</p>
            <h2
              className="mt-1 font-serif text-2xl font-bold text-forest-900 sm:text-3xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              {t("heroTitle")}
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-forest-900/65">
              {reco ? (
                <>
                  {t("gainPrefix")} <strong>{reco.savings.dpe_steps_gained} {t("classesSuffix")}</strong>{" "}
                  {t("goingFrom")} <strong>{baseline.dpe_label}</strong> {t("to")} <strong>{reco.after.dpe_label}</strong>{" "}
                  {t("viaScenario")} « {reco.scenario_name} ».
                </>
              ) : t("noScenario")}
            </p>

            {/* Bouton PDF du Hero — gated étape 2 : on n'affiche le téléchargement
                réel que si le plan autorise le PDF complet. Pour FREE on évite
                d'exposer un bouton non protégé : un message renvoie vers la carte
                « Votre offre et vos exports » plus haut. */}
            <div className="mt-4">
              {canDownloadFullPdf ? (
                <DownloadReportButton result={result} label={t("downloadFull")} size="md" />
              ) : (
                <p className="text-xs text-stone-600">
                  {t("downloadFromSection")}
                  {" "}
                  <span className="font-semibold text-stone-800">{t("offerSection")}</span>
                  {" "}{t("above")}
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <DPELabel variant="beforeAfter" before={baseline.dpe_label} after={reco?.after.dpe_label ?? baseline.dpe_label} />
          </div>
        </div>
      </Card>

      {/* Aperçu enveloppe + systèmes — RÉEL */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("envelopeTitle")}</CardTitle>
            <CardDescription>{t("envelopeDesc", { walls: result.building.walls.length, openings: result.building.openings.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-stone-100 text-sm">
              {result.heat_loss_breakdown.items.slice(0, 4).map(item => (
                <li key={item.code} className="flex items-start gap-3 py-3">
                  <span aria-hidden className="text-xl">
                    {item.code === "WALLS" ? "🧱" : item.code === "ROOFS" ? "🏠" : item.code === "FLOORS" ? "⬇️" : item.code === "OPENINGS" ? "🪟" : "🌬️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-900">{item.label}</p>
                    <p className="text-xs text-stone-500">
                      {t("uaLabel")} {fmt(item.ua_W_K)} W/K · {Math.round(item.share * 100)}% {t("lossesShare")} ·{" "}
                      <span className={
                        item.priority === "HAUTE" ? "font-semibold text-rose-700" :
                        item.priority === "MOYENNE" ? "font-semibold text-amber-700" :
                        "text-stone-500"
                      }>
                        {t("prioPrefix")} {item.priority.toLowerCase()}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("systemsTitle")}</CardTitle>
            <CardDescription>{t("systemsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-stone-100 text-sm">
              {result.building.heating.map(h => (
                <li key={h.id} className="flex items-start gap-3 py-3">
                  <span aria-hidden className="text-xl">🔥</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-900">{t("heatingLabel")} {h.kind.replace(/_/g, " ")}</p>
                    <p className="text-xs text-stone-500">
                      {t("energyLabel")} {h.carrier} · {h.install_year ? `${t("installed")} ${h.install_year}` : t("yearMissing")}
                    </p>
                  </div>
                </li>
              ))}
              {result.building.dhw.map(d => (
                <li key={d.id} className="flex items-start gap-3 py-3">
                  <span aria-hidden className="text-xl">🚿</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-900">{t("dhwLabel")} {d.kind.replace(/_/g, " ")}</p>
                    <p className="text-xs text-stone-500">{t("energyLabel")} {d.carrier}</p>
                  </div>
                </li>
              ))}
              <li className="flex items-start gap-3 py-3">
                <span aria-hidden className="text-xl">🌬️</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-900">{t("ventilationLabel")} {result.building.ventilation.kind.replace(/_/g, " ")}</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Analyse globale — RÉEL */}
      <Card>
        <CardHeader>
          <CardTitle>{t("globalTitle")}</CardTitle>
          <CardDescription>{t("globalDesc", { version: result.engine_version })}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("heatingNeeds")}</dt>
              <dd className="mt-1 font-serif text-2xl font-bold text-stone-900 tabular-nums">
                {fmt(baseline.heating_needs_kWh_year / result.building.surface_habitable_m2)}
                <span className="text-sm font-normal text-stone-500"> kWh/m²/an</span>
              </dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("cepConso")}</dt>
              <dd className="mt-1 font-serif text-2xl font-bold text-stone-900 tabular-nums">
                {fmt(baseline.cep_kWh_m2_year)}
                <span className="text-sm font-normal text-stone-500"> kWh/m²/an</span>
              </dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("co2Emiss")}</dt>
              <dd className="mt-1 font-serif text-2xl font-bold text-stone-900 tabular-nums">
                {fmt(baseline.ges_kgCO2_m2_year)}
                <span className="text-sm font-normal text-stone-500"> kgCO₂/m²/an</span>
              </dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("annualBill")}</dt>
              <dd className="mt-1 font-serif text-2xl font-bold text-stone-900 tabular-nums">{eur(baseline.annual_cost_eur)}</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("summerComfort")}</dt>
              <dd className="mt-1 font-serif text-2xl font-bold text-stone-900 tabular-nums">
                {result.summer_comfort.tic_estimated_C}<span className="text-sm font-normal text-stone-500">°C</span>
              </dd>
              <dd className="mt-0.5 text-xs text-stone-500">{result.summer_comfort.level}</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("reliabilityLevel")}</dt>
              <dd className="mt-1 font-serif text-2xl font-bold text-stone-900 tabular-nums">
                {result.confidence.score}<span className="text-sm font-normal text-stone-500">/100</span>
              </dd>
              <dd className="mt-0.5 text-xs text-stone-500">{result.confidence.level}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Scénarios calculés — RÉEL */}
      <Card>
        <CardHeader>
          <CardTitle>{t("scenariosCount", { n: result.scenarios.length })}</CardTitle>
          <CardDescription>{t("scenariosDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {result.scenarios.map(s => {
              const isReco = s.scenario_id === result.recommended_scenario_id;
              return (
                <li
                  key={s.scenario_id}
                  className={[
                    "rounded-xl border p-4",
                    isReco ? "border-forest-600 bg-forest-50/40 ring-1 ring-forest-600/20" : "border-stone-200 bg-white",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-stone-900">
                      {isReco && <span className="mr-1">★</span>}{s.scenario_name}
                    </p>
                    <span className="text-xs text-stone-500">{t("dpeAfter")} <strong>{s.after.dpe_label}</strong> (+{s.savings.dpe_steps_gained})</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-stone-700 sm:grid-cols-4">
                    <span>{t("savings")} <strong className="text-emerald-700">{eur(s.savings.energy_eur_year)}{t("perYear")}</strong></span>
                    <span>{t("cost")} <strong>{eur(s.works_cost_eur)}</strong></span>
                    <span>{t("aids")} <strong className="text-emerald-700">{eur(s.aids.total_subsidy_eur)}</strong></span>
                    <span>{t("rac")} <strong>{eur(s.out_of_pocket_eur)}</strong>{s.payback_years ? ` · ${t("paybackPrefix")} ${s.payback_years} ${t("yearsSuffix")}` : ""}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Résumé du projet / Synthèse de visite — intégration MVP */}
      <ProjectSummaryEditor
        projectId={id}
        inputs={buildNarrativeInputs(result)}
      />

      {/* Lien retour + warnings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("warningsTitle", { n: result.warnings.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {result.warnings.length === 0 ? (
            <p className="text-sm text-stone-600">{t("noWarnings")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {result.warnings.map((w, i) => (
                <li key={i} className="rounded-md border-l-4 border-amber-400 bg-amber-50 px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-900">[{w.severity}] {w.code}</p>
                  <p className="mt-0.5 text-amber-900/85">{w.message}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-stone-500">
            {t("complianceStatus")} <strong>{result.compliance.global.globalStatus}</strong>.
            {" "}{t("syntheseIndicative")}{" "}
            <Link href={`/${locale}/help/getting-started`} className="text-forest-700 hover:underline">{t("learnMore")}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Map du `result` moteur Rich vers les inputs du narrative.
 * Pure et tolérante : tout champ absent → laissé undefined → la lib narrative
 * marquera "à confirmer" dans les confidenceNotes.
 */
function buildNarrativeInputs(
  result: ReturnType<typeof consolidateProjectResultRich>,
): ProjectNarrativeInputs {
  const b = result.building;
  const heating = b.heating?.[0];
  const dhw = b.dhw?.[0];
  const reco = result.scenarios.find(
    (s) => s.scenario_id === result.recommended_scenario_id,
  );

  return {
    constructionYear: b.construction_year,
    surfaceHabitableM2: b.surface_habitable_m2,
    climateZone: b.climate_zone,
    heatingSystem: heating ? heating.kind.replace(/_/g, " ").toLowerCase() : undefined,
    heatingEnergy: heating?.carrier?.toLowerCase(),
    dhwSystem: dhw ? dhw.kind.replace(/_/g, " ").toLowerCase() : undefined,
    ventilationSystem: b.ventilation?.kind?.replace(/_/g, " ").toLowerCase(),
    recommendedScenarios: reco
      ? [
          {
            name: reco.scenario_name,
            dpeAfter: reco.after.dpe_label,
            costEur: reco.works_cost_eur,
          },
        ]
      : undefined,
  };
}
