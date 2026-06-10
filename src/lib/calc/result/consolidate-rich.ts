// src/lib/calc/result/consolidate-rich.ts — Consolidation enrichie métier v1.0
// Wrapper non-destructif : ajoute breakdown déperditions, confort été, traceability,
// confidence, compliance status SANS modifier consolidateProjectResult ni les tests
// 22/22 et 17/17 déjà validés.
//
// Usage : remplace consolidateProjectResult par consolidateProjectResultRich quand
// tu veux la version complète audit-ready.

import type { BuildingInputs, Household, Scenario, ProjectResult } from "../types";
import { consolidateProjectResult } from "./consolidate";
import { computeHeatLossBreakdown, type HeatLossBreakdown } from "../engine/heat-loss-breakdown";
import { computeSummerComfort, type ComfortSummerResult } from "../engine/comfort-summer";
import { buildHypothesisLog, type HypothesisLog } from "../traceability/hypothesis";
import { computeConfidence, type ConfidenceReport } from "../traceability/confidence";
import { ENGINE_GLOBAL_COMPLIANCE, ENGINE_METHOD_COMPLIANCE, type ComplianceStatus } from "../parameters/compliance";

/** ProjectResult enrichi (superset stable, ProjectResult d'origine inclus). */
export interface ProjectResultRich extends ProjectResult {
  /** Déperditions détaillées par poste (audit). */
  heat_loss_breakdown: HeatLossBreakdown;
  /** Confort été indicatif. */
  summer_comfort: ComfortSummerResult;
  /** Journal hypothèses (saisi vs déduit vs forfaitaire). */
  hypotheses: HypothesisLog;
  /** Niveau de confiance du dossier. */
  confidence: ConfidenceReport;
  /** Méta-conformité globale + détail par méthode. */
  compliance: {
    global: typeof ENGINE_GLOBAL_COMPLIANCE;
    methods: typeof ENGINE_METHOD_COMPLIANCE;
    summary: {
      reglementaires_count: number;
      preparatoires_count: number;
      indicatifs_count: number;
      forfaitaires_count: number;
      non_implementes_count: number;
    };
  };
  /** Note méthodologique consolidée (à inclure dans PDF). */
  methodology_notes: string[];
}

export interface ConsolidateInputRich {
  project_id: string;
  building: BuildingInputs;
  household?: Household;
  scenarios: Scenario[];
}

export function consolidateProjectResultRich(input: ConsolidateInputRich): ProjectResultRich {
  // 1. Base : l'objet validé 17/17 (persistance) + 22/22 (moteur)
  const base = consolidateProjectResult({
    project_id: input.project_id,
    building: input.building,
    household: input.household,
    scenarios: input.scenarios,
  });

  // 2. Enrichissements métier
  const heat_loss = computeHeatLossBreakdown(input.building, base.baseline.heating_needs_kWh_year);
  const summer = computeSummerComfort(input.building);
  const hypotheses = buildHypothesisLog(input.building);
  const confidence = computeConfidence(input.building);

  // 3. Synthèse conformité par catégorie
  const summary = {
    reglementaires_count: 0,
    preparatoires_count: 0,
    indicatifs_count: 0,
    forfaitaires_count: 0,
    non_implementes_count: 0,
  };
  for (const m of Object.values(ENGINE_METHOD_COMPLIANCE)) {
    const map: Record<ComplianceStatus, keyof typeof summary> = {
      REGLEMENTAIRE_OPPOSABLE: "reglementaires_count",
      PREPARATOIRE_3CL: "preparatoires_count",
      PRE_AUDIT_INDICATIF: "indicatifs_count",
      ESTIMATION_FORFAITAIRE: "forfaitaires_count",
      NON_IMPLEMENTE: "non_implementes_count",
    };
    summary[map[m.status]]++;
  }

  // 4. Notes méthodologiques cumulées
  const methodology_notes: string[] = [];
  methodology_notes.push(
    `Statut global moteur : PRE_AUDIT_INDICATIF (engine v${base.engine_version}, paramètres v${base.parameters_version}).`,
  );
  methodology_notes.push(
    `Conformité méthodes : ${summary.reglementaires_count} réglementaires, ${summary.preparatoires_count} préparatoires 3CL, ${summary.indicatifs_count} indicatifs, ${summary.forfaitaires_count} forfaitaires, ${summary.non_implementes_count} non implémentés.`,
  );
  methodology_notes.push(
    `Niveau de confiance du dossier : ${confidence.level} (${confidence.score}/100). ${confidence.saisi_count} valeurs saisies, ${confidence.deduit_count} valeurs déduites.`,
  );
  if (heat_loss.top_contributor) {
    methodology_notes.push(
      `Poste de déperdition dominant : ${heat_loss.top_contributor.label} (${Math.round(heat_loss.top_contributor.share * 100)}% du UA total).`,
    );
  }
  if (heat_loss.envelope_dominated) {
    methodology_notes.push(
      "L'enveloppe opaque représente plus de 70% des déperditions : priorité à l'isolation thermique.",
    );
  }
  methodology_notes.push(
    `Confort été : ${summer.level} (Tic estimé ${summer.tic_estimated_C}°C, risque surchauffe ${Math.round(summer.overheating_risk * 100)}%).`,
  );

  // 5. Warning supplémentaire si confiance faible
  const warnings = [...base.warnings];
  if (confidence.score < 50) {
    warnings.push({
      severity: "WARN",
      code: "CONFIDENCE_LOW",
      message: `Niveau de confiance faible (${confidence.score}/100). ${confidence.improvements[0] ?? "Préciser la saisie pour fiabiliser le calcul."}`,
    });
  }
  if (summer.overheating_risk > 0.6) {
    warnings.push({
      severity: "WARN",
      code: "SUMMER_OVERHEATING",
      message: `Risque de surchauffe été élevé (${Math.round(summer.overheating_risk * 100)}%). ${summer.recommendations[0]}`,
    });
  }

  return {
    ...base,
    warnings,
    heat_loss_breakdown: heat_loss,
    summer_comfort: summer,
    hypotheses,
    confidence,
    compliance: {
      global: ENGINE_GLOBAL_COMPLIANCE,
      methods: ENGINE_METHOD_COMPLIANCE,
      summary,
    },
    methodology_notes,
  };
}
