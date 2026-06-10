// src/lib/agents/agents/buildingAgent.ts
// Caractérise le bâti existant (pathologies typiques, contraintes, hypothèses).
import type { SubAgent } from "../types";

export interface BuildingInput {
  yearBuilt: number;
  surfaceM2: number;
  city: string;
  postalCode: string;
  altitudeM?: number;
  climateZone?: string;
  groundType?: string;
  floorStructure?: string;
  facadeAzimuth?: number;
  contextUrban?: string;
  photosCount?: number;
}

export interface BuildingOutput {
  era: "ancien_avant_1948" | "1948_1974" | "1974_1989" | "1989_2005" | "2005_2012" | "post_2012";
  probableConstruction: {
    walls:    { material: string; thickness_cm_estimate: number; u_estimate: number; comment: string };
    floor:    { material: string; insulation: "none" | "mediocre" | "partial" | "good"; comment: string };
    roof:     { type: string; insulation: "none" | "mediocre" | "partial" | "good"; comment: string };
    windows:  { type: string; u_estimate: number; comment: string };
  };
  pathologyRisks: Array<{ type: string; severity: "low" | "medium" | "high"; mitigation: string }>;
  heritageConstraints: { abf: boolean; spr: boolean; mh: boolean; iteAllowed: boolean; notes: string };
  urbanConstraints: { mitoyennete: boolean; cosLimit: boolean; notes: string };
  recommendedNextChecks: string[];
}

export const buildingAgent: SubAgent<BuildingInput, BuildingOutput> = {
  name: "building",
  description: "Caractérise le bâtiment à partir des données de saisie + photos + adresse.",
  defaultModel: "claude-sonnet-4-6",

  systemPrompt: `Tu es expert thermicien en bâti existant français (3CL-DPE 2021).
À partir des données de saisie (année, surface, adresse, photos disponibles), tu produis :

1. La PÉRIODE de construction (era) parmi : ancien_avant_1948, 1948_1974, 1974_1989, 1989_2005, 2005_2012, post_2012
2. La COMPOSITION PROBABLE des parois (murs, plancher, toiture, menuiseries) :
   - matériau dominant typique de la période
   - épaisseur estimée
   - U estimée (W/m²·K) — DPE 2021 valeurs par défaut si non isolé
3. Les PATHOLOGIES à risque (humidité ascensionnelle, ponts thermiques, fissuration, condensation, salpêtre)
4. Les CONTRAINTES patrimoniales (ABF si SPR / Site Patrimonial Remarquable, MH inscrit/classé, ITE possible ou non)
5. Les CONTRAINTES urbaines (mitoyenneté limitant ITE, COS limite)
6. Les VÉRIFICATIONS complémentaires recommandées

Fonde tes hypothèses sur les usages constructifs typiques de la période et de la zone climatique.

RÉPONDS UNIQUEMENT en JSON strict (pas de markdown), conforme au schéma BuildingOutput.`,

  buildPrompt(input, ctx) {
    return `Dossier ${ctx.projectId}.

Année construction : ${input.yearBuilt}
Surface : ${input.surfaceM2} m²
Adresse : ${input.postalCode} ${input.city}
${input.altitudeM ? `Altitude : ${input.altitudeM} m\n` : ""}${input.climateZone ? `Zone climatique : ${input.climateZone}\n` : ""}${input.groundType ? `Type sol : ${input.groundType}\n` : ""}${input.floorStructure ? `Structure plancher : ${input.floorStructure}\n` : ""}${input.contextUrban ? `Contexte urbain : ${input.contextUrban}\n` : ""}${input.photosCount ? `Photos disponibles : ${input.photosCount}\n` : ""}

Produis l'analyse au format BuildingOutput.`;
  },

  parseOutput(raw): BuildingOutput {
    const j = raw.indexOf("{"); const k = raw.lastIndexOf("}");
    if (j < 0) throw new Error("buildingAgent: non-JSON output");
    return JSON.parse(raw.slice(j, k + 1)) as BuildingOutput;
  },
};
