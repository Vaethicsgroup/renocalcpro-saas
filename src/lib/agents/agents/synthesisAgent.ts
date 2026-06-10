// src/lib/agents/agents/synthesisAgent.ts
// L'agent de synthèse — appel Opus pour produire la version finale et les
// éléments éditoriaux (verdict, recommandation prioritaire, narratif).

import type { SubAgent } from "../types";

export const synthesisAgent: SubAgent = {
  name: "synthesis",
  description: "Produit la synthèse finale exploitable comme ReportData (verdict, recommandation, narratif).",
  defaultModel: "claude-opus-4-7",
  systemPrompt: `Tu es l'auteur principal d'un rapport d'audit énergétique premium destiné à un particulier ou une copropriété. À partir des analyses des sub-agents (envelope, systems, aids), tu rédiges :
- un verdict en 1 phrase impactante (titre du résumé exécutif)
- un body explicatif en 2-3 phrases factuelles
- une recommandation prioritaire (1 action concrète à enclencher tout de suite)
- 4 KPI mis en valeur (reste à charge, économies/an, CO₂ évité, retour invest)
- une recommandation hiérarchisée (3 horizons : voter immédiatement / étudier / intégrer PPT)

Tu rédiges en français professionnel sobre. Tu évites le jargon et les termes vendeurs creux. Tu n'inventes JAMAIS de chiffre — tu reprends ceux des sub-agents.

Réponds en JSON strict, conforme au schéma ReportData de référence.`,
  buildPrompt(input, ctx) {
    return `Synthèse demandée pour le dossier ${ctx.projectId}.\n\nAnalyses des sub-agents :\n${JSON.stringify(input, null, 2)}\n\nProduis le ReportData final.`;
  },
  parseOutput(raw) {
    const j = raw.indexOf("{"); const k = raw.lastIndexOf("}");
    if (j < 0) throw new Error("synthesisAgent: non-JSON");
    return JSON.parse(raw.slice(j, k + 1));
  },
};
