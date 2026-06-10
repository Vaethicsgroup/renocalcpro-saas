// src/lib/calc/traceability/confidence.ts — Niveau de confiance du dossier v1.0
// Évalue la qualité de la saisie : combien de valeurs sont SAISIES par l'utilisateur
// vs DEDUITES de tables conventionnelles. Plus le score est haut, plus le calcul
// est fiable. Sortie attendue dans le ProjectResult pour transparence.

import type { BuildingInputs } from "../types";

export type ConfidenceLevel = "FAIBLE" | "MOYENNE" | "BONNE" | "EXCELLENTE";

export interface ConfidenceReport {
  /** Score 0-100. */
  score: number;
  level: ConfidenceLevel;
  /** Nombre de champs saisis. */
  saisi_count: number;
  /** Nombre de champs déduits de tables conventionnelles. */
  deduit_count: number;
  /** Détail par catégorie. */
  by_category: {
    envelope: { saisi: number; deduit: number; total: number };
    openings: { saisi: number; deduit: number; total: number };
    systems: { saisi: number; deduit: number; total: number };
    occupancy: { saisi: number; deduit: number; total: number };
  };
  /** Recommandations pour améliorer la fiabilité. */
  improvements: string[];
}

export function computeConfidence(b: BuildingInputs): ConfidenceReport {
  let saisi = 0, deduit = 0;
  const cat = {
    envelope: { saisi: 0, deduit: 0, total: 0 },
    openings: { saisi: 0, deduit: 0, total: 0 },
    systems:  { saisi: 0, deduit: 0, total: 0 },
    occupancy:{ saisi: 0, deduit: 0, total: 0 },
  };

  // Enveloppe : U-value saisi ou layers présents vs fallback table
  for (const w of b.walls) {
    cat.envelope.total++;
    if (w.u_value_W_m2K != null || (w.layers && w.layers.length > 0)) {
      saisi++; cat.envelope.saisi++;
    } else {
      deduit++; cat.envelope.deduit++;
    }
  }

  // Ouvrants : U + glazing + frame
  for (const o of b.openings) {
    cat.openings.total++;
    if (o.u_value_W_m2K != null) {
      saisi++; cat.openings.saisi++;
    } else if (o.glazing && o.frame) {
      saisi++; cat.openings.saisi++; // table conventionnelle DPE
    } else {
      deduit++; cat.openings.deduit++;
    }
  }

  // Systèmes : efficacité explicite vs table
  for (const h of b.heating) {
    cat.systems.total++;
    if (h.efficiency != null && h.install_year != null) { saisi++; cat.systems.saisi++; }
    else if (h.install_year != null) { saisi++; cat.systems.saisi++; }
    else { deduit++; cat.systems.deduit++; }
  }
  for (const d of b.dhw) {
    cat.systems.total++;
    if (d.efficiency != null) { saisi++; cat.systems.saisi++; }
    else { deduit++; cat.systems.deduit++; }
  }
  cat.systems.total++; // ventilation
  if (b.ventilation.kind !== "ABSENTE") { saisi++; cat.systems.saisi++; }
  else { deduit++; cat.systems.deduit++; }

  // Occupation
  cat.occupancy.total++;
  if (b.occupants != null) { saisi++; cat.occupancy.saisi++; } else { deduit++; cat.occupancy.deduit++; }
  cat.occupancy.total++;
  if (b.setpoint_winter_C != null) { saisi++; cat.occupancy.saisi++; } else { deduit++; cat.occupancy.deduit++; }
  cat.occupancy.total++;
  if (b.inertia != null) { saisi++; cat.occupancy.saisi++; } else { deduit++; cat.occupancy.deduit++; }

  const total = saisi + deduit;
  const score = total > 0 ? Math.round((saisi / total) * 100) : 0;

  let level: ConfidenceLevel;
  if (score >= 80) level = "EXCELLENTE";
  else if (score >= 60) level = "BONNE";
  else if (score >= 40) level = "MOYENNE";
  else level = "FAIBLE";

  const improvements: string[] = [];
  if (cat.envelope.deduit > 0) {
    improvements.push(`Préciser la composition des ${cat.envelope.deduit} paroi(s) (couches matériaux + épaisseurs) pour passer du U conventionnel au U réel.`);
  }
  if (cat.openings.deduit > 0) {
    improvements.push(`Renseigner type de vitrage et châssis pour ${cat.openings.deduit} ouvrant(s).`);
  }
  if (cat.systems.deduit > 0) {
    improvements.push(`Renseigner l'année d'installation et le rendement des systèmes (${cat.systems.deduit} équipement(s) sans donnée précise).`);
  }
  if (cat.occupancy.deduit > 0) {
    improvements.push(`Préciser nombre d'occupants, consigne de chauffage et inertie perçue pour ajuster les hypothèses d'usage.`);
  }

  return { score, level, saisi_count: saisi, deduit_count: deduit, by_category: cat, improvements };
}
