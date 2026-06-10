// src/lib/calc/index.ts — API publique du moteur de calcul v1.0
// Tout consommateur (server actions, pages, PDF, tests) importe d'ici.

export * from "./types";

// Engine
export { computeThermalState, computeUA, computeHeatingNeeds, computeDhwNeeds,
         computeConsumption, labelFromCEP, labelFromGES, dpeRank,
         ENGINE_VERSION } from "./engine/thermal";

// Scenarios
export { applyWorksToBuilding, computeWorkCost } from "./scenarios/works";
export { computeScenarioResult } from "./scenarios/recompute";

// Aids
export { resolveIncomeBand, incomeBandLabel } from "./aids/eligibility";
export { computeAidsBreakdownDetailed, computeMprForWork, computeCeeForWork } from "./aids/compute";

// Consolidation (objet PDF-ready)
export { consolidateProjectResult } from "./result/consolidate";
export type { ConsolidateInput } from "./result/consolidate";

// Paramètres versionnés (pour audit / debug)
export { PARAMETERS_VERSION, LAST_REVIEW_DATE } from "./parameters/constants";
export { AIDS_VERSION, AIDS_REVIEW_DATE } from "./parameters/aids";
