// src/lib/calc/engine/heat-loss-breakdown.ts — Déperditions détaillées par poste v1.0
// Décompose UA et besoin chauffage par poste (murs, toits, planchers, ouvrants,
// ventilation, ponts thermiques). Donne le % de contribution de chaque poste.
// Indispensable pour qu'un audit identifie où isoler en priorité.

import type { BuildingInputs } from "../types";
import { computeUA } from "./thermal";

export interface HeatLossItem {
  /** Code poste (utilisé pour i18n / rendu PDF). */
  code: "WALLS" | "ROOFS" | "FLOORS" | "OPENINGS" | "VENTILATION" | "THERMAL_BRIDGES";
  /** Libellé humain. */
  label: string;
  /** Contribution UA en W/K. */
  ua_W_K: number;
  /** Part de UA total (0-1). */
  share: number;
  /** Besoin chauffage annuel attribué à ce poste (kWh utile/an). */
  heating_share_kWh_year: number;
  /** Surface concernée (m²) — null si non applicable (ventilation, ponts thermiques). */
  surface_m2: number | null;
  /** Recommandation métier courte ("priorité haute" si > 30% UA). */
  priority: "HAUTE" | "MOYENNE" | "FAIBLE";
}

export interface HeatLossBreakdown {
  items: HeatLossItem[];
  ua_total_W_K: number;
  heating_needs_total_kWh_year: number;
  /** Le poste #1 contribuant le plus aux pertes. Indicateur audit-friendly. */
  top_contributor: HeatLossItem | null;
  /** Indique si l'enveloppe opaque représente >70% des pertes (typique passoire). */
  envelope_dominated: boolean;
}

export function computeHeatLossBreakdown(
  building: BuildingInputs,
  heating_needs_kWh_year: number,
): HeatLossBreakdown {
  const ua = computeUA(building);

  const items: HeatLossItem[] = [
    {
      code: "WALLS",
      label: "Murs extérieurs",
      ua_W_K: ua.ua_walls,
      share: ua.ua_total > 0 ? ua.ua_walls / ua.ua_total : 0,
      heating_share_kWh_year: ua.ua_total > 0 ? heating_needs_kWh_year * ua.ua_walls / ua.ua_total : 0,
      surface_m2: building.walls
        .filter(w => w.kind === "WALL")
        .reduce((s, w) => s + w.surface_m2, 0),
      priority: "MOYENNE",
    },
    {
      code: "ROOFS",
      label: "Toiture / combles",
      ua_W_K: ua.ua_roofs,
      share: ua.ua_total > 0 ? ua.ua_roofs / ua.ua_total : 0,
      heating_share_kWh_year: ua.ua_total > 0 ? heating_needs_kWh_year * ua.ua_roofs / ua.ua_total : 0,
      surface_m2: building.walls
        .filter(w => w.kind === "ROOF")
        .reduce((s, w) => s + w.surface_m2, 0),
      priority: "MOYENNE",
    },
    {
      code: "FLOORS",
      label: "Plancher bas",
      ua_W_K: ua.ua_floors,
      share: ua.ua_total > 0 ? ua.ua_floors / ua.ua_total : 0,
      heating_share_kWh_year: ua.ua_total > 0 ? heating_needs_kWh_year * ua.ua_floors / ua.ua_total : 0,
      surface_m2: building.walls
        .filter(w => w.kind === "FLOOR")
        .reduce((s, w) => s + w.surface_m2, 0),
      priority: "MOYENNE",
    },
    {
      code: "OPENINGS",
      label: "Menuiseries (fenêtres, portes)",
      ua_W_K: ua.ua_openings,
      share: ua.ua_total > 0 ? ua.ua_openings / ua.ua_total : 0,
      heating_share_kWh_year: ua.ua_total > 0 ? heating_needs_kWh_year * ua.ua_openings / ua.ua_total : 0,
      surface_m2: building.openings.reduce((s, o) => s + o.surface_m2, 0),
      priority: "MOYENNE",
    },
    {
      code: "VENTILATION",
      label: "Renouvellement d'air (ventilation)",
      ua_W_K: ua.ua_ventilation,
      share: ua.ua_total > 0 ? ua.ua_ventilation / ua.ua_total : 0,
      heating_share_kWh_year: ua.ua_total > 0 ? heating_needs_kWh_year * ua.ua_ventilation / ua.ua_total : 0,
      surface_m2: null,
      priority: "MOYENNE",
    },
    {
      code: "THERMAL_BRIDGES",
      label: "Ponts thermiques (estimation forfaitaire +15%)",
      ua_W_K: ua.ua_thermal_bridges,
      share: ua.ua_total > 0 ? ua.ua_thermal_bridges / ua.ua_total : 0,
      heating_share_kWh_year: ua.ua_total > 0 ? heating_needs_kWh_year * ua.ua_thermal_bridges / ua.ua_total : 0,
      surface_m2: null,
      priority: "FAIBLE",
    },
  ];

  // Attribue priorité métier
  for (const it of items) {
    if (it.share >= 0.30) it.priority = "HAUTE";
    else if (it.share >= 0.15) it.priority = "MOYENNE";
    else it.priority = "FAIBLE";
  }

  // Top contributor (hors ponts thermiques forfaitaires)
  const candidates = items.filter(i => i.code !== "THERMAL_BRIDGES");
  const top = candidates.reduce((max, cur) => (cur.ua_W_K > max.ua_W_K ? cur : max), candidates[0]);

  const envelope_ua = items
    .filter(i => i.code === "WALLS" || i.code === "ROOFS" || i.code === "FLOORS" || i.code === "OPENINGS")
    .reduce((s, i) => s + i.ua_W_K, 0);

  return {
    items,
    ua_total_W_K: ua.ua_total,
    heating_needs_total_kWh_year: heating_needs_kWh_year,
    top_contributor: top ?? null,
    envelope_dominated: ua.ua_total > 0 && envelope_ua / ua.ua_total >= 0.70,
  };
}
