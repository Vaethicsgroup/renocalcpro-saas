// src/components/scenario/ScenarioBuilder.tsx
// ════════════════════════════════════════════════════════════════════════════
// Composant Expert : pickers détaillés pour scénario de rénovation personnalisé.
//
// Affiche pour chaque poste (Murs ITE/ITI, Combles, Toiture, Plancher, Chauffage,
// ECS, Ventilation) :
//   - le choix de matériau / système avec spécifications visibles (λ, R, COP, η,
//     €/m², €/kWh, durée de vie)
//   - les aides éligibles pour la cible du scénario (avec montant estimé)
//   - badges biosourcé, éligible MPR/CEE, etc.
//
// Adapté à la cible : MAISON_INDIV, APPARTEMENT, COPRO, HLM, TERTIAIRE_BUREAU,
// TERTIAIRE_COMMERCE, BATIMENT_PUBLIC.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useMemo, useState } from "react";
import {
  Leaf,
  Snowflake,
  Flame,
  Wind,
  Droplets,
  Coins,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  INSULATION_CATALOG,
  type InsulationMaterialSpec,
} from "@/lib/calc/catalog/insulation-materials";
import { HEATING_CATALOG } from "@/lib/calc/catalog/heating-systems";
import {
  DHW_CATALOG,
  VENTILATION_CATALOG,
} from "@/lib/calc/catalog/dhw-and-ventilation";
import type { AidSpec } from "@/lib/calc/catalog/aids-catalog";
import {
  computeScenarioBreakdown,
  POSTE_LABELS_FR,
  SCENARIO_TARGET_LABELS_FR,
  type CustomScenario,
  type InsulationChoice,
  type ScenarioTarget,
  type ScenarioBreakdown,
} from "@/lib/calc/scenarios/custom-scenario";
import type { InsulationMaterialKind } from "@/lib/calc/form/schema";
import type {
  DhwSystemKind,
  HeatingSystemKind,
  VentilationKind,
} from "@/lib/calc/types";

const fmtEur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const fmtNum = (n: number, digits = 2) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

interface Props {
  /** Cible bénéficiaire — détermine aides + recommandations. */
  target: ScenarioTarget;
  /** Bande de revenu pour estimation forfaits MaPrimeRénov'. */
  mprBand?: "BLEU" | "JAUNE" | "VIOLET" | "ROSE";
  /** Surfaces par poste, pré-remplies depuis le formulaire wizard si dispo. */
  defaultSurfaces?: Partial<Record<InsulationChoice["poste"], number>>;
  /** Callback à chaque changement de scénario — wizard peut sauvegarder. */
  onChange?: (scenario: CustomScenario, breakdown: ScenarioBreakdown) => void;
  /**
   * Si fourni, active le bouton "Calculer le gain énergétique" qui appelle la
   * server action `computeWithCustomScenario` avec le BuildingFormData courant
   * et affiche le DPE/GES avant→après dans la synthèse.
   */
  onComputeEnergyImpact?: (scenario: CustomScenario) => Promise<{
    ok: boolean;
    dpeAfter?: string;
    gesAfter?: string;
    cepKwhM2YrAfter?: number;
    cepKwhM2YrBefore?: number;
    error?: string;
  }>;
}

const POSTES: ReadonlyArray<InsulationChoice["poste"]> = [
  "MURS_ITE",
  "MURS_ITI",
  "COMBLES_PERDUS",
  "COMBLES_AMENAGES",
  "TOITURE",
  "PLANCHER_BAS",
];

const ORIGIN_BADGE: Record<
  InsulationMaterialSpec["origin"],
  { label: string; color: string; Icon: typeof Leaf }
> = {
  BIOSOURCE: { label: "Biosourcé", color: "bg-forest-100 text-forest-800", Icon: Leaf },
  MINERAL: { label: "Minéral", color: "bg-stone-100 text-stone-800", Icon: Snowflake },
  SYNTHETIQUE: {
    label: "Synthétique",
    color: "bg-amber-100 text-amber-800",
    Icon: Sparkles,
  },
};

