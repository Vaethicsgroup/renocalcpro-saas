// lib/ai/assistant/context-builder.ts
// Sélectionne et formate la "tranche de connaissance" pertinente pour la requête.
// Évite d'envoyer toute la base au LLM : on cible.

import { getFieldHelp, FIELD_HELP } from "./knowledge/field-help";
import { getSectionHelp } from "./knowledge/section-help";
import { getRecognizeGuide, listRecognizeGuides, type RecognizeGuide } from "./knowledge/recognize";
import { getComparator } from "./knowledge/comparators";
import { getAidExplain } from "./knowledge/aids-help";
import type { AssistantContextType, AssistantContextPayload } from "./types";

export interface BuildKnowledgeArgs {
  contextType: AssistantContextType;
  contextRef?: string;
  payload?: AssistantContextPayload;
}

/**
 * Retourne un texte (markdown léger) à injecter en system prompt :
 * uniquement la connaissance utile au contexte.
 */
export function buildKnowledgeSlice(args: BuildKnowledgeArgs): string {
  switch (args.contextType) {
    case "FORM_FIELD":
      return buildFieldSlice(args.contextRef);
    case "FORM_SECTION":
      return buildSectionSlice(args.contextRef);
    case "MATERIAL_RECOGNIZE":
      return buildRecognizeSlice(args.contextRef, "material");
    case "SYSTEM_RECOGNIZE":
      return buildRecognizeSlice(args.contextRef, "system");
    case "CHOICE_HELP":
      return buildChoiceSlice(args.contextRef, args.payload);
    case "AID_EXPLAIN":
      return buildAidSlice(args.contextRef);
    case "RESULT_EXPLAIN":
      return buildResultSlice(args.payload);
    case "GENERAL":
    default:
      return "";
  }
}

