// lib/security/turnstile.ts
// Wrapper Cloudflare Turnstile (challenge anti-bot privacy-friendly).
// Mode MOCK : si TURNSTILE_SECRET_KEY absente, verifyTurnstileToken renvoie true.

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY ?? "";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export const TURNSTILE_ENABLED = Boolean(SITE_KEY && TURNSTILE_SECRET);
export const TURNSTILE_SITE_KEY = SITE_KEY;

interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

/**
 * Vérifie un token Turnstile côté serveur.
 * Mode MOCK : retourne true (utile en dev / sans clé).
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<{ valid: boolean; error?: string }> {
  if (!TURNSTILE_ENABLED) {
    return { valid: true };
  }
  if (!token) return { valid: false, error: "missing_token" };

  try {
    const params = new URLSearchParams({
      secret: TURNSTILE_SECRET,
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {}),
    });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { valid: false, error: `http_${res.status}` };
    const data = (await res.json()) as TurnstileResponse;
    return data.success
      ? { valid: true }
      : { valid: false, error: (data["error-codes"] ?? ["unknown"]).join(",") };
  } catch (e) {
    return { valid: false, error: String(e) };
  }
}
