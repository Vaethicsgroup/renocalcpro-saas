// app/[locale]/o/projects/[id]/identite/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Synthèse projet — page principale conforme maquette client :
//   - 3 cartes : Informations générales / Performance énergétique / Avancement
//   - Section Scénarios en bas avec 3 cards + bouton + Nouveau scénario
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Building2,
  TrendingDown,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { DPELabel } from "@/components/results/DPELabel";

// Données démo conformes maquette
const PROJECT = {
  client: "Martin Sophie",
  address: "12 rue des Lilas",
  postalCity: "13080 Aix-en-Provence",
  buildingTypeKey: "buildingTypeMaison",
  constructionYear: 1965,
  surface: 120,
  createdAt: "2024-05-10",
  updatedAt: "2024-05-20",
};

const PERFORMANCE = {
  before: { dpe: "E" as const, cep: 299, co2: 61 },
  bestScenario: { dpe: "B" as const, cep: 86, co2: 12 },
  gainConsumption: -71,
  gainEmissions: -80,
};

const PROGRESS: ReadonlyArray<{ labelKey: string; done: boolean; current?: boolean }> = [
  { labelKey: "stepCollect", done: true },
  { labelKey: "stepAudit", done: true },
  { labelKey: "stepScenarios", done: false, current: true },
  { labelKey: "stepBudget", done: false },
  { labelKey: "stepReport", done: false },
  { labelKey: "stepPresentation", done: false },
];

interface ScenarioDef {
  id: string;
  nameKey: string;
  gain: number;
  dpe: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  budget: number;
  recommended?: boolean;
}

const SCENARIOS: ReadonlyArray<ScenarioDef> = [
  { id: "s1", nameKey: "scenarioName_s1", gain: -55, dpe: "C", budget: 45200 },
  { id: "s2", nameKey: "scenarioName_s2", gain: -71, dpe: "B", budget: 66000, recommended: true },
  { id: "s3", nameKey: "scenarioName_s3", gain: -82, dpe: "A", budget: 93400 },
];

