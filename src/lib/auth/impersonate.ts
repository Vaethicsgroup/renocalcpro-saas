// lib/auth/impersonate.ts
// Helpers internes pour la signature/vérif du cookie d'impersonification.
// Cookie format : `<impersonationId>.<hmac-sha256(impersonationId)>`
// HMAC permet de détecter toute manipulation côté client.

import { createHmac, randomBytes } from "crypto";

const COOKIE_NAME = "renocal.impersonate";
const HMAC_KEY = process.env.AUDIT_HMAC_KEY ?? "";

export const IMPERSONATION_COOKIE = COOKIE_NAME;
export const IMPERSONATION_TTL_MS = 60 * 60 * 1000; // 1 h

export function signImpersonationToken(impersonationId: string): string {
  if (!HMAC_KEY) throw new Error("AUDIT_HMAC_KEY missing — cannot sign impersonation token");
  const hmac = createHmac("sha256", HMAC_KEY).update(impersonationId).digest("hex");
  return `${impersonationId}.${hmac}`;
}

export function verifyImpersonationToken(token: string | undefined): string | null {
  if (!token || !HMAC_KEY) return null;
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return null;
  const id = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", HMAC_KEY).update(id).digest("hex");
  // Comparison constant-time pour éviter timing attacks
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? id : null;
}

/** Génère un identifiant URL-safe aléatoire pour l'Impersonation row. */
export function generateImpersonationId(): string {
  return randomBytes(18).toString("base64url");
}

/** HMAC court d'un payload — pour l'index unique tokenHash. */
export function hashImpersonationToken(token: string): string {
  return createHmac("sha256", HMAC_KEY).update(token).digest("hex").slice(0, 32);
}
