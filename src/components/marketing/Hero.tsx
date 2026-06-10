// components/marketing/Hero.tsx
// @deprecated v2.0 — Utiliser <HeroPremium> à la place. Voir docs/UX-UI-PREMIUM-DELIVERY.md.
// Ce fichier ne sert plus que de re-export pour rétrocompatibilité éventuelle.
// Sera supprimé Sprint v2.4.

import { HeroPremium } from "./HeroPremium";

/** @deprecated Utiliser HeroPremium */
export function Hero({ locale = "fr" }: { locale?: string }) {
  return <HeroPremium locale={locale} />;
}