export default function ProjectSynthese() {
  const [selectedScenario, setSelectedScenario] = useState<string>("s2");
  const t = useTranslations("oSynthese");
  const locale = useLocale();
  const fmtEur = (n: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale);

  return (
    <div className="space-y-6">
      {/* 3 cartes principales */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Informations générales */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-serif text-lg font-bold text-forest-900">
              {t("cardInfoTitle")}
            </h2>
            <dl className="mt-4 space-y-3">
              <Info label={t("labelClient")} value={PROJECT.client} />
              <Info
                label={t("labelAddress")}
                value={
                  <>
                    {PROJECT.address}
                    <br />
                    {PROJECT.postalCity}
                  </>
                }
              />
              <Info label={t("labelBuildingType")} value={t(PROJECT.buildingTypeKey)} />
              <Info label={t("labelConstructionYear")} value={PROJECT.constructionYear} />
              <Info label={t("labelSurface")} value={`${PROJECT.surface} m²`} />
              <Info label={t("labelCreated")} value={fmtDate(PROJECT.createdAt)} />
              <Info label={t("labelUpdated")} value={fmtDate(PROJECT.updatedAt)} />
            </dl>
          </CardContent>
        </Card>

        {/* Performance énergétique */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-serif text-lg font-bold text-forest-900">
              {t("cardPerfTitle")}
            </h2>

            {/* Avant travaux */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-stone-700">{t("perfBefore")}</p>
              <div className="mt-2 flex items-center gap-3">
                <DPELabel classification={PERFORMANCE.before.dpe} size="lg" />
                <div>
                  <p className="text-xl font-bold tabular-nums text-forest-900">
                    {PERFORMANCE.before.cep}
                    <span className="ml-1 text-[10px] font-normal text-stone-600">
                      kWh<sub>EP</sub>/m²·an
                    </span>
                  </p>
                  <p className="text-xs text-stone-600">
                    <strong>{PERFORMANCE.before.co2}</strong> kg CO₂/m²·an
                  </p>
                </div>
              </div>
            </div>

            {/* Meilleur scénario */}
            <div className="mt-5 border-t border-cream-200 pt-4">
              <p className="text-xs font-semibold text-stone-700">{t("perfBest")}</p>
              <div className="mt-2 flex items-center gap-3">
                <DPELabel classification={PERFORMANCE.bestScenario.dpe} size="lg" />
                <div>
                  <p className="text-xl font-bold tabular-nums text-forest-900">
                    {PERFORMANCE.bestScenario.cep}
                    <span className="ml-1 text-[10px] font-normal text-stone-600">
                      kWh<sub>EP</sub>/m²·an
                    </span>
                  </p>
                  <p className="text-xs text-stone-600">
                    <strong>{PERFORMANCE.bestScenario.co2}</strong> kg CO₂/m²·an
                  </p>
                </div>
              </div>
            </div>

            {/* Gain énergétique */}
            <div className="mt-5 border-t border-cream-200 pt-4">
              <p className="text-xs font-semibold text-stone-700">{t("perfGain")}</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-forest-200 bg-forest-50/40 p-3 text-center">
                  <p
                    className="font-serif text-3xl font-bold text-forest-700"
                    style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
                  >
                    {PERFORMANCE.gainConsumption}%
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-stone-500">
                    {t("perfGainConsumption")}
                  </p>
                </div>
                <div className="rounded-lg border border-forest-200 bg-forest-50/40 p-3 text-center">
                  <p
                    className="font-serif text-3xl font-bold text-forest-700"
                    style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
                  >
                    {PERFORMANCE.gainEmissions}%
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-stone-500">
                    {t("perfGainEmissions")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avancement du projet */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-serif text-lg font-bold text-forest-900">
              {t("cardProgressTitle")}
            </h2>
            <ol className="mt-4 space-y-3">
              {PROGRESS.map((step) => (
                <li key={step.labelKey} className="flex items-center gap-3">
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-forest-600" />
                  ) : step.current ? (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest-600 text-[10px] font-bold text-white">
                      ●
                    </span>
                  ) : (
                    <Circle
                      className="h-5 w-5 shrink-0 text-stone-300"
                      strokeWidth={1.75}
                    />
                  )}
                  <span
                    className={[
                      "text-sm",
                      step.done
                        ? "text-stone-700"
                        : step.current
                          ? "font-semibold text-forest-900"
                          : "text-stone-500",
                    ].join(" ")}
                  >
                    {t(step.labelKey)}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Scénarios */}
      <section>
        <h2 className="mb-4 font-serif text-xl font-bold text-forest-900">{t("scenariosTitle")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SCENARIOS.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              name={t(s.nameKey)}
              recommendedLabel={t("scenarioRecommended")}
              taglineLabel={t("scenarioTagline")}
              savingsLabel={t("scenarioSavingsPerYear")}
              dpeAfterLabel={t("scenarioDpeAfter")}
              budgetLabel={t("scenarioBudget")}
              budgetTtcLabel={t("scenarioBudgetTtc")}
              budgetFormatted={fmtEur(s.budget)}
              isSelected={selectedScenario === s.id}
              onSelect={() => setSelectedScenario(s.id)}
            />
          ))}
          <NewScenarioCard label={t("scenarioNew")} />
        </div>
      </section>
    </div>
  );
}

// ─── Composants ───────────────────────────────────────────────────────────

function Info({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-forest-900">{value}</dd>
    </div>
  );
}

function ScenarioCard({
  scenario,
  name,
  recommendedLabel,
  taglineLabel,
  savingsLabel,
  dpeAfterLabel,
  budgetLabel,
  budgetTtcLabel,
  budgetFormatted,
  isSelected,
  onSelect,
}: {
  scenario: ScenarioDef;
  name: string;
  recommendedLabel: string;
  taglineLabel: string;
  savingsLabel: string;
  dpeAfterLabel: string;
  budgetLabel: string;
  budgetTtcLabel: string;
  budgetFormatted: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "relative rounded-xl border-2 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        scenario.recommended
          ? "border-terracotta-300 bg-terracotta-50/30"
          : isSelected
            ? "border-forest-300"
            : "border-cream-200 hover:border-forest-200",
      ].join(" ")}
    >
      {scenario.recommended && (
        <span className="absolute -top-2 right-3 inline-flex items-center gap-0.5 rounded-full bg-terracotta-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          <Sparkles className="h-2.5 w-2.5" />
          {recommendedLabel}
        </span>
      )}
      <p className="text-sm font-semibold text-forest-900">{name}</p>
      <p className="mt-1 text-[11px] text-stone-600">{taglineLabel}</p>

      <p
        className="mt-3 font-serif text-3xl font-bold text-forest-700"
        style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
      >
        {scenario.gain}%
      </p>
      <p className="text-[10px] uppercase tracking-wider text-stone-500">
        {savingsLabel}
      </p>

      <div className="mt-3 flex items-center gap-2 border-t border-cream-200 pt-3">
        <DPELabel classification={scenario.dpe} size="sm" />
        <p className="text-xs text-stone-600">{dpeAfterLabel}</p>
      </div>

      <p className="mt-3 text-xs text-stone-500">
        {budgetLabel}&nbsp;:{" "}
        <strong className="text-forest-900">{budgetFormatted} {budgetTtcLabel}</strong>
      </p>
    </button>
  );
}

function NewScenarioCard({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cream-400 bg-white p-4 text-center text-stone-600 transition-colors hover:border-forest-400 hover:bg-forest-50 hover:text-forest-700"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-cream-100 transition-colors group-hover:bg-forest-100">
        <Plus className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}
