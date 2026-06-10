// src/lib/security/fingerprint.ts
// Anti-abus MVP — empreintes device / IP hashées (SHA-256 + sel applicatif).
//
// RÈGLE FONDAMENTALE :
//   ❶ On ne STOCKE JAMAIS l'IP brute ni l'User-Agent brut côté DB usage/anti-abus.
//      Tout est hashé avec un sel applicatif (`FINGERPRINT_SALT`) avant insertion.
//   ❷ Les hashs sont déterministes (mêmes inputs → même output) afin de pouvoir
//      détecter des récidives, mais NE permettent PAS de remonter à l'IP réelle.
//   ❸ L'UA est normalisé (lowercase, trim, version majeure uniquement quand
//      possible) AVANT hashage pour grouper "Chrome 120.0.1.2" et
//      "Chrome 120.0.1.7" sur la même empreinte.
//
// Le sel doit être défini par variable d'environnement (`FINGERPRINT_SALT`).
// En l'absence de sel (dev / setup non terminé), un fallback constant est
// utilisé MAIS le hash est marqué "weak" via un préfixe explicite — la policy
// peut alors décider de ne PAS appliquer de blocage dur.

import { createHash } from "node:crypto";

const SALT_ENV_KEY = "FINGERPRINT_SALT";
const DEV_FALLBACK_SALT = "renocalcpro-dev-fallback-salt-do-not-use-in-prod";
const WEAK_PREFIX = "w$";
const STRONG_PREFIX = "s$";

/** Lit le sel applicatif. Retourne `{ value, strong }`. */
function readSalt(): { value: string; strong: boolean } {
  const fromEnv =
    typeof process !== "undefined" ? process.env?.[SALT_ENV_KEY] : undefined;
  if (fromEnv && fromEnv.length >= 16) {
    return { value: fromEnv, strong: true };
  }
  return { value: DEV_FALLBACK_SALT, strong: false };
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Hash un identifiant de device fourni par le client (cookie / localStorage
 * persistant, fingerprint navigateur, etc.). Le client est responsable de
 * produire un identifiant raisonnable ; le serveur ne lui fait pas confiance
 * pour autre chose que la détection de récidives.
 *
 * @param rawDeviceId Identifiant brut (ex: UUID v4 persisté côté client).
 * @returns Hash préfixé `s$` (strong) ou `w$` (weak/dev) — 32 hex characters.
 */
export function hashDeviceId(rawDeviceId: string | undefined | null): string {
  const safe = (rawDeviceId ?? "").trim();
  if (!safe) return "";
  const { value: salt, strong } = readSalt();
  const digest = sha256Hex(`device|${salt}|${safe}`).slice(0, 32);
  return `${strong ? STRONG_PREFIX : WEAK_PREFIX}${digest}`;
}

/**
 * Hash une adresse IP côté serveur. Pour IPv4, on hash l'adresse complète.
 * Pour IPv6, on tronque aux 64 premiers bits (préfixe réseau standard
 * /64) avant hash, pour ne pas géolocaliser un foyer à l'IP exacte.
 *
 * @param rawIp IP brute lue depuis `x-forwarded-for` / socket — JAMAIS persistée.
 */
export function hashIp(rawIp: string | undefined | null): string {
  const safe = (rawIp ?? "").trim();
  if (!safe) return "";
  const normalized = normalizeIp(safe);
  const { value: salt, strong } = readSalt();
  const digest = sha256Hex(`ip|${salt}|${normalized}`).slice(0, 32);
  return `${strong ? STRONG_PREFIX : WEAK_PREFIX}${digest}`;
}

/**
 * Normalise une IP avant hash :
 *  - trim
 *  - lowercase (IPv6)
 *  - IPv6 → tronque aux 4 premiers groupes (préfixe /64)
 *  - IPv4 mappé IPv6 (::ffff:1.2.3.4) → IPv4 brut
 *  - port (host:port) → host seulement
 */
function normalizeIp(ip: string): string {
  let v = ip.trim().toLowerCase();
  // x-forwarded-for peut contenir "ip1, ip2" — on prend la première.
  if (v.includes(",")) v = v.split(",")[0]!.trim();
  // IPv4 mappé en IPv6
  if (v.startsWith("::ffff:")) v = v.slice("::ffff:".length);
  // IPv4 avec port
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(v)) v = v.split(":")[0]!;
  // IPv6 — tronque au préfixe /64 (4 groupes de 16 bits). Un IPv6 contient au
  // moins 2 ":", contrairement à un IPv4 (qui n'en contient pas après le strip
  // du port plus haut). On filtre donc sur "au moins 2 ':'" plutôt que sur
  // "ne commence pas par un chiffre" — IPv6 commence souvent par "2001:..." etc.
  if ((v.match(/:/g)?.length ?? 0) >= 2) {
    // Expand "::" en 8 groupes pour garantir un découpage stable du /64.
    let parts: string[];
    if (v.includes("::")) {
      const [head, tail] = v.split("::");
      const headParts = head ? head.split(":") : [];
      const tailParts = tail ? tail.split(":") : [];
      const missing = 8 - headParts.length - tailParts.length;
      parts = [...headParts, ...Array(Math.max(0, missing)).fill("0"), ...tailParts];
    } else {
      parts = v.split(":");
    }
    const prefix = parts.slice(0, 4).join(":");
    v = `${prefix}::/64`;
  }
  return v;
}

/**
 * Normalise un User-Agent : lowercase, retire les versions mineures bruyantes,
 * conserve uniquement les tokens significatifs. Sortie courte, déterministe.
 */
export function normalizeUserAgent(ua: string | undefined | null): string {
  if (!ua) return "";
  let v = ua.toLowerCase().trim();
  // Retire les versions multi-segments type "5.0", "120.0.6099.234" → "5", "120".
  // Ne conserve que la version MAJEURE — permet de regrouper "Chrome 120.0.X"
  // et "Chrome 120.1.Y" sur la même empreinte.
  v = v.replace(/(\d+)(\.\d+)+/g, "$1");
  // Compresse les espaces
  v = v.replace(/\s+/g, " ");
  return v.slice(0, 256);
}

/**
 * Composite : produit un hash conjoint device + UA normalisé. Permet de
 * détecter qu'un même device a réinstallé son navigateur (UA proche) ou que
 * deux comptes partagent device + UA.
 */
export function hashDeviceComposite(
  rawDeviceId: string | undefined | null,
  ua: string | undefined | null,
): string {
  const safeDevice = (rawDeviceId ?? "").trim();
  const safeUa = normalizeUserAgent(ua);
  if (!safeDevice && !safeUa) return "";
  const { value: salt, strong } = readSalt();
  const digest = sha256Hex(`composite|${salt}|${safeDevice}|${safeUa}`).slice(0, 32);
  return `${strong ? STRONG_PREFIX : WEAK_PREFIX}${digest}`;
}

/** Helpers exposés pour les tests / outils admin. */
export const __fingerprintInternals = {
  readSalt,
  normalizeIp,
  WEAK_PREFIX,
  STRONG_PREFIX,
};
