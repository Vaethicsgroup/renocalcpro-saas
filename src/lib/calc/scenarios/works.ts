// src/lib/calc/scenarios/works.ts — Application des travaux à un bâti v1.0
// Prend un BuildingInputs et un WorkItem[] → retourne un BuildingInputs modifié.
// Pure function : pas de mutation de l'input.

import type {
  BuildingInputs, WorkItem, WorkKind, OpaqueWall, Opening, HeatingSystem, DhwSystem,
  VentilationSystem,
} from "../types";
import { WORK_PERFORMANCE_TARGET, WORK_COST_UNIT } from "../parameters/constants";

// ─────────────────── 1. CALCUL COÛT D'UN TRAVAIL ───────────────────

export function computeWorkCost(work: WorkItem, building: BuildingInputs): number {
  if (work.total_cost_eur_override != null) return work.total_cost_eur_override;
  const def = WORK_COST_UNIT[work.kind];
  if (!def) return 0;
  if (def.unit === "EUR_FORFAIT") {
    return def.value * (work.quantity ?? 1);
  }
  // Surface : sinon estimer
  const surf = work.surface_m2 ?? defaultSurfaceForWork(work.kind, building);
  const unit = work.unit_cost_eur ?? def.value;
  return unit * surf;
}

function defaultSurfaceForWork(kind: WorkKind, b: BuildingInputs): number {
  const sumByKindSubtype = (kindFilter: "WALL"|"ROOF"|"FLOOR", subtypes: string[]) =>
    b.walls.filter(w => w.kind === kindFilter && subtypes.includes(w.subtype))
           .reduce((s, w) => s + w.surface_m2, 0);

  switch (kind) {
    case "ISO_MURS_ITE":
    case "ISO_MURS_ITI":
      return sumByKindSubtype("WALL", ["EXT", "MITOYEN"]);
    case "ISO_COMBLES_PERDUS":
      return sumByKindSubtype("ROOF", ["COMBLES_PERDUS"]);
    case "ISO_COMBLES_AMENAGES":
      return sumByKindSubtype("ROOF", ["COMBLES_AMENAGES"]);
    case "ISO_TOITURE":
      return sumByKindSubtype("ROOF", ["TOITURE", "TERRASSE"]);
    case "ISO_PLANCHER_BAS":
      return sumByKindSubtype("FLOOR", ["BAS_TERRE_PLEIN", "BAS_VIDE_SANIT", "BAS_SOUS_SOL"]);
    case "MENUISERIES_DV":
    case "MENUISERIES_TV":
      return b.openings.filter(o => o.kind === "WINDOW" || o.kind === "DOOR_GLASS")
                       .reduce((s, o) => s + o.surface_m2, 0);
    default:
      return 0;
  }
}

// ─────────────────── 2. APPLICATION D'UN TRAVAIL AU BÂTI ───────────────────

export function applyWorksToBuilding(b: BuildingInputs, works: WorkItem[]): BuildingInputs {
  // Deep clone safe
  const next: BuildingInputs = {
    ...b,
    walls: b.walls.map(w => ({ ...w })),
    openings: b.openings.map(o => ({ ...o })),
    heating: b.heating.map(h => ({ ...h })),
    dhw: b.dhw.map(d => ({ ...d })),
    ventilation: { ...b.ventilation },
  };

  for (const w of works) {
    applyOne(next, w);
  }
  return next;
}

