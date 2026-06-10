// lib/ai/assistant/degraded-mode.ts
// Mode dégradé : si le LLM est indisponible (Anthropic API down, quota dépassé,
// erreur réseau persistante), retourner directement le knowledge brut depuis
// FIELD_HELP / SECTION_HELP / RECOGNIZE_GUIDES / COMPARATORS / AIDS_HELP.
//
// Continuité de service : l'utilisateur reçoit toujours une réponse pertinente
// même sans génération IA, juste sans personnalisation conversationnelle.

import { getFieldHelp } from "./knowledge/field-help";
import { getSectionHelp } from "./knowledge/section-help";
import { getRecognizeGuide } from "./knowledge/recognize";
import { getComparator } from "./knowledge/comparators";
import { getAidExplain } from "./knowledge/aids-help";
import type { AssistantContextType, AssistantSource, AssistantConfidence } from "./types";

export interface DegradedReply {
  content: string;
  confidence: AssistantConfidence;
  sources: AssistantSource[];
  guardsTriggered: string[];
  followUpSuggestions: string[];
}

/**
 * Génère une réponse "knowledge brut" sans appel LLM.
 * Renvoie null si aucune knowledge ne correspond — le caller décidera.
 */
export function buildDegradedReply(
  contextType: AssistantContextType,
  contextRef?: string,
): DegradedReply | null {
  switch (contextType) {
    case "FORM_FIELD":
      return contextRef ? fieldReply(contextRef) : null;
    case "FORM_SECTION":
      return contextRef ? sectionReply(contextRef) : null;
    case "MATERIAL_RECOGNIZE":
    case "SYSTEM_RECOGNIZE":
      return contextRef ? recognizeReply(contextRef) : null;
    case "CHOICE_HELP":
      return contextRef ? comparatorReply(contextRef) : null;
    case "AID_EXPLAIN":
      return contextRef ? aidReply(contextRef) : null;
    default:
      return null;
  }
}

function fieldReply(ref: string): DegradedReply | null {
  const help = getFieldHelp(ref);
  if (!help) return null;
  return {
    content: [
      `**${help.label}**`,
      "",
      `**Que mettre :** ${help.whatToPut}`,
      "",
      `**Comment mesurer :** ${help.howToMeasure}`,
      "",
      `**Pourquoi utile :** ${help.whyUseful}`,
      help.whenUnknown ? `\n**Si vous ne savez pas :** ${help.whenUnknown}` : "",
      help.commonMistakes?.length ? `\n**Erreurs fréquentes :**\n${help.commonMistakes.map(m => `- ${m}`).join("\n")}` : "",
      "\n*⚠ Service IA temporairement indisponible — réponse fournie depuis la base de connaissance interne. Reformulation conversationnelle indisponible.*",
    ].filter(Boolean).join("\n"),
    confidence: "CERTAIN",
    sources: [{ kind: "help", ref: help.ref, label: help.label }],
    guardsTriggered: ["degraded_mode_no_llm"],
    followUpSuggestions: [],
  };
}

function sectionReply(ref: string): DegradedReply | null {
  const help = getSectionHelp(ref);
  if (!help) return null;
  return {
    content: [
      `**${help.label}**`,
      "",
      `**À quoi sert cette section :** ${help.purpose}`,
      "",
      `**Préparer avant :**`,
      ...help.whatYouNeed.map(w => `- ${w}`),
      "",
      `**Temps estimé :** ${help.estimatedMinutes} minutes`,
      "",
      `**Conseils :**`,
      ...help.startTips.map(t => `- ${t}`),
      "\n*⚠ Service IA temporairement indisponible — réponse depuis knowledge interne.*",
    ].join("\n"),
    confidence: "CERTAIN",
    sources: [{ kind: "help", ref: `section:${help.ref}`, label: help.label }],
    guardsTriggered: ["degraded_mode_no_llm"],
    followUpSuggestions: [],
  };
}

function recognizeReply(ref: string): DegradedReply | null {
  const guide = getRecognizeGuide(ref);
  if (!guide) return null;
  return {
    content: [
      `**${guide.label}**`,
      "",
      `**Indices visuels :**`,
      ...guide.visualClues.map(c => `- ${c}`),
      "",
      `**Tests simples :**`,
      ...guide.simpleTests.map(t => `- ${t}`),
      guide.distinguishFrom.length ? `\n**Différencier de :**\n${guide.distinguishFrom.map(d => `- **${d.otherLabel}** : ${d.tellingDifference}`).join("\n")}` : "",
      `\n**Quand laisser inconnu :** ${guide.whenLeaveUnknown}`,
      "\n*⚠ Service IA temporairement indisponible — réponse depuis knowledge interne.*",
    ].join("\n"),
    confidence: "CERTAIN",
    sources: [{ kind: guide.category === "system" ? "system" : "material", ref: guide.ref, label: guide.label }],
    guardsTriggered: ["degraded_mode_no_llm"],
    followUpSuggestions: [],
  };
}

function comparatorReply(ref: string): DegradedReply | null {
  const cmp = getComparator(ref);
  if (!cmp) return null;
  return {
    content: [
      `**${cmp.userQuestion}**`,
      "",
      `*Quand applicable :* ${cmp.applicableWhen}`,
      "",
      "**Options :**",
      ...cmp.options.map(o => `\n### ${o.label}\n- Avantages : ${o.pros.slice(0, 3).join(" ; ")}\n- Inconvénients : ${o.cons.slice(0, 3).join(" ; ")}\n- Coût : ${o.costPerM2Range[0]}–${o.costPerM2Range[1]} €\n- Aides : ${o.applicableAids.join(", ")}`),
      "",
      "**Recommandations selon profil :**",
      ...cmp.recommendationByProfile.map(r => `- *${r.profile}* → ${r.recommendation}`),
      "",
      "**Mises en garde :**",
      ...cmp.warnings.map(w => `⚠ ${w}`),
      "\n*⚠ Service IA temporairement indisponible — comparateur structuré depuis knowledge interne.*",
    ].join("\n"),
    confidence: "ESTIMATED",
    sources: [{ kind: "doc", ref: `comparator:${cmp.ref}`, label: cmp.userQuestion }],
    guardsTriggered: ["degraded_mode_no_llm", "expert_verification_added"],
    followUpSuggestions: [],
  };
}

function aidReply(ref: string): DegradedReply | null {
  const aid = getAidExplain(ref);
  if (!aid) return null;
  return {
    content: [
      `**${aid.label}**`,
      "",
      aid.shortDescription,
      "",
      `**Comment ça marche :** ${aid.howItWorks}`,
      "",
      "**Conditions d'éligibilité :**",
      ...aid.eligibilityConditions.map(c => `- ${c}`),
      "",
      `**Montant typique :** ${aid.typicalAmount}`,
      "",
      `**Démarche :** ${aid.applicationProcess}`,
      "",
      `**Source officielle :** ${aid.officialSource}`,
      "\n*⚠ Service IA temporairement indisponible — réponse depuis knowledge interne. Vérifiez toujours sur france-renov.gouv.fr pour les barèmes à jour.*",
    ].join("\n"),
    confidence: "CERTAIN",
    sources: [{ kind: "aid", ref: aid.ref, label: aid.label }],
    guardsTriggered: ["degraded_mode_no_llm", "expert_verification_added"],
    followUpSuggestions: [],
  };
}
