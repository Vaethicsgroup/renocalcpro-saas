// src/lib/calc/scenarios/custom-scenario.ts
// ════════════════════════════════════════════════════════════════════════════
// Type CustomScenario : description fine d'un scénario de rénovation où
// l'utilisateur choisit pour chaque poste (mur, toit, plancher, fenêtres,
// chauffage, ECS, ventilation) le matériau/système et son dimensionnement,
// avec calcul à la volée de R, U, coût HT, aides éligibles.
//
// Ne touche pas au moteur calc existant — c'est un wrapper consommateur qui
// délègue à `applyWorksToBuilding` + `computeFromForm` quand il faut produire
// les indicateurs énergétiques finaux.
// ════════════════════════════════════════════════════════════════════════════

import type {
  InsulationMaterialKind,
} from "../form/schema";
import type {
  SystemEnergyCategory,
  SystemTargetSegment,
} from "../catalog/heating-systems";
import type {
  DhwSystemKind,
  HeatingSystemKind,
  VentilationKind,
  WorkKind,
} from "../types";
import {
  INSULATION_CATALOG,
  rForThicknessCm,
  costPerM2HtForThickness,
  R_RECOMMENDED_BY_APPLICATION,
  type InsulationApplication,
} from "../catalog/insulation-materials";
import { HEATING_CATALOG } from "../catalog/heating-systems";
import { DHW_CATALOG, VENTILATION_CATALOG } from "../catalog/dhw-and-ventilation";
import { AIDS_CATALOG, estimateAidAmount, type AidSpec } from "../catalog/aids-catalog";

// ────────────────────────────────────────────────────────────────────────────
// CIBLE DU SCÉNARIO (alias confort)
// ────────────────────────────────────────────────────────────────────────────

export type ScenarioTarget = SystemTargetSegment;

export const SCENARIO_TARGET_LABELS_FR: Record<ScenarioTarget, string> = {
  MAISON_INDIV: "Maison individuelle",
  APPARTEMENT: "Appartement",
  COPRO_PARTIES_COMMUNES: "Copropriété (parties communes)",
  HLM: "Logement social (HLM)",
  TERTIAIRE_BUREAU: "Bureaux tertiaires",
  TERTIAIRE_COMMERCE: "Commerce",
  BATIMENT_PUBLIC: "Bâtiment public",
};

// ────────────────────────────────────────────────────────────────────────────
// POSTES D'UN SCÉNARIO
// ────────────────────────────────────────────────────────────────────────────

export interface InsulationChoice {
  /** Type de paroi. */
  poste: "MURS_ITE" | "MURS_ITI" | "COMBLES_PERDUS" | "COMBLES_AMENAGES" | "TOITURE" | "PLANCHER_BAS";
  /** Matériau choisi. */
  material: InsulationMaterialKind;
  /** Épaisseur posée (cm). */
  thickness_cm: number;
  /** Surface concernée (m²). */
  surface_m2: number;
}

export interface HeatingChoice {
  kind: HeatingSystemKind;
  /** Taux de couverture des besoins (0..1). 1 = solution principale. */
  coverage_share?: number;
}

export interface DhwChoice {
  kind: DhwSystemKind;
  volume_L?: number;
}

export interface VentilationChoice {
  kind: VentilationKind;
}

export interface CustomScenario {
  id: string;
  name: string;
  target: ScenarioTarget;
  insulation: ReadonlyArray<InsulationChoice>;
  heating?: HeatingChoice;
  dhw?: DhwChoice;
  ventilation?: VentilationChoice;
  /** Bande de revenu de l'occupant pour estimation MPR. */
  mprIncomeBand?: "BLEU" | "JAUNE" | "VIOLET" | "ROSE";
}

// ────────────────────────────────────────────────────────────────────────────
// MAPPING POSTE → WorkKind moteur
// ────────────────────────────────────────────────────────────────────────────

