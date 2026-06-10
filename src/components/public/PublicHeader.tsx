// components/public/PublicHeader.tsx
// @deprecated v2.0 — Utiliser <HeaderPremium locale={…}> à la place.
// Re-export pour rétrocompat. Sera supprimé Sprint v2.4.

import { HeaderPremium } from "@/components/marketing/HeaderPremium";

/** @deprecated Utiliser HeaderPremium */
export function PublicHeader({ locale = "fr" }: { locale?: string }) {
  return <HeaderPremium locale={locale} />;
}
