// lib/webhooks/signature.ts
// Signature HMAC-SHA256 v1 des payloads webhook + vérif constant-time.
// Format header : `X-Renocal-Signature: t=<timestamp>,v1=<hex>`
// Le timestamp empêche les replays (rejeter si > 5 min de skew).

import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SEC = 5 * 60; // 5 min

/** Sérialise un payload + timestamp et retourne la signature hex. */
export function signWebhookPayload(secret: string, payload: string, timestamp: number): string {
  const signedPayload = `${timestamp}.${payload}`;
  return createHmac("sha256", secret).update(signedPayload).digest("hex");
}

/** Construit le header complet `X-Renocal-Signature` à envoyer. */
export function buildSignatureHeader(secret: string, payload: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const sig = signWebhookPayload(secret, payload, timestamp);
  return `t=${timestamp},v1=${sig}`;
}

/**
 * Vérifie un header de signature. Retourne true si valide ET dans la tolérance.
 * Comparaison constant-time pour éviter le timing leak.
 */
export function verifySignature(secret: string, payload: string, header: string, now = Math.floor(Date.now() / 1000)): boolean {
  // Parse "t=<ts>,v1=<hex>[,v1=<hex>...]"
  const parts = header.split(",").map(s => s.trim());
  let ts: number | null = null;
  const sigs: string[] = [];
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq < 0) continue;
    const key = p.slice(0, eq);
    const val = p.slice(eq + 1);
    if (key === "t") ts = Number(val);
    else if (key === "v1") sigs.push(val);
  }
  if (!ts || sigs.length === 0) return false;
  if (Math.abs(now - ts) > TOLERANCE_SEC) return false;

  const expected = signWebhookPayload(secret, payload, ts);
  const expectedBuf = Buffer.from(expected, "hex");

  for (const sig of sigs) {
    let candidate: Buffer;
    try { candidate = Buffer.from(sig, "hex"); } catch { continue; }
    if (candidate.length !== expectedBuf.length) continue;
    if (timingSafeEqual(candidate, expectedBuf)) return true;
  }
  return false;
}

/**
 * Calcule le délai avant la prochaine tentative (en secondes).
 * 6 paliers : 1m, 5m, 30m, 2h, 6h, 24h. Au-delà → fail.
 */
export const RETRY_BACKOFF_SEC = [60, 300, 1800, 7200, 21600, 86400] as const;

export function nextRetryDelaySec(attemptCount: number): number | null {
  if (attemptCount < 0 || attemptCount >= RETRY_BACKOFF_SEC.length) return null;
  return RETRY_BACKOFF_SEC[attemptCount];
}

/** Génère un secret pour un nouveau webhook : `whsec_<32 chars hex>`. */
export function generateWebhookSecret(): string {
  // 16 bytes = 32 hex chars, suffisant pour HMAC-SHA256
  const bytes = require("node:crypto").randomBytes(16) as Buffer;
  return `whsec_${bytes.toString("hex")}`;
}