function applyOne(b: BuildingInputs, work: WorkItem): void {
  const target = work.performance_target ?? WORK_PERFORMANCE_TARGET[work.kind];

  switch (work.kind) {
    case "ISO_MURS_ITE":
    case "ISO_MURS_ITI":
      if (target != null) {
        for (const w of b.walls) {
          if (w.kind === "WALL" && (w.subtype === "EXT" || w.subtype === "MITOYEN")) {
            w.u_value_W_m2K = Math.min(w.u_value_W_m2K ?? Infinity, target);
          }
        }
      }
      return;

    case "ISO_COMBLES_PERDUS":
      applyRoofTarget(b, ["COMBLES_PERDUS"], target);
      return;
    case "ISO_COMBLES_AMENAGES":
      applyRoofTarget(b, ["COMBLES_AMENAGES"], target);
      return;
    case "ISO_TOITURE":
      applyRoofTarget(b, ["TOITURE", "TERRASSE"], target);
      return;

    case "ISO_PLANCHER_BAS":
      if (target != null) {
        for (const w of b.walls) {
          if (w.kind === "FLOOR" && w.subtype !== "INTER") {
            w.u_value_W_m2K = Math.min(w.u_value_W_m2K ?? Infinity, target);
          }
        }
      }
      return;

    case "MENUISERIES_DV":
    case "MENUISERIES_TV":
      if (target != null) {
        for (const o of b.openings) {
          if (o.kind === "WINDOW" || o.kind === "DOOR_GLASS") {
            o.u_value_W_m2K = Math.min(o.u_value_W_m2K ?? Infinity, target);
            o.glazing = work.kind === "MENUISERIES_TV" ? "TRIPLE" : "DOUBLE_ARGON";
          }
        }
      }
      return;

    case "VMC_HYGRO_B":
      b.ventilation = { ...b.ventilation, kind: "VMC_SF_HYGRO_B" };
      return;
    case "VMC_DF":
      b.ventilation = { ...b.ventilation, kind: "VMC_DF", heat_recovery_eff: 0.85 };
      return;

    case "REMPLACEMENT_CHAUDIERE_COND":
      replaceHeating(b, "CHAUDIERE_GAZ_COND", "GAZ_NAT", target ?? 0.95);
      return;
    case "PAC_AIR_EAU":
      replaceHeating(b, "PAC_AIR_EAU", "ELEC", target ?? 3.0);
      return;
    case "PAC_AIR_AIR":
      replaceHeating(b, "PAC_AIR_AIR", "ELEC", target ?? 2.6);
      return;
    case "POELE_GRANUL":
      // Ajoute en appoint (50% chauffage) sans remplacer
      addHeating(b, { id: `pg-${work.id}`, kind: "POELE_GRANUL", carrier: "BOIS_GRANUL",
                       efficiency: target ?? 0.85, coverage_share: 0.5 });
      // Réduit la coverage des systèmes existants
      const others = b.heating.filter(h => h.id !== `pg-${work.id}`);
      const left = 0.5 / Math.max(1, others.length);
      for (const h of others) h.coverage_share = left;
      return;

    case "CHAUFFE_EAU_THERMODYN":
      replaceDhw(b, "BALLON_THERMODYN", "ELEC", target ?? 2.5);
      return;
    case "SOLAIRE_THERMIQUE_ECS":
      replaceDhw(b, "SOLAIRE_THERM_APPOINT", "ELEC", target ?? 3.0);
      return;

    case "PHOTOVOLTAIQUE":
      // PV : pas de modification thermique ici. À traiter en autoconso au niveau consommation
      // finale (à implémenter en v2). Pour l'instant : warning métier.
      return;
  }
}

function applyRoofTarget(b: BuildingInputs, subtypes: string[], target?: number): void {
  if (target == null) return;
  for (const w of b.walls) {
    if (w.kind === "ROOF" && subtypes.includes(w.subtype)) {
      w.u_value_W_m2K = Math.min(w.u_value_W_m2K ?? Infinity, target);
    }
  }
}

function replaceHeating(b: BuildingInputs, kind: HeatingSystem["kind"], carrier: HeatingSystem["carrier"], eff: number): void {
  b.heating = [{
    id: `new-${kind}`,
    kind, carrier,
    install_year: new Date().getFullYear(),
    efficiency: eff,
    coverage_share: 1,
  }];
}

function addHeating(b: BuildingInputs, h: HeatingSystem): void {
  b.heating = [...b.heating, h];
}

function replaceDhw(b: BuildingInputs, kind: DhwSystem["kind"], carrier: DhwSystem["carrier"], eff: number): void {
  b.dhw = [{
    id: `new-${kind}`,
    kind, carrier,
    install_year: new Date().getFullYear(),
    efficiency: eff,
  }];
}
