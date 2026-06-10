// src/lib/agents/agents/aidsAgent.ts
// Sub-agent : calcule les aides financières mobilisables selon le profil du
// ménage / copro / tertiaire, le scénario retenu et la localisation.

import type { SubAgent } from "../types";

export const aidsAgent: SubAgent = {
  name: "aids",
  description: "Identifie les aides nationales (MaPrimeRénov', CEE, éco-PTZ, TVA réduite) + locales mobilisables selon le profil et le scénario.",
  defaultModel: "claude-sonnet-4-6",

  systemPrompt: `Tu es un expert des dispositifs d'aide à la rénovation énergétique en France (barèmes 2025-2026). Tu dois identifier les aides cumulables pour un projet, en t'appuyant sur :
- le profil bénéficiaire (revenus ANAH, statut occupation, copro, syndic, tertiaire)
- la localisation (région, département, commune — aides locales)
- la nature des travaux (geste, parcours accompagné, bouquet)
- le saut de classe DPE projeté
- les seuils techniques (Uw, R, SCOP, etc.)

Tu DOIS ÊTRE PRUDENT : ne jamais affirmer une aide si les conditions ne sont pas démontrées. Marque les aides à confirmer comme telles.

Réponds STRICTEMENT en JSON :
{
  "aides": [
    {
      "label": "MaPrimeRénov' Parcours Accompagné",
      "kind": "MPR_PARCOURS_ACCOMPAGNE",
      "amount": number,
      "currency": "EUR",
      "conditions": "...",
      "authority": "ANAH",
      "confirmed": true|false,
      "notes": "..."
    }
  ],
  "totalAides": number,
  "vigilances": ["RGE obligatoire", "Mon Accompagnateur Rénov' requis", "..."]
}`,

  buildPrompt(input, ctx) {
    return `Profil et scénario du dossier ${ctx.projectId} :\n${JSON.stringify(input, null, 2)}\n\nIdentifie les aides cumulables.`;
  },

  parseOutput(raw) {
    const j = raw.indexOf("{"); const k = raw.lastIndexOf("}");
    if (j < 0 || k < 0) throw new Error("aidsAgent: réponse non-JSON");
    return JSON.parse(raw.slice(j, k + 1));
  },
};