// ────────────────────────────────────────────────────────────────────────────

export function ScenarioBuilder({
  target,
  mprBand,
  defaultSurfaces = {},
  onChange,
  onComputeEnergyImpact,
}: Props) {
  // ─── État du scénario personnalisé ───
  const [insulationByPoste, setInsulationByPoste] = useState<
    Partial<Record<InsulationChoice["poste"], InsulationChoice>>
  >({});
  const [heatingKind, setHeatingKind] = useState<HeatingSystemKind | undefined>();
  const [dhwKind, setDhwKind] = useState<DhwSystemKind | undefined>();
  const [dhwVolume, setDhwVolume] = useState<number | undefined>();
  const [ventilationKind, setVentilationKind] = useState<VentilationKind | undefined>();
  const [openPoste, setOpenPoste] = useState<string | null>(null);

  // ─── Construction du scénario + calcul breakdown ───
  const { scenario, breakdown } = useMemo(() => {
    const insulationArr = Object.values(insulationByPoste).filter(
      Boolean,
    ) as InsulationChoice[];
    const s: CustomScenario = {
      id: "custom-scenario",
      name: "Scénario personnalisé",
      target,
      insulation: insulationArr,
      heating: heatingKind ? { kind: heatingKind, coverage_share: 1 } : undefined,
      dhw: dhwKind ? { kind: dhwKind, volume_L: dhwVolume } : undefined,
      ventilation: ventilationKind ? { kind: ventilationKind } : undefined,
      mprIncomeBand: mprBand,
    };
    const b = computeScenarioBreakdown(s);
    return { scenario: s, breakdown: b };
  }, [
    insulationByPoste,
    heatingKind,
    dhwKind,
    dhwVolume,
    ventilationKind,
    target,
    mprBand,
  ]);

  // Effet onChange — sans useEffect car peut causer re-render loop : on délègue
  // au parent en lui passant directement les calculs déjà memoizés via callback
  // appelé seulement quand le scénario change.
  useMemoChange(scenario, breakdown, onChange);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-forest-200 bg-forest-50/30 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-700 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-base font-semibold text-forest-900">
              Mode expert — composez votre scénario
            </p>
            <p className="mt-1 text-sm text-stone-700">
              Choisissez les matériaux et systèmes poste par poste. Toutes les
              caractéristiques sont visibles : λ (conductivité), R (résistance),
              COP, η, coût €/m², aides éligibles. Cible :{" "}
              <strong>{SCENARIO_TARGET_LABELS_FR[target]}</strong>.
            </p>
          </div>
        </div>
      </header>

      {/* ─────────────── ISOLATION ─────────────── */}
      <section>
        <h3 className="font-serif text-lg font-bold text-forest-900">
          Isolation
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          Cliquez sur un poste pour choisir le matériau et l'épaisseur.
        </p>
        <div className="mt-3 space-y-2">
          {POSTES.map((poste) => {
            const sel = insulationByPoste[poste];
            const isOpen = openPoste === poste;
            return (
              <div
                key={poste}
                className="rounded-lg border border-cream-300 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenPoste(isOpen ? null : poste)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-forest-900">
                      {POSTE_LABELS_FR[poste]}
                    </span>
                    {sel && (
                      <SmallBadge color="bg-forest-100 text-forest-800">
                        {INSULATION_CATALOG[sel.material].labelFr} ·{" "}
                        {sel.thickness_cm} cm
                      </SmallBadge>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-stone-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-stone-500" />
                  )}
                </button>
                {isOpen && (
                  <InsulationPicker
                    poste={poste}
                    target={target}
                    mprBand={mprBand}
                    surface_m2={
                      sel?.surface_m2 ?? defaultSurfaces[poste] ?? 100
                    }
                    selected={sel}
                    onSelect={(choice) =>
                      setInsulationByPoste((prev) => ({
                        ...prev,
                        [poste]: choice,
                      }))
                    }
                    onClear={() =>
                      setInsulationByPoste((prev) => {
                        const { [poste]: _removed, ...rest } = prev;
                        return rest;
                      })
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────── CHAUFFAGE ─────────────── */}
      <section>
        <h3 className="font-serif text-lg font-bold text-forest-900">
          Chauffage
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          Comparez les systèmes selon leur COP / rendement, coût d'installation
          et d'exploitation.
        </p>
        <HeatingPicker
          target={target}
          mprBand={mprBand}
          selected={heatingKind}
          onSelect={setHeatingKind}
          onClear={() => setHeatingKind(undefined)}
        />
      </section>

      {/* ─────────────── ECS ─────────────── */}
      <section>
        <h3 className="font-serif text-lg font-bold text-forest-900">
          Eau chaude sanitaire (ECS)
        </h3>
        <DhwPicker
          target={target}
          mprBand={mprBand}
          selected={dhwKind}
          volume={dhwVolume}
          onSelect={(k, vol) => {
            setDhwKind(k);
            setDhwVolume(vol);
          }}
          onClear={() => {
            setDhwKind(undefined);
            setDhwVolume(undefined);
          }}
        />
      </section>

      {/* ─────────────── VENTILATION ─────────────── */}
      <section>
        <h3 className="font-serif text-lg font-bold text-forest-900">
          Ventilation
        </h3>
        <VentilationPicker
          target={target}
          mprBand={mprBand}
          selected={ventilationKind}
          onSelect={setVentilationKind}
          onClear={() => setVentilationKind(undefined)}
        />
      </section>

      {/* ─────────────── SYNTHÈSE ─────────────── */}
      <SyntheseScenario
        breakdown={breakdown}
        scenario={scenario}
        onComputeEnergyImpact={onComputeEnergyImpact}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-PICKERS
// ════════════════════════════════════════════════════════════════════════════

function InsulationPicker({
  poste,
  target,
  mprBand: _mprBand,
  surface_m2,
  selected,
  onSelect,
  onClear,
}: {
  poste: InsulationChoice["poste"];
  target: ScenarioTarget;
  mprBand?: "BLEU" | "JAUNE" | "VIOLET" | "ROSE";
  surface_m2: number;
  selected?: InsulationChoice;
  onSelect: (c: InsulationChoice) => void;
  onClear: () => void;
}) {
  const [surface, setSurface] = useState(surface_m2);
  const [thicknessCm, setThicknessCm] = useState(selected?.thickness_cm ?? 14);

  // Filtrer matériaux applicables au poste
  const eligible = Object.values(INSULATION_CATALOG).filter((m) => {
    if (m.key === "INCONNU" || m.key === "AUTRE") return false;
    if (poste === "MURS_ITE" || poste === "MURS_ITI")
      return m.applications.includes("MUR_ITE") || m.applications.includes("MUR_ITI");
    if (poste === "COMBLES_PERDUS")
      return m.applications.includes("COMBLES_PERDUS");
    if (poste === "COMBLES_AMENAGES" || poste === "TOITURE")
      return (
        m.applications.includes("COMBLES_AMENAGES") ||
        m.applications.includes("TOITURE_RAMPANT") ||
        m.applications.includes("TOITURE_TERRASSE")
      );
    if (poste === "PLANCHER_BAS")
      return m.applications.includes("PLANCHER_BAS");
    return true;
  });

  return (
    <div className="border-t border-cream-200 px-4 py-3">
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-stone-700">
          Surface (m²)
          <input
            type="number"
            value={surface}
            min={1}
            step={1}
            onChange={(e) => setSurface(Number(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border border-cream-300 px-2 py-1.5 text-sm focus:border-forest-500 focus:outline-none"
          />
        </label>
        <label className="text-xs font-medium text-stone-700">
          Épaisseur (cm)
          <input
            type="number"
            value={thicknessCm}
            min={3}
            max={50}
            step={1}
            onChange={(e) => setThicknessCm(Number(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border border-cream-300 px-2 py-1.5 text-sm focus:border-forest-500 focus:outline-none"
          />
        </label>
        {selected && (
          <button
            type="button"
            onClick={onClear}
            className="self-end rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Désélectionner
          </button>
        )}
      </div>

      <div className="space-y-2">
        {eligible.map((m) => {
          const R = (thicknessCm / 100) / m.lambda_W_mK;
          const c10 = (m.costPerM2_HT_per10cm.min + m.costPerM2_HT_per10cm.max) / 2;
          const costPerM2 = (c10 / 10) * thicknessCm;
          const totalHT = costPerM2 * surface;
          const isSelected = selected?.material === m.key;
          const badge = ORIGIN_BADGE[m.origin];

          return (
            <button
              key={m.key}
              type="button"
              onClick={() =>
                onSelect({
                  poste,
                  material: m.key as InsulationMaterialKind,
                  thickness_cm: thicknessCm,
                  surface_m2: surface,
                })
              }
              className={[
                "w-full rounded-lg border p-3 text-left transition-colors",
                isSelected
                  ? "border-forest-500 bg-forest-50/60 ring-2 ring-forest-200"
                  : "border-cream-200 bg-white hover:border-forest-300",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-forest-900">
                      {m.labelFr}
                    </span>
                    <SmallBadge color={badge.color}>
                      <badge.Icon className="mr-1 h-3 w-3" />
                      {badge.label}
                    </SmallBadge>
                    {m.mprBiosourceEligible && (
                      <SmallBadge color="bg-emerald-100 text-emerald-800">
                        <Leaf className="mr-1 h-3 w-3" />
                        Bonus MPR biosourcé
                      </SmallBadge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-stone-600">{m.notesFr}</p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-forest-600" />
                )}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-4">
                <SpecCell label="λ (W/m·K)" value={fmtNum(m.lambda_W_mK, 3)} />
                <SpecCell
                  label={`R à ${thicknessCm} cm`}
                  value={`${fmtNum(R, 2)} m²·K/W`}
                  highlight={R >= 3.7}
                />
                <SpecCell label="Coût HT €/m²" value={fmtEur.format(costPerM2)} />
                <SpecCell label="Total HT" value={fmtEur.format(totalHT)} />
              </dl>
              <p className="mt-2 text-[11px] text-stone-500">
                Cible {SCENARIO_TARGET_LABELS_FR[target]} — voir aides
                applicables ci-dessous une fois sélectionné.
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function HeatingPicker({
  target,
  mprBand: _mprBand,
  selected,
  onSelect,
  onClear,
}: {
  target: ScenarioTarget;
  mprBand?: "BLEU" | "JAUNE" | "VIOLET" | "ROSE";
  selected?: HeatingSystemKind;
  onSelect: (k: HeatingSystemKind) => void;
  onClear: () => void;
}) {
  const list = Object.values(HEATING_CATALOG).filter((s) =>
    s.worksForSegments.includes(target),
  );

  return (
    <div className="mt-3 space-y-2">
      {selected && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          Désélectionner le chauffage
        </button>
      )}
      {list.map((s) => {
        const isSelected = selected === s.key;
        const costAvg = (s.costInstall_HT.min + s.costInstall_HT.max) / 2;
        const isBest = s.bestForSegments.includes(target);
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onSelect(s.key)}
            className={[
              "w-full rounded-lg border p-3 text-left transition-colors",
              isSelected
                ? "border-forest-500 bg-forest-50/60 ring-2 ring-forest-200"
                : "border-cream-200 bg-white hover:border-forest-300",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Flame className="h-4 w-4 text-terracotta-600" />
                  <span className="font-semibold text-forest-900">
                    {s.labelFr}
                  </span>
                  {isBest && (
                    <SmallBadge color="bg-forest-100 text-forest-800">
                      Recommandé pour {SCENARIO_TARGET_LABELS_FR[target]}
                    </SmallBadge>
                  )}
                  {s.mprEligible && (
                    <SmallBadge color="bg-emerald-100 text-emerald-800">
                      <Coins className="mr-1 h-3 w-3" />
                      MPR
                    </SmallBadge>
                  )}
                  {s.ceeCoupDePouceEligible && (
                    <SmallBadge color="bg-amber-100 text-amber-800">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Coup de pouce CEE
                    </SmallBadge>
                  )}
                </div>
                <p className="mt-1 text-xs text-stone-600">{s.notesFr}</p>
              </div>
              {isSelected && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-forest-600" />
              )}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-4">
              <SpecCell
                label={s.efficiencyKind === "COP" ? "COP" : "η (rendement)"}
                value={fmtNum(s.efficiencyOrCOP, 2)}
                highlight={s.efficiencyKind === "COP" && s.efficiencyOrCOP >= 3.5}
              />
              <SpecCell
                label="Coût install HT"
                value={`${fmtEur.format(s.costInstall_HT.min)} – ${fmtEur.format(s.costInstall_HT.max)}`}
              />
              <SpecCell
                label="€ / kWh énergie"
                value={`${fmtNum(s.energyCostPerKWh_eur, 3)} €`}
              />
              <SpecCell
                label="€ / kWh utile"
                value={`${fmtNum(s.energyCostPerKWh_eur / s.efficiencyOrCOP, 3)} €`}
                highlight
              />
              <SpecCell
                label="Durée de vie"
                value={`${s.lifetimeYears} ans`}
              />
              <SpecCell
                label="CO₂ / kWh utile"
                value={`${s.co2_gCO2eq_per_kWhUseful} g`}
              />
              <SpecCell
                label="Coût install moyen"
                value={fmtEur.format(costAvg)}
              />
              <SpecCell label="Énergie" value={s.energyCategory} />
            </dl>
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function DhwPicker({
  target,
  mprBand: _mprBand,
  selected,
  volume,
  onSelect,
  onClear,
}: {
  target: ScenarioTarget;
  mprBand?: "BLEU" | "JAUNE" | "VIOLET" | "ROSE";
  selected?: DhwSystemKind;
  volume?: number;
  onSelect: (k: DhwSystemKind, vol?: number) => void;
  onClear: () => void;
}) {
  const list = Object.values(DHW_CATALOG).filter((s) =>
    s.worksForSegments.includes(target),
  );

  return (
    <div className="mt-3 space-y-2">
      {selected && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          Désélectionner l'ECS
        </button>
      )}
      {list.map((s) => {
        const isSelected = selected === s.key;
        const costAvg = (s.costInstall_HT.min + s.costInstall_HT.max) / 2;
        const isBest = s.bestForSegments.includes(target);
        return (
          <div
            key={s.key}
            className={[
              "rounded-lg border p-3 transition-colors",
              isSelected
                ? "border-forest-500 bg-forest-50/60 ring-2 ring-forest-200"
                : "border-cream-200 bg-white",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={() => onSelect(s.key, volume ?? s.volumesAvailable_L[0])}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Droplets className="h-4 w-4 text-night-600" />
                    <span className="font-semibold text-forest-900">
                      {s.labelFr}
                    </span>
                    {isBest && (
                      <SmallBadge color="bg-forest-100 text-forest-800">
                        Recommandé
                      </SmallBadge>
                    )}
                    {s.mprEligible && (
                      <SmallBadge color="bg-emerald-100 text-emerald-800">
                        MPR
                      </SmallBadge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-stone-600">{s.notesFr}</p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-forest-600" />
                )}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-4">
                <SpecCell
                  label={s.efficiencyKind === "COP" ? "COP" : "η"}
                  value={fmtNum(s.efficiencyOrCOP, 2)}
                />
                <SpecCell
                  label="Coût install"
                  value={`${fmtEur.format(s.costInstall_HT.min)} – ${fmtEur.format(s.costInstall_HT.max)}`}
                />
                <SpecCell label="Durée vie" value={`${s.lifetimeYears} ans`} />
                <SpecCell label="Moyenne" value={fmtEur.format(costAvg)} />
              </dl>
            </button>

            {isSelected && s.volumesAvailable_L.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-forest-200 pt-3">
                <span className="text-xs font-semibold text-forest-900">
                  Volume (L) :
                </span>
                {s.volumesAvailable_L.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onSelect(s.key, v)}
                    className={[
                      "rounded-md px-2.5 py-1 text-xs font-semibold",
                      volume === v
                        ? "bg-forest-700 text-white"
                        : "border border-forest-300 text-forest-700 hover:bg-forest-50",
                    ].join(" ")}
                  >
                    {v} L
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function VentilationPicker({
  target,
  mprBand: _mprBand,
  selected,
  onSelect,
  onClear,
}: {
  target: ScenarioTarget;
  mprBand?: "BLEU" | "JAUNE" | "VIOLET" | "ROSE";
  selected?: VentilationKind;
  onSelect: (k: VentilationKind) => void;
  onClear: () => void;
}) {
  const list = Object.values(VENTILATION_CATALOG).filter(
    (s) => s.key !== "ABSENTE" && s.worksForSegments.includes(target),
  );

  return (
    <div className="mt-3 space-y-2">
      {selected && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          Désélectionner la ventilation
        </button>
      )}
      {list.map((s) => {
        const isSelected = selected === s.key;
        const costAvg = (s.costInstall_HT.min + s.costInstall_HT.max) / 2;
        const isBest = s.bestForSegments.includes(target);
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onSelect(s.key)}
            className={[
              "w-full rounded-lg border p-3 text-left transition-colors",
              isSelected
                ? "border-forest-500 bg-forest-50/60 ring-2 ring-forest-200"
                : "border-cream-200 bg-white hover:border-forest-300",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Wind className="h-4 w-4 text-night-600" />
                  <span className="font-semibold text-forest-900">
                    {s.labelFr}
                  </span>
                  {isBest && (
                    <SmallBadge color="bg-forest-100 text-forest-800">
                      Recommandé
                    </SmallBadge>
                  )}
                  {s.mprEligible && (
                    <SmallBadge color="bg-emerald-100 text-emerald-800">
                      MPR
                    </SmallBadge>
                  )}
                </div>
                <p className="mt-1 text-xs text-stone-600">{s.notesFr}</p>
              </div>
              {isSelected && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-forest-600" />
              )}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-4">
              <SpecCell
                label="Récup chaleur"
                value={`${Math.round(s.heatRecoveryEff * 100)} %`}
                highlight={s.heatRecoveryEff >= 0.8}
              />
              <SpecCell
                label="Coût install"
                value={`${fmtEur.format(s.costInstall_HT.min)} – ${fmtEur.format(s.costInstall_HT.max)}`}
              />
              <SpecCell
                label="Conso élec"
                value={`${fmtNum(s.elecConsumption_kWh_m2_year, 1)} kWh/m²·an`}
              />
              <SpecCell label="Moyenne" value={fmtEur.format(costAvg)} />
            </dl>
          </button>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SYNTHÈSE
// ════════════════════════════════════════════════════════════════════════════

function SyntheseScenario({
  breakdown,
  scenario,
  onComputeEnergyImpact,
}: {
  breakdown: ScenarioBreakdown;
  scenario: CustomScenario;
  onComputeEnergyImpact?: Props["onComputeEnergyImpact"];
}) {
  const [computing, setComputing] = useState(false);
  const [energyResult, setEnergyResult] = useState<{
    dpeAfter?: string;
    gesAfter?: string;
    cepKwhM2YrAfter?: number;
    cepKwhM2YrBefore?: number;
    error?: string;
  } | null>(null);

  const runEnergyCalc = async () => {
    if (!onComputeEnergyImpact) return;
    setComputing(true);
    setEnergyResult(null);
    try {
      const res = await onComputeEnergyImpact(scenario);
      setEnergyResult({
        dpeAfter: res.dpeAfter,
        gesAfter: res.gesAfter,
        cepKwhM2YrAfter: res.cepKwhM2YrAfter,
        cepKwhM2YrBefore: res.cepKwhM2YrBefore,
        error: res.ok ? undefined : res.error,
      });
    } catch (e) {
      setEnergyResult({
        error: e instanceof Error ? e.message : "Erreur inconnue",
      });
    } finally {
      setComputing(false);
    }
  };
  // Agrégation des subventions par type (court label).
  const grantsByLabel = new Map<string, number>();
  for (const g of breakdown.grants) {
    grantsByLabel.set(
      g.aid.shortFr,
      (grantsByLabel.get(g.aid.shortFr) ?? 0) + g.amount_eur,
    );
  }
  const loansByLabel = new Map<string, number>();
  for (const l of breakdown.loans) {
    loansByLabel.set(
      l.aid.shortFr,
      Math.max(loansByLabel.get(l.aid.shortFr) ?? 0, l.amount_eur),
    );
  }

  if (
    breakdown.insulation.length === 0 &&
    !breakdown.heating &&
    !breakdown.dhw &&
    !breakdown.ventilation
  ) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-600">
        Sélectionnez au moins un poste pour voir la synthèse coût + aides.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-forest-300 bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg font-bold text-forest-900">
        Synthèse du scénario
      </h3>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi
          label="Coût travaux HT"
          value={fmtEur.format(breakdown.totalCostHT_eur)}
          color="text-stone-900"
        />
        <Kpi
          label="Subventions"
          value={`−${fmtEur.format(breakdown.totalGrants_eur)}`}
          color="text-forest-700"
        />
        <Kpi
          label="Reste à charge HT"
          value={fmtEur.format(breakdown.restAChargeHT_eur)}
          color="text-night-700"
        />
        <Kpi
          label="Après Éco-PTZ"
          value={fmtEur.format(breakdown.restAChargeAfterLoan_eur)}
          color="text-night-700"
        />
      </dl>

      {breakdown.tvaReduction_eur > 0 && (
        <p className="mt-3 text-xs text-stone-600">
          + économie TVA 5,5 % vs 20 % :{" "}
          <strong className="text-forest-700">
            {fmtEur.format(breakdown.tvaReduction_eur)}
          </strong>{" "}
          déjà incluse dans le coût HT affiché — facture finale TTC réduite
          d'autant.
        </p>
      )}

      {grantsByLabel.size > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-forest-900">
            Subventions directes (versées, non remboursables)
          </p>
          <ul className="mt-2 space-y-1">
            {Array.from(grantsByLabel.entries()).map(([name, amount]) => (
              <li
                key={name}
                className="flex items-center justify-between rounded-md border border-forest-200 bg-forest-50 px-3 py-2 text-sm"
              >
                <span className="text-forest-900">
                  <ShieldCheck className="mr-2 inline h-3.5 w-3.5 text-forest-600" />
                  {name}
                </span>
                <span className="font-semibold text-forest-700">
                  {fmtEur.format(amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loansByLabel.size > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-night-900">
            Prêts mobilisables (à rembourser, taux préférentiel)
          </p>
          <ul className="mt-2 space-y-1">
            {Array.from(loansByLabel.entries()).map(([name, amount]) => (
              <li
                key={name}
                className="flex items-center justify-between rounded-md border border-night-200 bg-cream-50 px-3 py-2 text-sm"
              >
                <span className="text-night-900">
                  <Coins className="mr-2 inline h-3.5 w-3.5 text-night-600" />
                  {name} (plafond)
                </span>
                <span className="font-semibold text-night-700">
                  {fmtEur.format(amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[11px] text-stone-500">
        Subventions et prêts traités séparément. Les MaPrimeRénov' par geste et
        Parcours Accompagné ne sont pas cumulables — la simulation conserve la
        branche la plus favorable. Estimations indicatives basées sur les
        barèmes 2025.
      </p>

      {breakdown.insulation.some((i) => !i.meetsRecommendation) && (
        <div className="mt-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="mr-2 inline h-3.5 w-3.5" />
          Certains postes d'isolation n'atteignent pas le R cible recommandé.
          Considérez d'augmenter l'épaisseur pour maximiser performance et
          aides.
        </div>
      )}

      {onComputeEnergyImpact && (
        <div className="mt-5 border-t border-cream-200 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-forest-900">
                Gain énergétique
              </p>
              <p className="text-xs text-stone-600">
                Calcul DPE / GES / consommation après travaux via le moteur
                officiel.
              </p>
            </div>
            <button
              type="button"
              onClick={runEnergyCalc}
              disabled={computing}
              className="rounded-md bg-forest-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-forest-800 disabled:bg-stone-300"
            >
              {computing ? "Calcul…" : "Calculer le DPE après travaux"}
            </button>
          </div>

          {energyResult && !energyResult.error && (
            <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Kpi
                label="DPE après travaux"
                value={energyResult.dpeAfter ?? "—"}
                color="text-forest-700"
              />
              <Kpi
                label="GES après travaux"
                value={energyResult.gesAfter ?? "—"}
                color="text-forest-700"
              />
              <Kpi
                label="Cep (kWh/m²·an)"
                value={
                  energyResult.cepKwhM2YrAfter !== undefined
                    ? `${Math.round(energyResult.cepKwhM2YrAfter)}${
                        energyResult.cepKwhM2YrBefore !== undefined
                          ? ` (avant ${Math.round(energyResult.cepKwhM2YrBefore)})`
                          : ""
                      }`
                    : "—"
                }
                color="text-night-700"
              />
            </dl>
          )}

          {energyResult?.error && (
            <p className="mt-2 text-xs text-red-700">
              <AlertTriangle className="mr-1 inline h-3 w-3" />
              {energyResult.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS UI
// ════════════════════════════════════════════════════════════════════════════

function SmallBadge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}
    >
      {children}
    </span>
  );
}

function SpecCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-stone-500">
        {label}
      </dt>
      <dd
        className={[
          "tabular-nums font-semibold",
          highlight ? "text-forest-700" : "text-stone-900",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-cream-200 bg-cream-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-600">
        {label}
      </p>
      <p className={`mt-1 font-serif text-2xl font-bold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Hook utilitaire : déclenche onChange seulement quand le scénario change.
// ────────────────────────────────────────────────────────────────────────────

function useMemoChange(
  scenario: CustomScenario,
  breakdown: ScenarioBreakdown,
  onChange?: (s: CustomScenario, b: ScenarioBreakdown) => void,
) {
  // Référence sérialisée pour comparer
  const key = JSON.stringify({
    ins: scenario.insulation,
    h: scenario.heating,
    d: scenario.dhw,
    v: scenario.ventilation,
    t: scenario.target,
    b: scenario.mprIncomeBand,
  });
  // Stockage de la dernière clé envoyée
  const lastKeyRef = useLastValueRef(key);
  if (onChange && lastKeyRef.current !== key) {
    lastKeyRef.current = key;
    onChange(scenario, breakdown);
  }
}

function useLastValueRef<T>(value: T): { current: T } {
  // Simple stable ref — initialized once
  const ref = useMemo<{ current: T }>(() => ({ current: value }), []);
  return ref;
}
