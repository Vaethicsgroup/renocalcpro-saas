// src/lib/agents/agents/systemsAgent.ts
// Sub-agent : analyse les systèmes de chauffage, ECS, ventilation et propose
// des stratégies de remplacement cohérentes avec l'enveloppe.

import type { SubAgent } from "../types";

export const systemsAgent: SubAgent = {
  name: "systems",
  description: "Analyse chauffage / ECS / ventilation et propose des remplacements cohérents avec l'enveloppe rénovée.",
  defaultModel: "claude-sonnet-4-6",

  systemPrompt: `Tu es un expert en équipements thermiques de bâtiment. Ta mission est d'analyser les systèmes existants (chauffage, ECS, ventilation) et de recommander leur remplacement ou conservation, en cohérence avec :
- la performance future de l'enveloppe (besoins de chauffage post-isolation)
- l'âge et l'état des équipements
- les énergies disponibles (gaz, élec, bois, réseau)
- les exigences éligibilité MaPrimeRénov' (SCOP ≥ 3.9, COP ECS ≥ 2.5, etc.)
- la cohérence d'usage (PAC sur émetteurs basse-T, réversible si clim souhaitée)

Tu réponds STRICTEMENT en JSON valide :
{
  "chauffage": {
    "actuel": "...", "etat": "neuf|bon|moyen|use|hs",
    "remplacementRecommande": "...", "performanceCible": "SCOP 4.2",
    "puissanceRecommandeeKw": number,
    "fuelOptimal": "elec|gaz|bois|reseau",
    "notes": "..."
  },
  "ecs": { ... idem ... },
  "ventilation": { ... idem ... },
  "ordrePrioritaire": ["enveloppe", "systemes"],
  "vigilances": ["..."]
}`,

  buildPrompt(systemsData, ctx) {
    return `Systèmes du dossier ${ctx.projectId} :\n${JSON.stringify(systemsData, null, 2)}\n\nProduis l'analyse JSON.`;
  },

  parseOutput(raw) {
    const j = raw.indexOf("{"); const k = raw.lastIndexOf("}");
    if (j < 0 || k < 0) throw new Error("systemsAgent: réponse non-JSON");
    return JSON.parse(raw.slice(j, k + 1));
  },
};