export const POSTE_TO_WORKKIND: Record<InsulationChoice["poste"], WorkKind> = {
  MURS_ITE: "ISO_MURS_ITE",
  MURS_ITI: "ISO_MURS_ITI",
  COMBLES_PERDUS: "ISO_COMBLES_PERDUS",
  COMBLES_AMENAGES: "ISO_COMBLES_AMENAGES",
  TOITURE: "ISO_TOITURE",
  PLANCHER_BAS: "ISO_PLANCHER_BAS",
};

export const POSTE_TO_INSULATION_APPLICATION: Record<
  InsulationChoice["poste"],
  InsulationApplication
> = {
  MURS_ITE: "MUR_ITE",
  MURS_ITI: "MUR_ITI",
  COMBLES_PERDUS: "COMBLES_PERDUS",
  COMBLES_AMENAGES: "COMBLES_AMENAGES",
  TOITURE: "TOITURE_TERRASSE",
  PLANCHER_BAS: "PLANCHER_BAS",
};

// ────────────────────────────────────────────────────────────────────────────
// CALCULS PAR POSTE
// ────────────────────────────────────────────────────────────────────────────

export interface InsulationItemBreakdown {
  poste: InsulationChoice["poste"];
  posteLabelFr: string;
  material: InsulationMaterialKind;
  materialLabelFr: string;
  origin: "BIOSOURCE" | "MINERAL" | "SYNTHETIQUE";
  thickness_cm: number;
  surface_m2: number;
  lambda_W_mK: number;
  R_m2K_W: number;
  R_recommended_min: number;
  R_recommended_target: number;
  R_recommended_bbc: number;
  meetsRecommendation: boolean;
  costHTPerM2: number;
  costHTTotal: number;
  applicableWork: WorkKind;
  applicableAids: ReadonlyArray<{ aid: AidSpec; estimatedAmount_eur: number }>;
}

export function computeInsulationBreakdown(
  choice: InsulationChoice,
  target: ScenarioTarget,
  mprIncomeBand?: "BLEU" | "JAUNE" | "VIOLET" | "ROSE",
): InsulationItemBreakdown {
  const mat = INSULATION_CATALOG[choice.material];
  const R = rForThicknessCm(mat.lambda_W_mK, choice.thickness_cm);
  const costPerM2 = costPerM2HtForThickness(mat, choice.thickness_cm);
  const application = POSTE_TO_INSULATION_APPLICATION[choice.poste];
  const recs = R_RECOMMENDED_BY_APPLICATION[application];
  const work = POSTE_TO_WORKKIND[choice.poste];

  const applicableAids = AIDS_CATALOG.filter(
    (a) =>
      a.status === "ACTIVE" &&
      a.worksEligible.includes(work) &&
      a.targetsEligible.includes(target),
  ).map((aid) => ({
    aid,
    estimatedAmount_eur: estimateAidAmount(aid, {
      band: mprIncomeBand,
      surface_m2: choice.surface_m2,
      costHT_eur: costPerM2 * choice.surface_m2,
    }).amount_eur,
  }));

  return {
    poste: choice.poste,
    posteLabelFr: POSTE_LABELS_FR[choice.poste],
    material: choice.material,
    materialLabelFr: mat.labelFr,
    origin: mat.origin,
    thickness_cm: choice.thickness_cm,
    surface_m2: choice.surface_m2,
    lambda_W_mK: mat.lambda_W_mK,
    R_m2K_W: R,
    R_recommended_min: recs.min,
    R_recommended_target: recs.cible,
    R_recommended_bbc: recs.bbc,
    meetsRecommendation: R >= recs.cible,
    costHTPerM2: costPerM2,
    costHTTotal: costPerM2 * choice.surface_m2,
    applicableWork: work,
    applicableAids,
  };
}

export const POSTE_LABELS_FR: Record<InsulationChoice["poste"], string> = {
  MURS_ITE: "Murs — Isolation par l'extérieur (ITE)",
  MURS_ITI: "Murs — Isolation par l'intérieur (ITI)",
  COMBLES_PERDUS: "Combles perdus",
  COMBLES_AMENAGES: "Combles aménagés / rampants",
  TOITURE: "Toiture / terrasse",
  PLANCHER_BAS: "Plancher bas",
};

