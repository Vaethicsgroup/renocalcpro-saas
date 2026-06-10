// i18n/routing.ts — Configuration next-intl 5 langues.
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "es", "de", "pt"] as const,
  defaultLocale: "fr",
  localePrefix: "always",
  // Détection accept-language → fallback fr.
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];
