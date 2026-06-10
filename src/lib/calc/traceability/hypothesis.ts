// src/lib/calc/traceability/hypothesis.ts — Journal des hypothèses utilisées v1.0
// Collecte explicitement TOUTES les hypothèses (saisies, déduites, conventionnelles,
// forfaitaires) appliquées au calcul. Indispensable pour audit / contradiction / 3CL.

import type { BuildingInputs } from "../types";
import {
  U_WALL_BY_PERIOD, U_ROOF_BY_PERIOD, U_FLOOR_BY_PERIOD,
  HEATING_EFFICIENCY, DHW_EFFICIENCY,
  DJU_BASE18_BY_ZONE,
} from "../parameters/constants";

export type HypothesisSource = "SAISI" | "DEDUIT_TABLE" | "FORFAITAIRE" | "ESTIMATION";

export interface HypothesisEntry {
  category: "ENVELOPPE" | "OUVRANTS" | "SYSTEMES" | "VENTILATION" | "CLIMAT" | "USAGE" | "PONTS_THERMIQUES" | "APPORTS";
  field: string;          // ex. "U_mur_extérieur", "rendement_chauffage"
  value: string;          // ex. "1.6 W/m².K", "0.78"
  source: HypothesisSource;
  reference?: string;     // ex. "Table U_WALL_BY_PERIOD['1975_1981']"
  note?: string;          // précision métier
}

export interface HypothesisLog {
  /** Liste complète des hypothèses appliquées. */
  entries: HypothesisEntry[];
  /** Compteurs synthétiques. */
  counts: Record<HypothesisSource, number>;
  /** Pourcentage de valeurs saisies. */
  saisi_ratio: number;
}

