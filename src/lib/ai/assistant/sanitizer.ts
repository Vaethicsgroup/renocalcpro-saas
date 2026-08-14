// lib/ai/assistant/sanitizer.ts
// Anonymisation PII avant envoi au LLM et avant stockage en base.
// Principe : minimisation des données (RGPD art. 5.1.c).

const EMAIL_RE  = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// PHONE_FR : `\b` ne matche pas entre un séparateur et `+` (deux non-word
// chars). On utilise des lookarounds pour autoriser `+33...` après début
// de chaîne ou après un séparateur, tout en évitant de couper une séquence
// chiffrée plus large.
const PHONE_FR  = /(?<![\d\w])(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}(?![\d\w])/g;
const SIRET_RE  = /\b\d{14}\b/g;
const SIREN_RE  = /\b\d{9}\b/g;
const RIB_RE    = /\b[A-Z]{2}\d{2}\s?(?:\d{4}\s?){4,7}\d{1,4}\b/g;
// NIR : 15 chiffres répartis en sections (gender-YY-MM-dept-town-order-check).
// Les écritures manuscrites/formulaires intercalent souvent des espaces,
// notamment avant la clé de contrôle finale ; on les autorise.
const NIR_RE    = /\b[12]\d{2}\s?(?:0[1-9]|1[0-2])\s?(?:2[ABab]|\d{2})\s?\d{3}\s?\d{3}\s?\d{2}\b/g;
const PASSWORD_HINT = /\b(?:mot\s*de\s*passe|password|passwd|pwd)\s*[:=]\s*\S+/gi;

export interface SanitizeOptions {
  /** Si true, masque aussi les noms propres typiques (heuristique simple) */
  maskNames?: boolean;
  /** Si true, masque l'adresse précise (numéro + rue) en gardant ville/département */
  maskAddress?: boolean;
}

/**
 * Anonymise un texte pour stockage / log / envoi LLM.
 * Conserve le sens du diagnostic mais retire les identifiants directs.
 */
export function sanitizeText(input: string, opts: SanitizeOptions = {}): string {
  if (!input) return input;
  let out = input;

  out = out.replace(EMAIL_RE, "[email]");
  out = out.replace(PHONE_FR, "[téléphone]");
  out = out.replace(RIB_RE, "[IBAN]");
  out = out.replace(NIR_RE, "[n° sécu]");
  out = out.replace(SIRET_RE, "[SIRET]");
  out = out.replace(SIREN_RE, "[SIREN]");
  out = out.replace(PASSWORD_HINT, "[masqué]");

  if (opts.maskAddress) {
    // Heuristique : "12 rue/avenue/boulevard/place ... 75001" → garde "[adresse], 75001"
    out = out.replace(
      /\b\d{1,4}\s*(?:bis|ter)?\s*(?:rue|avenue|av\.?|boulevard|bd\.?|place|impasse|allée|chemin|route|rte\.?)\s+[A-ZÉÈÀÂÔÎÛÇa-zéèàâôîûç'\-\s]{2,80}/g,
      "[adresse]",
    );
  }

  if (opts.maskNames) {
    // Heuristique très prudente : Mme/Mlle/M./Monsieur/Madame + Capitalisé
    out = out.replace(
      /\b(?:Mme|Mlle|M\.|Monsieur|Madame|Mr\.?)\s+[A-ZÉÈÀÂÇ][a-zéèàâç'\-]+(?:\s+[A-ZÉÈÀÂÇ][a-zéèàâç'\-]+)?/g,
      "[nom]",
    );
  }

  return out;
}

/**
 * Anonymise un objet (récursif) en appliquant sanitizeText sur les chaînes.
 * Strippe aussi les clés "sensibles" connues (password, token, secret).
 */
const SENSITIVE_KEYS = new Set([
  "password","passwd","pwd","secret","token","apiKey","api_key","authorization",
  "bearer","jwt","sessionId","session_id","cookie","refreshToken","refresh_token",
  "iban","rib","ssn","nir","siret","siren",
  // PII directes : un payload qui contient explicitement un champ `email` ou
  // `phone` ne doit pas le faire transiter en clair vers le LLM.
  "email","mail","e-mail","phone","tel","telephone","mobile",
]);

export function sanitizeObject<T = unknown>(input: T, opts: SanitizeOptions = {}): T {
  if (input == null) return input;
  if (typeof input === "string") return sanitizeText(input, opts) as unknown as T;
  if (Array.isArray(input)) {
    return input.map(v => sanitizeObject(v, opts)) as unknown as T;
  }
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k)) {
        out[k] = "[redacted]";
        continue;
      }
      out[k] = sanitizeObject(v, opts);
    }
    return out as unknown as T;
  }
  return input;
}

/**
 * Construit un snapshot anonymisé d'un projet adapté à l'envoi LLM.
 * Garde uniquement les caractéristiques métier pertinentes.
 */
export function buildAnonymousProjectSnapshot(project: Record<string, unknown>): string {
  const safe = sanitizeObject(project, { maskAddress: true, maskNames: true });
  // Stringify compact (LLM-friendly)
  try {
    return JSON.stringify(safe, null, 2).slice(0, 4000);
  } catch {
    return "(projet : données indisponibles)";
  }
}
