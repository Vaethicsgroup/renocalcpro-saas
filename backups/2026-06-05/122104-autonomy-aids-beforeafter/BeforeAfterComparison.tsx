// src/components/results/BeforeAfterComparison.tsx
// ════════════════════════════════════════════════════════════════════════════
// Carte de comparaison côte-à-côte état initial vs après travaux.
// Affiche DPE / GES / Cep / consommation / coût annuel / émissions avec :
//   - étiquettes DPE/GES en grand
//   - delta absolu et pourcentage
//   - flèche directionnelle (vert si amélioration, ambre si stable, rouge si dégradation)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import {
  ArrowDownRight,
  ArrowRight,
  TrendingDown,
  Leaf,
  Zap,
  Coins,
  Flame,
} from "lucide-react";
import { DPELabel } from "@/components/results/DPELabel";

const fmtEur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const fmtNum = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

const DPE_LETTER_ORDER = ["A", "B", "C", "D", "E", "F", "G"] as const;
type DpeLetter = (typeof DPE_LETTER_ORDER)[number];

interface State {
  dpe_label: DpeLetter;
  ges_label: DpeLetter;
  cep_kWh_m2_year: number;
  consumption_primary_kWh_year: number;
  emissions_kgCO2_year: number;
  annual_cost_eur: number;
}

interface Props {
  before: State;
  after: State;
  scenarioName: string;
}

export function BeforeAfterComparison({
  before,
  after,
  scenarioName,
}: Props) {
  const stepsDpeGained =
    DPE_LETTER_ORDER.indexOf(before.dpe_label) -
    DPE_LETTER_ORDER.indexOf(after.dpe_label);
  const stepsGesGained =
    DPE_LETTER_ORDER.indexOf(before.ges_label) -
    DPE_LETTER_ORDER.indexOf(after.ges_label);

  const cepDelta = before.cep_kWh_m2_year - after.cep_kWh_m2_year;
  const cepPct =
    before.cep_kWh_m2_year > 0
      ? (cepDelta / before.cep_kWh_m2_year) * 100
      : 0;
  const consoDelta =
    before.consumption_primary_kWh_year - after.consumption_primary_kWh_year;
  const consoPct =
    before.consumption_primary_kWh_year > 0
      ? (consoDelta / before.consumption_primary_kWh_year) * 100
      : 0;
  const emissionsDelta = before.emissions_kgCO2_year - after.emissions_kgCO2_year;
  const emissionsPct =
    before.emissions_kgCO2_year > 0
      ? (emissionsDelta / before.emissions_kgCO2_year) * 100
      : 0;
  const costDelta = before.annual_cost_eur - after.annual_cost_eur;
  const costPct =
    before.annual_cost_eur > 0
      ? (costDelta / before.annual_cost_eur) * 100
      : 0;

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-forest-300 bg-white shadow-sm">
      <header className="border-b border-forest-200 bg-forest-50 px-5 py-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Avant → Après travaux
          </p>
          <span className="text-xs text-stone-600">· {scenarioName}</span>
        </div>
      </header>

      {/* DPE + GES côte à côte */}
      <div className="grid grid-cols-1 gap-px bg-cream-200 sm:grid-cols-2">
        <BadgePair
          label="Étiquette DPE"
          beforeLetter={before.dpe_label}
          afterLetter={after.dpe_label}
          stepsGained={stepsDpeGained}
        />
        <BadgePair
          label="Étiquette GES"
          beforeLetter={before.ges_label}
          afterLetter={after.ges_label}
          stepsGained={stepsGesGained}
        />
      </div>

      {/* KPIs détaillés */}
      <div className="grid grid-cols-1 gap-px bg-cream-200 sm:grid-cols-2">
        <DeltaRow
          icon={Zap}
          iconColor="text-amber-600"
          label="Consommation primaire"
          beforeText={`${fmtNum(before.consumption_primary_kWh_year)} kWh/an`}
          afterText={`${fmtNum(after.consumption_primary_kWh_year)} kWh/an`}
          deltaText={`−${fmtNum(consoDelta)} kWh/an`}
          deltaPct={consoPct}
        />
        <DeltaRow
          icon={TrendingDown}
          iconColor="text-night-600"
          label="Cep (kWh EP/m²·an)"
          beforeText={`${fmtNum(before.cep_kWh_m2_year)}`}
          afterText={`${fmtNum(after.cep_kWh_m2_year)}`}
          deltaText={`−${fmtNum(cepDelta)}`}
          deltaPct={cepPct}
        />
        <DeltaRow
          icon={Coins}
          iconColor="text-forest-700"
          label="Facture énergie annuelle"
          beforeText={fmtEur.format(before.annual_cost_eur)}
          afterText={fmtEur.format(after.annual_cost_eur)}
          deltaText={`−${fmtEur.format(costDelta)}`}
          deltaPct={costPct}
        />
        <DeltaRow
          icon={Leaf}
          iconColor="text-forest-700"
          label="Émissions CO₂"
          beforeText={`${fmtNum(before.emissions_kgCO2_year)} kg/an`}
          afterText={`${fmtNum(after.emissions_kgCO2_year)} kg/an`}
          deltaText={`−${fmtNum(emissionsDelta)} kg/an`}
          deltaPct={emissionsPct}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function BadgePair({
  label,
  beforeLetter,
  afterLetter,
  stepsGained,
}: {
  label: string;
  beforeLetter: DpeLetter;
  afterLetter: DpeLetter;
  stepsGained: number;
}) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <div className="mt-3 flex items-center justify-around gap-3">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-semibold uppercase text-stone-500">
            Avant
          </span>
          <DPELabel classification={beforeLetter} size="lg" />
        </div>
        <div className="flex flex-col items-center">
          <ArrowRight className="h-6 w-6 text-forest-600" strokeWidth={2.5} />
          {stepsGained > 0 && (
            <span className="mt-1 rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-bold text-forest-800">
              +{stepsGained} classe{stepsGained > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-semibold uppercase text-stone-500">
            Après
          </span>
          <DPELabel classification={afterLetter} size="lg" />
        </div>
      </div>
    </div>
  );
}

function DeltaRow({
  icon: Icon,
  iconColor,
  label,
  beforeText,
  afterText,
  deltaText,
  deltaPct,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  beforeText: string;
  afterText: string;
  deltaText: string;
  deltaPct: number;
}) {
  return (
    <div className="bg-white p-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <p className="text-xs font-semibold text-stone-700">{label}</p>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div>
          <p className="text-xs text-stone-500">Avant</p>
          <p className="tabular-nums text-sm font-semibold text-stone-800">
            {beforeText}
          </p>
        </div>
        <ArrowRight className="h-3 w-3 text-stone-400" />
        <div className="text-right">
          <p className="text-xs text-stone-500">Après</p>
          <p className="tabular-nums text-sm font-semibold text-forest-800">
            {afterText}
          </p>
        </div>
      </div>
      {deltaPct > 0 && (
        <div className="mt-2 flex items-center justify-end gap-1 rounded-md bg-forest-50 px-2 py-1 text-xs font-semibold text-forest-700">
          <ArrowDownRight className="h-3 w-3" />
          {deltaText} ({deltaPct.toFixed(0)} %)
        </div>
      )}
    </div>
  );
}