export function buildHypothesisLog(b: BuildingInputs): HypothesisLog {
  const entries: HypothesisEntry[] = [];

  // CLIMAT
  entries.push({
    category: "CLIMAT",
    field: "DJU base 18°C",
    value: `${DJU_BASE18_BY_ZONE[b.climate_zone]} DJU/an`,
    source: "DEDUIT_TABLE",
    reference: `DJU_BASE18_BY_ZONE[${b.climate_zone}] — Source Ademe`,
  });
  entries.push({
    category: "CLIMAT",
    field: "Altitude",
    value: `${b.altitude_m} m`,
    source: "SAISI",
    note: b.altitude_m > 400 ? `Correction +${Math.floor((b.altitude_m - 400) / 400) * 10}% DJU appliquée` : undefined,
  });

  // ENVELOPPE — parois
  for (const w of b.walls) {
    const period_table =
      w.kind === "WALL"  ? U_WALL_BY_PERIOD[b.construction_period] :
      w.kind === "ROOF"  ? U_ROOF_BY_PERIOD[b.construction_period] :
                           U_FLOOR_BY_PERIOD[b.construction_period];
    if (w.u_value_W_m2K != null) {
      entries.push({
        category: "ENVELOPPE",
        field: `U ${w.kind} ${w.id}`,
        value: `${w.u_value_W_m2K.toFixed(2)} W/m².K`,
        source: "SAISI",
        note: `Surface ${w.surface_m2} m², sous-type ${w.subtype}`,
      });
    } else if (w.layers && w.layers.length > 0) {
      entries.push({
        category: "ENVELOPPE",
        field: `U ${w.kind} ${w.id}`,
        value: "calculé via couches matériaux",
        source: "DEDUIT_TABLE",
        reference: `Σ e/λ par couche + Rsi + Rse standard`,
      });
    } else {
      entries.push({
        category: "ENVELOPPE",
        field: `U ${w.kind} ${w.id}`,
        value: `${period_table.toFixed(2)} W/m².K`,
        source: "DEDUIT_TABLE",
        reference: `Valeur conventionnelle pour période ${b.construction_period}`,
        note: `À préciser pour fiabiliser le calcul. Surface ${w.surface_m2} m².`,
      });
    }
  }

  // OUVRANTS
  for (const o of b.openings) {
    if (o.u_value_W_m2K != null) {
      entries.push({
        category: "OUVRANTS",
        field: `U ${o.id}`,
        value: `${o.u_value_W_m2K} W/m².K`,
        source: "SAISI",
      });
    } else if (o.glazing && o.frame) {
      entries.push({
        category: "OUVRANTS",
        field: `U ${o.id}`,
        value: `Table ${o.glazing} × ${o.frame}`,
        source: "DEDUIT_TABLE",
        reference: "U_WINDOW[glazing][frame]",
      });
    } else {
      entries.push({
        category: "OUVRANTS",
        field: `U ${o.id}`,
        value: "estimé (sans vitrage/châssis saisi)",
        source: "ESTIMATION",
      });
    }
  }

  // SYSTEMES
  for (const h of b.heating) {
    const eff_table = HEATING_EFFICIENCY[h.kind];
    if (h.efficiency != null) {
      entries.push({
        category: "SYSTEMES",
        field: `Rendement chauffage ${h.id}`,
        value: `${h.efficiency.toFixed(2)}`,
        source: "SAISI",
      });
    } else {
      entries.push({
        category: "SYSTEMES",
        field: `Rendement chauffage ${h.id}`,
        value: `${eff_table.toFixed(2)} (${h.kind})`,
        source: "DEDUIT_TABLE",
        reference: `HEATING_EFFICIENCY[${h.kind}]`,
        note: h.install_year ? `Correction âge appliquée pour année ${h.install_year}` : "Année d'installation non saisie : pas de correction âge",
      });
    }
  }
  for (const d of b.dhw) {
    if (d.efficiency != null) {
      entries.push({
        category: "SYSTEMES",
        field: `Rendement ECS ${d.id}`,
        value: `${d.efficiency.toFixed(2)}`,
        source: "SAISI",
      });
    } else {
      entries.push({
        category: "SYSTEMES",
        field: `Rendement ECS ${d.id}`,
        value: `${DHW_EFFICIENCY[d.kind].toFixed(2)} (${d.kind})`,
        source: "DEDUIT_TABLE",
        reference: `DHW_EFFICIENCY[${d.kind}]`,
      });
    }
  }

  // VENTILATION
  entries.push({
    category: "VENTILATION",
    field: "Type ventilation",
    value: b.ventilation.kind,
    source: "SAISI",
    note: b.ventilation.kind === "VMC_DF" ? `Récupération η=${b.ventilation.heat_recovery_eff ?? 0.75}` : undefined,
  });

  // USAGE
  entries.push({
    category: "USAGE",
    field: "Consigne hiver",
    value: `${b.setpoint_winter_C ?? 19}°C`,
    source: b.setpoint_winter_C != null ? "SAISI" : "DEDUIT_TABLE",
    reference: b.setpoint_winter_C != null ? undefined : "Valeur conventionnelle 19°C",
  });
  entries.push({
    category: "USAGE",
    field: "Occupants",
    value: String(b.occupants ?? "estimé"),
    source: b.occupants != null ? "SAISI" : "ESTIMATION",
    reference: b.occupants != null ? undefined : `Estimation surface ^0.5 × 0.5`,
  });
  entries.push({
    category: "USAGE",
    field: "Inertie thermique perçue",
    value: b.inertia ?? "MOYENNE (défaut)",
    source: b.inertia != null ? "SAISI" : "DEDUIT_TABLE",
  });

  // PONTS THERMIQUES — toujours forfaitaire
  entries.push({
    category: "PONTS_THERMIQUES",
    field: "Méthode",
    value: "+15% UA enveloppe opaque (forfaitaire)",
    source: "FORFAITAIRE",
    note: "Approximation pré-audit. 3CL strict : Ψ × ℓ par liaison.",
  });

  // APPORTS GRATUITS
  entries.push({
    category: "APPORTS",
    field: "Apports solaires + internes",
    value: "−15% du besoin brut (forfaitaire)",
    source: "FORFAITAIRE",
    note: "Pas de décomposition par orientation/facteur solaire.",
  });

  // Stats
  const counts: Record<HypothesisSource, number> = {
    SAISI: 0, DEDUIT_TABLE: 0, FORFAITAIRE: 0, ESTIMATION: 0,
  };
  for (const e of entries) counts[e.source]++;
  const saisi_ratio = entries.length > 0 ? counts.SAISI / entries.length : 0;

  return { entries, counts, saisi_ratio: Math.round(saisi_ratio * 100) / 100 };
}