// ────────────────────────────────────────────────────────────────────────────
// CALCULS CHAUFFAGE
// ────────────────────────────────────────────────────────────────────────────

export interface HeatingBreakdown {
  kind: HeatingSystemKind;
  labelFr: string;
  efficiencyKind: "COP" | "ETA";
  efficiencyOrCOP: number;
  energyCategory: SystemEnergyCategory;
  costInstall_HT_min: number;
  costInstall_HT_max: number;
  lifetimeYears: number;
  energyCostPerKWh_eur: number;
  co2_gCO2eq_per_kWhUseful: number;
  /** Surcoût / sous-coût € /kWh utile par rapport à PAC air/eau de référence. */
  energyCostPerKWhUseful_eur: number;
  isRecommendedForTarget: boolean;
  applicableAids: ReadonlyArray<{ aid: AidSpec; estimatedAmount_eur: number }>;
}

export function computeHeatingBreakdown(
  choice: HeatingChoice,
  target: ScenarioTarget,
  mprIncomeBand?: "BLEU" | "JAUNE" | "VIOLET" | "ROSE",
): HeatingBreakdown {
  const sys = HEATING_CATALOG[choice.kind];
  const costAvg =
    (sys.costInstall_HT.min + sys.costInstall_HT.max) / 2;
  // Coût € par kWh utile = (coût énergie / efficacité)
  const energyCostPerKWhUseful_eur =
    sys.energyCostPerKWh_eur / sys.efficiencyOrCOP;

  // WorkKind mapping pour aides
  const workMapping: Partial<Record<HeatingSystemKind, WorkKind>> = {
    PAC_AIR_EAU: "PAC_AIR_EAU",
    PAC_AIR_AIR: "PAC_AIR_AIR",
    POELE_GRANUL: "POELE_GRANUL",
    CHAUDIERE_GAZ_COND: "REMPLACEMENT_CHAUDIERE_COND",
  };
  const work = workMapping[choice.kind];

  const applicableAids = work
    ? AIDS_CATALOG.filter(
        (a) =>
          a.status === "ACTIVE" &&
          a.worksEligible.includes(work) &&
          a.targetsEligible.includes(target),
      ).map((aid) => ({
        aid,
        estimatedAmount_eur: estimateAidAmount(aid, {
          band: mprIncomeBand,
          costHT_eur: costAvg,
        }).amount_eur,
      }))
    : [];

  return {
    kind: choice.kind,
    labelFr: sys.labelFr,
    efficiencyKind: sys.efficiencyKind,
    efficiencyOrCOP: sys.efficiencyOrCOP,
    energyCategory: sys.energyCategory,
    costInstall_HT_min: sys.costInstall_HT.min,
    costInstall_HT_max: sys.costInstall_HT.max,
    lifetimeYears: sys.lifetimeYears,
    energyCostPerKWh_eur: sys.energyCostPerKWh_eur,
    co2_gCO2eq_per_kWhUseful: sys.co2_gCO2eq_per_kWhUseful,
    energyCostPerKWhUseful_eur,
    isRecommendedForTarget: sys.bestForSegments.includes(target),
    applicableAids,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// CALCULS ECS + VENTILATION
// ────────────────────────────────────────────────────────────────────────────

export interface DhwBreakdown {
  kind: DhwSystemKind;
  labelFr: string;
  efficiencyOrCOP: number;
  efficiencyKind: "COP" | "ETA";
  volume_L?: number;
  costInstall_HT_min: number;
  costInstall_HT_max: number;
  lifetimeYears: number;
  co2_gCO2eq_per_kWhUseful: number;
  isRecommendedForTarget: boolean;
  applicableAids: ReadonlyArray<{ aid: AidSpec; estimatedAmount_eur: number }>;
}

export function computeDhwBreakdown(
  choice: DhwChoice,
  target: ScenarioTarget,
  mprIncomeBand?: "BLEU" | "JAUNE" | "VIOLET" | "ROSE",
): DhwBreakdown {
  const sys = DHW_CATALOG[choice.kind];
  const costAvg = (sys.costInstall_HT.min + sys.costInstall_HT.max) / 2;
  const workMapping: Partial<Record<DhwSystemKind, WorkKind>> = {
    BALLON_THERMODYN: "CHAUFFE_EAU_THERMODYN",
    SOLAIRE_THERM_APPOINT: "SOLAIRE_THERMIQUE_ECS",
  };
  const work = workMapping[choice.kind];
  const applicableAids = work
    ? AIDS_CATALOG.filter(
        (a) =>
          a.status === "ACTIVE" &&
          a.worksEligible.includes(work) &&
          a.targetsEligible.includes(target),
      ).map((aid) => ({
        aid,
        estimatedAmount_eur: estimateAidAmount(aid, {
          band: mprIncomeBand,
          costHT_eur: costAvg,
        }).amount_eur,
      }))
    : [];

  return {
    kind: choice.kind,
    labelFr: sys.labelFr,
    efficiencyOrCOP: sys.efficiencyOrCOP,
    efficiencyKind: sys.efficiencyKind,
    volume_L: choice.volume_L,
    costInstall_HT_min: sys.costInstall_HT.min,
    costInstall_HT_max: sys.costInstall_HT.max,
    lifetimeYears: sys.lifetimeYears,
    co2_gCO2eq_per_kWhUseful: sys.co2_gCO2eq_per_kWhUseful,
    isRecommendedForTarget: sys.bestForSegments.includes(target),
    applicableAids,
  };
}

export interface VentilationBreakdown {
  kind: VentilationKind;
  labelFr: string;
  heatRecoveryEff: number;
  costInstall_HT_min: number;
  costInstall_HT_max: number;
  lifetimeYears: number;
  elecConsumption_kWh_m2_year: number;
  isRecommendedForTarget: boolean;
  applicableAids: ReadonlyArray<{ aid: AidSpec; estimatedAmount_eur: number }>;
}

export function computeVentilationBreakdown(
  choice: VentilationChoice,
  target: ScenarioTarget,
  mprIncomeBand?: "BLEU" | "JAUNE" | "VIOLET" | "ROSE",
): VentilationBreakdown {
  const sys = VENTILATION_CATALOG[choice.kind];
  const costAvg = (sys.costInstall_HT.min + sys.costInstall_HT.max) / 2;
  const work: WorkKind | undefined =
    choice.kind === "VMC_DF"
      ? "VMC_DF"
      : choice.kind === "VMC_SF_HYGRO_B"
        ? "VMC_HYGRO_B"
        : undefined;
  const applicableAids = work
    ? AIDS_CATALOG.filter(
        (a) =>
          a.status === "ACTIVE" &&
          a.worksEligible.includes(work) &&
          a.targetsEligible.includes(target),
      ).map((aid) => ({
        aid,
        estimatedAmount_eur: estimateAidAmount(aid, {
          band: mprIncomeBand,
          costHT_eur: costAvg,
        }).amount_eur,
      }))
    : [];

  return {
    kind: choice.kind,
    labelFr: sys.labelFr,
    heatRecoveryEff: sys.heatRecoveryEff,
    costInstall_HT_min: sys.costInstall_HT.min,
    costInstall_HT_max: sys.costInstall_HT.max,
    lifetimeYears: sys.lifetimeYears,
    elecConsumption_kWh_m2_year: sys.elecConsumption_kWh_m2_year,
    isRecommendedForTarget: sys.bestForSegments.includes(target),
    applicableAids,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// SYNTHÈSE COMPLÈTE D'UN SCÉNARIO
// ────────────────────────────────────────────────────────────────────────────

export interface AidLineItem {
  aid: AidSpec;
  /** Montant effectivement retenu (après plafond, écrêtement). */
  amount_eur: number;
  /** Référence du poste auquel l'aide est rattachée. */
  scope: string;
}

export interface ScenarioBreakdown {
  scenarioId: string;
  scenarioName: string;
  target: ScenarioTarget;
  insulation: ReadonlyArray<InsulationItemBreakdown>;
  heating?: HeatingBreakdown;
  dhw?: DhwBreakdown;
  ventilation?: VentilationBreakdown;
  /** Coût travaux total HT (€). */
  totalCostHT_eur: number;
  /**
   * Subventions directes (GRANT) sélectionnées après résolution des
   * exclusivités et écrêtement par coût de poste. Réduisent le RAC.
   */
  grants: ReadonlyArray<AidLineItem>;
  totalGrants_eur: number;
  /** Prêts mobilisables (LOAN) — Éco-PTZ, Éco-PLS. Plafond du prêt, pas un don. */
  loans: ReadonlyArray<AidLineItem>;
  totalLoansAvailable_eur: number;
  /** Économie TVA 5,5 % vs taux normal — déjà incluse dans le HT. */
  tvaReduction_eur: number;
  /** Reste à charge HT après subventions directes (avant prêt). */
  restAChargeHT_eur: number;
  /** Reste à charge HT après prêt mobilisable. */
  restAChargeAfterLoan_eur: number;
  /** Liste dédupliquée des aides éligibles (toutes natures, info). */
  uniqueAidsApplicable: ReadonlyArray<AidSpec>;
}

export function computeScenarioBreakdown(
  scenario: CustomScenario,
): ScenarioBreakdown {
  const insulation = scenario.insulation.map((c) =>
    computeInsulationBreakdown(c, scenario.target, scenario.mprIncomeBand),
  );
  const heating = scenario.heating
    ? computeHeatingBreakdown(
        scenario.heating,
        scenario.target,
        scenario.mprIncomeBand,
      )
    : undefined;
  const dhw = scenario.dhw
    ? computeDhwBreakdown(
        scenario.dhw,
        scenario.target,
        scenario.mprIncomeBand,
      )
    : undefined;
  const ventilation = scenario.ventilation
    ? computeVentilationBreakdown(
        scenario.ventilation,
        scenario.target,
        scenario.mprIncomeBand,
      )
    : undefined;

  const insulationCost = insulation.reduce((s, i) => s + i.costHTTotal, 0);
  const heatingCost = heating
    ? (heating.costInstall_HT_min + heating.costInstall_HT_max) / 2
    : 0;
  const dhwCost = dhw
    ? (dhw.costInstall_HT_min + dhw.costInstall_HT_max) / 2
    : 0;
  const ventilationCost = ventilation
    ? (ventilation.costInstall_HT_min + ventilation.costInstall_HT_max) / 2
    : 0;
  const totalCostHT_eur =
    insulationCost + heatingCost + dhwCost + ventilationCost;

  // ─── Collecte des candidats par poste avec coût associé ───
  type Candidate = AidLineItem & { posteCost: number };
  const candidates: Candidate[] = [];

  for (const i of insulation) {
    for (const a of i.applicableAids) {
      // Écrêtement par coût de poste : une aide n'excède jamais le coût HT
      // du poste auquel elle est rattachée.
      const capped = Math.min(a.estimatedAmount_eur, i.costHTTotal);
      candidates.push({
        aid: a.aid,
        amount_eur: capped,
        scope: i.posteLabelFr,
        posteCost: i.costHTTotal,
      });
    }
  }
  if (heating) {
    const cost = (heating.costInstall_HT_min + heating.costInstall_HT_max) / 2;
    for (const a of heating.applicableAids) {
      candidates.push({
        aid: a.aid,
        amount_eur: Math.min(a.estimatedAmount_eur, cost),
        scope: heating.labelFr,
        posteCost: cost,
      });
    }
  }
  if (dhw) {
    const cost = (dhw.costInstall_HT_min + dhw.costInstall_HT_max) / 2;
    for (const a of dhw.applicableAids) {
      candidates.push({
        aid: a.aid,
        amount_eur: Math.min(a.estimatedAmount_eur, cost),
        scope: dhw.labelFr,
        posteCost: cost,
      });
    }
  }
  if (ventilation) {
    const cost =
      (ventilation.costInstall_HT_min + ventilation.costInstall_HT_max) / 2;
    for (const a of ventilation.applicableAids) {
      candidates.push({
        aid: a.aid,
        amount_eur: Math.min(a.estimatedAmount_eur, cost),
        scope: ventilation.labelFr,
        posteCost: cost,
      });
    }
  }

  // ─── Résolution exclusivités MPR_FORFAIT vs MPR_ACCOMPAGNE vs MPR_COPRO ───
  // Stratégie : pour chaque groupe d'exclusivité on garde la branche au total
  // le plus favorable (le user n'opte qu'une fois).
  const sumByKey = (k: string) =>
    candidates
      .filter((c) => c.aid.key === k)
      .reduce((s, c) => s + c.amount_eur, 0);
  const mprForfaitTotal = sumByKey("MPR_FORFAIT");
  const mprAccompagneTotal = sumByKey("MPR_ACCOMPAGNE");
  const mprCoproTotal = sumByKey("MPR_COPRO");
  const winnerMpr =
    mprAccompagneTotal > mprForfaitTotal && mprAccompagneTotal > mprCoproTotal
      ? "MPR_ACCOMPAGNE"
      : mprCoproTotal > mprForfaitTotal
        ? "MPR_COPRO"
        : "MPR_FORFAIT";
  const excludedMpr: Array<string> = [
    "MPR_FORFAIT",
    "MPR_ACCOMPAGNE",
    "MPR_COPRO",
  ].filter((k) => k !== winnerMpr);

  // ─── Filtrage par nature + exclusivité ───
  const grants: AidLineItem[] = [];
  const loans: AidLineItem[] = [];
  let tvaReduction_eur = 0;

  for (const c of candidates) {
    if (excludedMpr.includes(c.aid.key)) continue;
    if (c.aid.nature === "TVA_REDUCTION") {
      // TVA 5,5 vs 20 : économie ≈ 14,5 % du coût de poste.
      tvaReduction_eur += 0.145 * c.posteCost;
    } else if (c.aid.nature === "LOAN") {
      loans.push({ aid: c.aid, amount_eur: c.aid.cap_eur ?? 0, scope: c.scope });
    } else if (c.aid.nature === "GRANT") {
      grants.push({ aid: c.aid, amount_eur: c.amount_eur, scope: c.scope });
    }
  }

  // Dédup loans : Éco-PTZ ne se cumule pas avec lui-même
  const uniqueLoans = new Map<string, AidLineItem>();
  for (const l of loans) {
    const prev = uniqueLoans.get(l.aid.id);
    if (!prev || l.amount_eur > prev.amount_eur) uniqueLoans.set(l.aid.id, l);
  }
  const loansList = Array.from(uniqueLoans.values());

  // ─── Plafond global : les subventions ne dépassent pas le coût travaux ───
  const rawGrantsTotal = grants.reduce((s, g) => s + g.amount_eur, 0);
  const capRatio =
    rawGrantsTotal > totalCostHT_eur && rawGrantsTotal > 0
      ? totalCostHT_eur / rawGrantsTotal
      : 1;
  const cappedGrants = grants.map((g) => ({
    ...g,
    amount_eur: g.amount_eur * capRatio,
  }));
  const totalGrants_eur = cappedGrants.reduce((s, g) => s + g.amount_eur, 0);

  const totalLoansAvailable_eur = loansList.reduce(
    (s, l) => s + l.amount_eur,
    0,
  );

  const restAChargeHT_eur = Math.max(0, totalCostHT_eur - totalGrants_eur);
  const restAChargeAfterLoan_eur = Math.max(
    0,
    restAChargeHT_eur - totalLoansAvailable_eur,
  );

  // Liste unique de toutes les aides applicables (pour info)
  const uniqueAidsApplicable: AidSpec[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    if (!seen.has(c.aid.id)) {
      seen.add(c.aid.id);
      uniqueAidsApplicable.push(c.aid);
    }
  }

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    target: scenario.target,
    insulation,
    heating,
    dhw,
    ventilation,
    totalCostHT_eur,
    grants: cappedGrants,
    totalGrants_eur,
    loans: loansList,
    totalLoansAvailable_eur,
    tvaReduction_eur,
    restAChargeHT_eur,
    restAChargeAfterLoan_eur,
    uniqueAidsApplicable,
  };
}