function buildFieldSlice(ref?: string): string {
  if (!ref) return "";
  const help = getFieldHelp(ref);
  if (!help) return `(Aucune fiche FIELD_HELP pour le champ "${ref}".)`;

  return `
## FICHE FIELD_HELP — ${help.label} (ref: ${help.ref})

**Que mettre :**
${help.whatToPut}

**Comment mesurer / reconnaître :**
${help.howToMeasure}

**Pourquoi utile :**
${help.whyUseful}

${help.commonMistakes ? `**Erreurs fréquentes :**\n${help.commonMistakes.map(m => `- ${m}`).join("\n")}\n` : ""}
${help.whenUnknown ? `**Si vous ne savez pas :**\n${help.whenUnknown}\n` : ""}
**Impact sur le calcul :** ${help.impactOnResult ?? "non précisé"}
${help.relatedHelp?.length ? `**Articles centre d'aide liés :** ${help.relatedHelp.join(", ")}` : ""}
`.trim();
}

function buildSectionSlice(ref?: string): string {
  if (!ref) return "";
  const help = getSectionHelp(ref);
  if (!help) return `(Aucune fiche SECTION_HELP pour la section "${ref}".)`;

  return `
## FICHE SECTION_HELP — ${help.label}

**À quoi sert cette section :**
${help.purpose}

**Préparer avant :**
${help.whatYouNeed.map(w => `- ${w}`).join("\n")}

**Temps estimé :** ${help.estimatedMinutes} minutes

**Pour bien démarrer :**
${help.startTips.map(t => `- ${t}`).join("\n")}

${help.pitfalls?.length ? `**Pièges à éviter :**\n${help.pitfalls.map(p => `- ${p}`).join("\n")}` : ""}

**Champs critiques :** ${help.criticalFields.join(", ")}
${help.relatedHelp?.length ? `**Articles liés :** ${help.relatedHelp.join(", ")}` : ""}
`.trim();
}

function buildRecognizeSlice(ref: string | undefined, category: RecognizeGuide["category"]): string {
  if (ref) {
    const guide = getRecognizeGuide(ref);
    if (guide) return formatRecognizeGuide(guide);
  }
  // Sans ref : on liste les options de la catégorie
  const guides = listRecognizeGuides(category);
  if (guides.length === 0) return "";
  return `
## CATALOGUE RECOGNIZE — catégorie ${category}

Options reconnaissables :
${guides.map(g => `- **${g.label}** (ref: ${g.ref})`).join("\n")}

(Demande à l'utilisateur de préciser son hypothèse ou de fournir une photo.)
`.trim();
}

function formatRecognizeGuide(g: RecognizeGuide): string {
  return `
## FICHE RECOGNIZE — ${g.label} (ref: ${g.ref}, catégorie: ${g.category})

**Indices visuels :**
${g.visualClues.map(c => `- ${c}`).join("\n")}

**Tests simples (non destructifs) :**
${g.simpleTests.map(t => `- ${t}`).join("\n")}

${g.invasiveTests?.length ? `**Tests semi-destructifs si doute :**\n${g.invasiveTests.map(t => `- ${t}`).join("\n")}\n` : ""}

**Différencier des matériaux/systèmes voisins :**
${g.distinguishFrom.map(d => `- vs **${d.otherLabel}** : ${d.tellingDifference}`).join("\n")}

**Quand laisser "inconnu" :** ${g.whenLeaveUnknown}
`.trim();
}

function buildChoiceSlice(ref: string | undefined, _payload?: AssistantContextPayload): string {
  if (!ref) return "";
  const comparator = getComparator(ref);
  if (!comparator) return `(Aucun comparateur dédié pour "${ref}". Raisonne avec les axes habituels.)`;

  return `
## COMPARATEUR — ${comparator.userQuestion}

**Quand applicable :** ${comparator.applicableWhen}

**Axes de comparaison :**
${comparator.axes.map(a => `- ${a.label} (${a.higherIsBetter ? "↑ mieux" : "↓ mieux"}) — ${a.rationale}`).join("\n")}

**Options envisageables :**
${comparator.options.map(o => `
### ${o.label} (${o.key})
- Avantages : ${o.pros.join(" ; ")}
- Inconvénients : ${o.cons.join(" ; ")}
- Coût indicatif : ${o.costPerM2Range[0]}–${o.costPerM2Range[1]} €${o.key.startsWith("ite") || o.key.startsWith("iti") ? "/m²" : ""}
- Aides typiques : ${o.applicableAids.join(", ")}
- Contre-indications : ${o.contraindications.join(" ; ") || "aucune majeure"}
`).join("\n")}

**Recommandations selon profil :**
${comparator.recommendationByProfile.map(r => `- *${r.profile}* → ${r.recommendation}`).join("\n")}

**Mises en garde :**
${comparator.warnings.map(w => `⚠ ${w}`).join("\n")}
`.trim();
}

function buildAidSlice(ref?: string): string {
  if (!ref) return "";
  const aid = getAidExplain(ref);
  if (!aid) return `(Aucune fiche AIDS_HELP pour "${ref}".)`;

  return `
## FICHE AIDS_HELP — ${aid.label} (ref: ${aid.ref})

**En une phrase :** ${aid.shortDescription}

**Comment ça marche :** ${aid.howItWorks}

**Conditions d'éligibilité :**
${aid.eligibilityConditions.map(c => `- ${c}`).join("\n")}

**Exclusions fréquentes :**
${aid.commonExclusions.map(c => `- ${c}`).join("\n")}

**Montant typique :** ${aid.typicalAmount}

**Cumulable avec :** ${aid.cumulableWith.join(", ") || "(aucune autre)"}
**Non cumulable avec :** ${aid.notCumulableWith.join(", ") || "(aucune)"}

**Hypothèses internes du calcul :**
${aid.internalAssumptions.map(a => `- ${a}`).join("\n")}

**Démarche :** ${aid.applicationProcess}
**Source officielle :** ${aid.officialSource}
`.trim();
}

function buildResultSlice(payload?: AssistantContextPayload): string {
  if (!payload?.projectSnapshot) return "";
  return `
## RÉSULTAT À EXPLIQUER

Snapshot anonymisé du projet et résultats associés (extrait) :
\`\`\`json
${JSON.stringify(payload.projectSnapshot, null, 2).slice(0, 2000)}
\`\`\`

Explique au persona : ce que ça signifie, comment c'est calculé, les limites
de l'estimation, et les leviers d'amélioration prioritaires.
`.trim();
}

/** Cherche une suggestion de suite logique selon contexte */
export function suggestFollowUpFields(currentFieldRef?: string): string[] {
  if (!currentFieldRef) return [];
  // Ex : si on est sur le matériau du mur, suggérer épaisseur + isolation
  if (currentFieldRef.startsWith("envelope.walls.")) {
    return ["envelope.walls.thicknessCm", "envelope.walls.insulationKind"]
      .filter(r => r !== currentFieldRef && FIELD_HELP[r])
      .map(r => FIELD_HELP[r].label);
  }
  return [];
}
