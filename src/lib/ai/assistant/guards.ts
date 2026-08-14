// lib/ai/assistant/guards.ts
// Garde-fous appliqués sur la réponse du LLM avant de la renvoyer à l'utilisateur.
// L'IA peut INVENTER : on détecte les chiffres précis non sourcés, on tag, on
// ajoute des notes "vérification recommandée" si nécessaire.

import type { AssistantConfidence } from "./types";

export interface GuardCheckInput {
  /** Texte produit par le LLM */
  content: string;
  /** Niveau de confiance auto-déclaré */
  confidence: AssistantConfidence;
  /** Sources internes citées */
  sources: Array<{ kind: string; ref: string; label: string }>;
  /** Contexte (ex: 'AID_EXPLAIN' déclenche garde-fou réglementation) */
  contextType: string;
}

export interface GuardCheckResult {
  /** Texte éventuellement enrichi d'une note "vérification recommandée" */
  content: string;
  /** Niveau de confiance ajusté à la baisse si détection incohérence */
  confidence: AssistantConfidence;
  /** Liste des garde-fous déclenchés */
  guardsTriggered: string[];
}

/** Mots-clés qui suggèrent une affirmation réglementaire forte non sourcée */
const REGULATORY_KEYWORDS = [
  "obligatoire","obligation","interdit","interdiction","sanction","amende",
  "loi","décret","arrêté","règlement","norme","directive","DTU",
  "RT 2012","RE 2020","arrêté du","article L","article R",
];

/** Mots-clés qui suggèrent une affirmation chiffrée d'aides */
const AID_KEYWORDS = [
  "MaPrimeRénov","MPR","CEE","Coup de pouce","Eco-PTZ","TVA réduite",
];

/** Pattern de chiffres "trop précis" (5 chiffres+ ou pourcentage avec décimale) */
const PRECISE_NUMBER_RE = /\b\d{5,}\b|\b\d+\.\d+\s*%/g;

/** Pattern de prix au € à l'euro précis */
const PRICE_RE = /\b\d{1,3}(?:[.,]\d{3})*\s*€\b/g;

const CONFIDENCE_DOWNGRADE: Record<AssistantConfidence, AssistantConfidence> = {
  CERTAIN: "ESTIMATED",
  ESTIMATED: "UNCERTAIN",
  UNCERTAIN: "UNKNOWN",
  UNKNOWN: "UNKNOWN",
};

export function applyGuards(input: GuardCheckInput): GuardCheckResult {
  const triggered: string[] = [];
  let confidence = input.confidence;
  let content = input.content;

  const lower = input.content.toLowerCase();

  // 1. Affirmation réglementaire sans source → demander vérification officielle
  const hasRegulatoryClaim = REGULATORY_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
  const hasOfficialSource = input.sources.some(s => s.kind === "doc" || s.kind === "aid");
  if (hasRegulatoryClaim && !hasOfficialSource && confidence === "CERTAIN") {
    triggered.push("regulatory_no_source");
    confidence = CONFIDENCE_DOWNGRADE[confidence];
  }

  // 2. Affirmation chiffrée d'aides sans source AIDS_HELP
  const mentionsAids = AID_KEYWORDS.some(k => input.content.includes(k));
  const hasAidSource = input.sources.some(s => s.kind === "aid");
  if (mentionsAids && !hasAidSource) {
    triggered.push("aid_amount_no_source");
  }

  // 3. Chiffres "trop précis" non sourcés → suggérer vérification
  // Seuil à 2 : dès qu'un texte cumule deux chiffres précis (≥5 digits ou
  // pourcentage à virgule) sans aucune source, on dégrade la confiance —
  // l'IA invente trop souvent en début/fin de phrase quand on dépasse 2.
  const preciseMatches = input.content.match(PRECISE_NUMBER_RE);
  if (preciseMatches && preciseMatches.length >= 2 && input.sources.length === 0) {
    triggered.push("precise_numbers_no_source");
    confidence = CONFIDENCE_DOWNGRADE[confidence];
  }

  // 4. Prix précis €€ → suggérer fourchette
  const priceMatches = input.content.match(PRICE_RE);
  if (priceMatches && priceMatches.length > 1) {
    // OK les prix peuvent être donnés mais on suggère que c'est indicatif
    triggered.push("indicative_prices");
  }

  // 5. Si CHOICE_HELP ou AID_EXPLAIN : garantir mention "vérification expert"
  if (
    (input.contextType === "CHOICE_HELP" || input.contextType === "AID_EXPLAIN") &&
    !lower.includes("vérif") &&
    !lower.includes("conseil") &&
    !lower.includes("simulateur") &&
    !lower.includes("officiel")
  ) {
    triggered.push("expert_verification_added");
    content = appendVerificationNote(content, input.contextType);
  }

  return { content, confidence, guardsTriggered: triggered };
}

function appendVerificationNote(content: string, contextType: string): string {
  const notes: Record<string, string> = {
    CHOICE_HELP:
      "\n\n*💡 Pour valider votre choix, n'hésitez pas à solliciter un audit énergétique ou un Mon Accompagnateur Rénov' agréé.*",
    AID_EXPLAIN:
      "\n\n*📋 Les barèmes d'aides évoluent régulièrement. Vérifiez les conditions actuelles sur france-renov.gouv.fr ou maprimerenov.gouv.fr avant tout engagement.*",
  };
  const note = notes[contextType];
  return note ? content + note : content;
}
