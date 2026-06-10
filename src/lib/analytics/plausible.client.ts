// lib/analytics/plausible.client.ts
// Helper client-side pour tracker un évènement Plausible custom.
// No-op silencieux si window.plausible n'est pas chargé (mode MOCK / dev).

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

export function trackClientEvent(
  name: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.plausible === "function") {
      window.plausible(name, props ? { props } : undefined);
    } else if (process.env.NODE_ENV !== "production") {
      // Mode dev / mock : on log dans la console pour debug
      console.info(`[plausible:mock] ${name}`, props ?? {});
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[plausible] trackClientEvent failed:", err);
    }
  }
}
