// lib/observability/plausible.ts
// Wrapper Plausible Analytics — sans cookie, RGPD-safe.
// Si PLAUSIBLE_DOMAIN absent → mode MOCK (logs côté serveur uniquement).

const DOMAIN  = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "";
const SCRIPT  = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT ?? "https://plausible.io/js/script.outbound-links.js";
const API_URL = process.env.PLAUSIBLE_API_URL ?? "https://plausible.io/api/event";

export const PLAUSIBLE_ENABLED = Boolean(DOMAIN);

/**
 * Envoie un évènement custom côté serveur (utilisé par les webhooks et server actions).
 * Côté client, utiliser window.plausible('Event Name', { props }).
 */
export async function trackServerEvent(
  name: string,
  props?: Record<string, string | number | boolean>,
  request?: { url: string; userAgent: string; ip?: string },
): Promise<void> {
  if (!PLAUSIBLE_ENABLED || !request) return;
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": request.userAgent,
        ...(request.ip ? { "X-Forwarded-For": request.ip } : {}),
      },
      body: JSON.stringify({
        name,
        url: request.url,
        domain: DOMAIN,
        props,
      }),
    });
  } catch (err) {
    console.warn("[plausible] track failed:", err);
  }
}

export const PlausibleConfig = { DOMAIN, SCRIPT };
