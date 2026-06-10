// src/lib/agents/agents/envelopeAgent.ts
// Sub-agent : analyse l'enveloppe thermique et propose des préconisations
// d'isolation cohérentes avec l'année de construction et la zone climatique.

import type { SubAgent } from "../types";

export const envelopeAgent: SubAgent = {
  name: "envelope",
  description: "Analyse les parois (murs, toiture, plancher bas, menuiseries) et propose des cibles R / U + matériaux adaptés.",
  defaultModel: "claude-sonnet-4-6",

  systemPrompt: `Tu es un expert en thermique du bâtiment et en rénovation énergétique. Ta mission est d'analyser les parois d'un bâtiment et proposer des préconisations d'isolation cohérentes avec :
- l'année de construction (composition probable des parois)
- la zone climatique réglementaire (cible R)
- la faisabilité technique (mitoyenneté, accessibilité, contrainte ABF)
- les seuils MaPrimeRénov' / CEE en vigueur

Tu réponds STRICTEMENT en JSON valide, sans texte autour, suivant ce schéma :
{
  "diagnostic": "résumé en 2-3 phrases",
  "parois": [
    {
      "id": "wall|roof|floor|window|door",
      "description": "description observée",
      "uActuel": number,
      "uCible": number,
      "rCible": number,
      "materiauxRecommandes": ["fibre de bois", "ouate de cellulose"],
      "ordreUrgence": 1-5,
      "remarques": "string"
    }
  ],
  "vigilancesCroisees": ["pont thermique mur/plancher", "..."]
}`,

  buildPrompt(envelopeData, ctx) {
    return `Voici les parois du dossier ${ctx.projectId} :\n\n${JSON.stringify(envelopeData, null, 2)}\n\nProduis l'analyse au format JSON demandé.`;
  },

  parseOutput(raw) {
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < 0) throw new Error("envelopeAgent: réponse non-JSON");
    return JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  },
};
